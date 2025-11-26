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
        this.onMetadata = null;

        // Set up MediaSession handlers once during initialization
        this.setupMediaSessionHandlers();
    }

    setupMediaSessionHandlers() {
        if ('mediaSession' in navigator) {
            // Set up action handlers for media controls - only once
            navigator.mediaSession.setActionHandler('play', () => {
                console.log('MediaSession: Play action');
                if (!this.isPlaying) {
                    this.toggle();
                }
            });

            navigator.mediaSession.setActionHandler('pause', () => {
                console.log('MediaSession: Pause action');
                if (this.isPlaying) {
                    this.toggle();
                }
            });

            navigator.mediaSession.setActionHandler('stop', () => {
                console.log('MediaSession: Stop action');
                if (this.isPlaying) {
                    this.toggle();
                }
            });

            // Next/Previous handlers - will be connected to app navigation
            navigator.mediaSession.setActionHandler('nexttrack', () => {
                console.log('MediaSession: Next track action');
                if (window.app && window.app.playNext) {
                    window.app.playNext();
                }
            });

            navigator.mediaSession.setActionHandler('previoustrack', () => {
                console.log('MediaSession: Previous track action');
                if (window.app && window.app.playPrevious) {
                    window.app.playPrevious();
                }
            });

            // Seek handlers (optional - some browsers/cars support this)
            try {
                navigator.mediaSession.setActionHandler('seekbackward', () => {
                    console.log('MediaSession: Seek backward (skip to previous)');
                    if (window.app && window.app.playPrevious) {
                        window.app.playPrevious();
                    }
                });

                navigator.mediaSession.setActionHandler('seekforward', () => {
                    console.log('MediaSession: Seek forward (skip to next)');
                    if (window.app && window.app.playNext) {
                        window.app.playNext();
                    }
                });
            } catch (error) {
                // Some browsers don't support seek actions
                console.log('Seek actions not supported:', error.message);
            }

            console.log('MediaSession action handlers initialized');
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
        if (!this.corsEnabled) {
            console.log('Visualizer disabled due to CORS restrictions');
            return;
        }
        try {
            this.source = this.context.createMediaElementSource(this.audio);
            this.source.connect(this.analyser);
            this.analyser.connect(this.gainNode);
            // Re-ensure gain is connected to destination
            this.gainNode.connect(this.context.destination);
            console.log('Audio graph connected: Source -> Analyser -> Gain -> Destination');
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
                console.log('Audio source disconnected from visualizer');
            } catch (e) {
                console.warn('Error disconnecting source:', e);
            }
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
                        console.log('Metadata received:', meta);
                        if (this.onMetadata) {
                            this.onMetadata(meta);
                        }
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
                            console.log('CORS/Network error detected - switching to plain HTML5 audio (no metadata)');

                            // Stop and cleanup IcecastMetadataPlayer completely
                            if (this.icecastPlayer) {
                                try {
                                    this.icecastPlayer.stop();
                                    this.icecastPlayer.detachAudioElement();
                                } catch (e) {
                                    console.warn('Error detaching IcecastMetadataPlayer:', e);
                                }
                                this.icecastPlayer = null;
                            }

                            // Small delay to ensure IcecastMetadataPlayer has released the audio element
                            setTimeout(() => {
                                this.playWithoutCORS(url);
                            }, 100);
                        }
                    }
                });

                this.icecastPlayer.play();

                // Try to connect for visualizer, but don't fail if CORS blocks it
                this.connectTimeout = setTimeout(() => {
                    if (this.corsEnabled && this.isPlaying && this.icecastPlayer) {
                        this.connectSource();
                    }
                }, 500);

            } catch (e) {
                console.error('IcecastMetadataPlayer failed to initialize:', e);
                // If initialization fails, use plain HTML5 audio
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
        console.log('Playing with plain HTML5 audio (CORS-free mode)');
        this.corsEnabled = false;

        // Clear any pending connectSource timeout
        if (this.connectTimeout) {
            clearTimeout(this.connectTimeout);
            this.connectTimeout = null;
        }

        // Save current volume
        const currentVolume = this.audio.volume || 0.8;
        console.log('Current volume before CORS-free playback:', currentVolume);

        // Stop the old audio element completely
        try {
            this.audio.pause();
            this.audio.src = '';
            this.audio.load(); // Force unload
        } catch (e) { }

        // Disconnect old source if it exists
        this.disconnectSource();

        // NUCLEAR OPTION: Create a brand new audio element to ensure no lingering source connections
        // This fixes the "MediaElementAudioSource outputs zeroes" issue definitively
        this.audio = new Audio();

        // Restore volume to new element
        this.audio.volume = currentVolume;
        console.log('Created fresh Audio element. Volume set to:', this.audio.volume);

        // Play the new element
        this.audio.src = url;
        this.audio.load();

        this.audio.play()
            .then(() => {
                console.log('Playback started successfully with FRESH audio element');
                this.isPlaying = true;
            })
            .catch(e => {
                console.error("Playback failed with fresh audio element:", e);
                this.isPlaying = false;
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
                            if (this.onMetadata) {
                                this.onMetadata({ StreamTitle: cue.text });
                            }
                        }
                    }
                }

                // Try to get from navigator.mediaSession if available
                if ('mediaSession' in navigator && navigator.mediaSession.metadata) {
                    const title = navigator.mediaSession.metadata.title;
                    if (title && title !== lastTitle && title !== 'Select a Station') {
                        lastTitle = title;
                        console.log('Metadata from mediaSession:', title);
                    }
                }
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
        } else {
            this.audio.play();
            if (this.icecastPlayer) this.icecastPlayer.play();
            this.isPlaying = true;
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

            console.log('MediaSession updated:', {
                title: songTitle || station.name,
                artist: songTitle ? station.name : station.tags,
                state: this.isPlaying ? 'playing' : 'paused'
            });
        }
    }

    clearMediaSession() {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = null;
            navigator.mediaSession.playbackState = 'none';
            console.log('MediaSession cleared');
        }
    }

    updatePlaybackState() {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = this.isPlaying ? 'playing' : 'paused';
            console.log('MediaSession playback state updated:', this.isPlaying ? 'playing' : 'paused');
        }
    }
}
