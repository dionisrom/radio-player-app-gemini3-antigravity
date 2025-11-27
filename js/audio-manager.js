/**
 * Audio Manager with Icecast Support
 */
class AudioManager {
    constructor() {
        this.audio = new Audio();
        this.context = null;
        this.source = null;
        this.analyser = null;
        this.gainNode = null;
        this.isPlaying = false;
        this.icecastPlayer = null;
        this.corsEnabled = false;
        this.corsEnabled = false;
        this.onMetadata = null;
        this.onStateChange = null;

        // Set up MediaSession handlers once during initialization
        this.setupMediaSessionHandlers();
    }

    setupMediaSessionHandlers() {
        if ('mediaSession' in navigator) {
            // Set up action handlers for media controls - only once
            navigator.mediaSession.setActionHandler('play', () => {
                if (!this.isPlaying) this.toggle();
            });

            navigator.mediaSession.setActionHandler('pause', () => {
                if (this.isPlaying) this.toggle();
            });

            navigator.mediaSession.setActionHandler('stop', () => {
                if (this.isPlaying) this.toggle();
            });

            // Next/Previous handlers - will be connected to app navigation
            navigator.mediaSession.setActionHandler('nexttrack', () => {
                if (window.app && window.app.playNext) window.app.playNext();
            });

            navigator.mediaSession.setActionHandler('previoustrack', () => {
                if (window.app && window.app.playPrevious) window.app.playPrevious();
            });

            // Seek handlers (optional - some browsers/cars support this)
            try {
                navigator.mediaSession.setActionHandler('seekbackward', () => {
                    if (window.app && window.app.playPrevious) window.app.playPrevious();
                });

                navigator.mediaSession.setActionHandler('seekforward', () => {
                    if (window.app && window.app.playNext) window.app.playNext();
                });
            } catch (error) {
                // Some browsers don't support seek actions
            }


        }
    }

    initAudioContext() {
        if (this.context) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.context = new AudioContext();
        this.analyser = this.context.createAnalyser();
        this.analyser.fftSize = 1024;
        this.analyser.smoothingTimeConstant = 0.85;
        this.gainNode = this.context.createGain();
        this.gainNode.connect(this.context.destination);
    }

    connectSource() {
        if (this.source) return;
        if (!this.corsEnabled) return;
        try {
            this.source = this.context.createMediaElementSource(this.audio);
            this.source.connect(this.analyser);
            this.analyser.connect(this.gainNode);
            this.gainNode.connect(this.context.destination);
        } catch (e) {
            console.warn("CORS restricted audio source - visualizer will not work", e);
            this.corsEnabled = false;
            // Stream will still play, just without visualizer
        }
    }

    disconnectSource() {
        // Disconnect and destroy the MediaElementAudioSource to prevent CORS "outputs zeroes" issue
        if (this.source) {
            try {
                this.source.disconnect();
            } catch (e) { }
            this.source = null;
        }
    }

    play(url) {
        if (!this.context) this.initAudioContext();
        if (this.context.state === 'suspended') this.context.resume();

        // Clear any existing metadata interval
        if (this.metadataInterval) {
            clearInterval(this.metadataInterval);
            this.metadataInterval = null;
        }

        // Set playing state immediately so UI updates correctly
        this.isPlaying = true;
        if (this.onStateChange) this.onStateChange(this.isPlaying);

        // Clear any pending connectSource timeout from previous streams
        if (this.connectTimeout) {
            clearTimeout(this.connectTimeout);
            this.connectTimeout = null;
        }

        if (this.icecastPlayer) {
            try {
                this.icecastPlayer.stop();
                this.icecastPlayer.detachAudioElement();
            } catch (e) { }
            this.icecastPlayer = null;
        }

        // Try IcecastMetadataPlayer first (for metadata support)
        if (window.IcecastMetadataPlayer) {
            try {
                this.audio.crossOrigin = "anonymous";
                this.corsEnabled = true;

                this.icecastPlayer = new IcecastMetadataPlayer(url, {
                    audioElement: this.audio,
                    onMetadata: (meta) => {
                        if (this.onMetadata) this.onMetadata(meta);
                    },
                    onError: (message, error) => {
                        console.warn("Icecast Player Error:", message, error);

                        // Check for CORS/network errors - these prevent playback entirely
                        // Common error patterns: "TypeError", "Failed to fetch", "NetworkError"
                        const errorStr = error?.toString() || '';
                        const messageStr = message?.toString() || '';

                        const isCORSError =
                            messageStr.includes('CORS') ||
                            messageStr.includes('cross-origin') ||
                            messageStr.includes('TypeError') ||
                            messageStr.includes('Failed to fetch') ||
                            messageStr.includes('NetworkError') ||
                            errorStr.includes('CORS') ||
                            errorStr.includes('Failed to fetch') ||
                            errorStr.includes('NetworkError');

                        if (isCORSError) {
                            // Stop and cleanup IcecastMetadataPlayer completely
                            if (this.icecastPlayer) {
                                try {
                                    this.icecastPlayer.stop();
                                    this.icecastPlayer.detachAudioElement();
                                } catch (e) { }
                                this.icecastPlayer = null;
                            }

                            // Small delay to ensure IcecastMetadataPlayer has released the audio element
                            setTimeout(() => {
                                this.playWithoutCORS(url);
                            }, 100);
                        }
                    }
                });

                this.icecastPlayer.play().catch(e => {
                    // Ignore AbortError - this happens when switching stations quickly
                    if (e.name !== 'AbortError') {
                        console.error('IcecastMetadataPlayer play error:', e);
                    }
                });

                // Try to connect for visualizer, but don't fail if CORS blocks it
                this.connectTimeout = setTimeout(() => {
                    if (this.corsEnabled && this.isPlaying && this.icecastPlayer) {
                        this.connectSource();
                    }
                }, 500);

            } catch (e) {
                this.playWithoutCORS(url);
            }
        } else {
            // No IcecastMetadataPlayer available, use plain audio
            this.playWithoutCORS(url);
        }

        // Start polling for HTML5 audio metadata as fallback
        this.startMetadataPolling();
    }

    playWithoutCORS(url) {
        this.corsEnabled = false;

        // Set playing state immediately so UI updates
        this.isPlaying = true;
        if (this.onStateChange) this.onStateChange(this.isPlaying);
        this.updatePlaybackState();

        // Clear any pending connectSource timeout
        if (this.connectTimeout) {
            clearTimeout(this.connectTimeout);
            this.connectTimeout = null;
        }

        const currentVolume = this.audio.volume || 0.8;

        // Stop the old audio element completely
        try {
            this.audio.pause();
            this.audio.src = '';
            this.audio.load(); // Force unload
        } catch (e) { }

        // Disconnect old source if it exists
        this.disconnectSource();

        // Create a brand new audio element to ensure no lingering source connections
        this.audio = new Audio();
        this.audio.volume = currentVolume;

        // Play the new element
        this.audio.src = url;
        this.audio.load();

        this.audio.play()
            .catch(e => {
                // Ignore AbortError - this happens when switching stations quickly
                if (e.name !== 'AbortError') {
                    console.error("Playback failed with fresh audio element:", e);
                }
                this.isPlaying = false;
                if (this.onStateChange) this.onStateChange(this.isPlaying);
                this.updatePlaybackState();
            });
    }

    startMetadataPolling() {
        let lastTitle = '';

        // Check for metadata every 5 seconds
        this.metadataInterval = setInterval(() => {
            // Try to get metadata from the audio element's media session
            if (this.audio && this.audio.readyState >= 2) {
                // Some streams put metadata in textTracks
                if (this.audio.textTracks && this.audio.textTracks.length > 0) {
                    const track = this.audio.textTracks[0];
                    if (track.activeCues && track.activeCues.length > 0) {
                        const cue = track.activeCues[0];
                        if (cue.text && cue.text !== lastTitle) {
                            lastTitle = cue.text;
                            if (this.onMetadata) this.onMetadata({ StreamTitle: cue.text });
                        }
                    }
                }

                // Try to get from navigator.mediaSession if available

            }
        }, 5000);
    }

    fallbackPlay(url) {
        this.audio.src = url;
        this.audio.load();
        this.audio.play().catch(e => console.error("Playback failed", e));
        this.isPlaying = true;
        if (this.corsEnabled) this.connectSource();
    }

    toggle() {
        if (this.isPlaying) {
            this.audio.pause();
            if (this.icecastPlayer) this.icecastPlayer.stop();
            this.isPlaying = false;
            if (this.onStateChange) this.onStateChange(this.isPlaying);
        } else {
            this.audio.play().catch(e => {
                // Ignore AbortError - this happens when pausing quickly after play
                if (e.name !== 'AbortError') {
                    console.error('Audio play error:', e);
                }
            });
            if (this.icecastPlayer) {
                this.icecastPlayer.play().catch(e => {
                    // Ignore AbortError
                    if (e.name !== 'AbortError') {
                        console.error('Icecast play error:', e);
                    }
                });
            }
            this.isPlaying = true;
            if (this.onStateChange) this.onStateChange(this.isPlaying);
        }
        // Update MediaSession playback state
        this.updatePlaybackState();
    }

    setVolume(val) {
        const volume = parseFloat(val);
        if (this.gainNode) this.gainNode.gain.value = volume;
        this.audio.volume = volume;
    }

    updateMediaSession(station, songTitle) {
        if ('mediaSession' in navigator) {
            // Update metadata with rich information
            const artworkUrl = station.favicon || '/icons/icon-512x512.png';

            navigator.mediaSession.metadata = new MediaMetadata({
                title: songTitle || station.name,
                artist: songTitle ? station.name : (station.tags || 'Radio Station'),
                album: station.country || 'Internet Radio',
                artwork: [
                    { src: artworkUrl, sizes: '96x96', type: 'image/png' },
                    { src: artworkUrl, sizes: '128x128', type: 'image/png' },
                    { src: artworkUrl, sizes: '192x192', type: 'image/png' },
                    { src: artworkUrl, sizes: '256x256', type: 'image/png' },
                    { src: artworkUrl, sizes: '384x384', type: 'image/png' },
                    { src: artworkUrl, sizes: '512x512', type: 'image/png' }
                ]
            });

            // Update playback state
            navigator.mediaSession.playbackState = this.isPlaying ? 'playing' : 'paused';
        }
    }

    clearMediaSession() {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = null;
            navigator.mediaSession.playbackState = 'none';
        }
    }

    updatePlaybackState() {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = this.isPlaying ? 'playing' : 'paused';
        }
    }
}
