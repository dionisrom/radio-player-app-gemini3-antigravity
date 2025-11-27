/**
 * Main Application
 */
class App {
    constructor() {
        this.api = new RadioApi();
        this.audio = new AudioManager();
        this.visualizer = null;

        this.stations = [];
        this.favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        this.countries = [];
        this.tags = [];

        this.currentStation = null;
        this.currentPlaylist = [];
        this.page = 0;
        this.isLoading = false;
        this.currentTab = 'stations';
        this.searchQuery = '';
        this.filterCountry = '';
        this.filterTag = '';

        this.elStationList = document.getElementById('station-list');
        this.elScrollContainer = document.getElementById('scroll-container');
        this.elSearch = document.getElementById('search-input');
        this.elPlayBtn = document.getElementById('play-btn');
        this.elVizCanvas = document.getElementById('visualizer-canvas');

        this.init();
    }

    init() {
        this.visualizer = new Visualizer(this.elVizCanvas, this.audio);
        this.visualizer.start();
        this.applyTheme();

        this.loadStations();
        this.loadFilters();
        this.setupFilterDropdowns();

        this.elSearch.addEventListener('input', this.debounce((e) => {
            this.searchQuery = e.target.value;
            this.page = 0;
            this.stations = [];
            this.loadStations();
        }, 500));

        const filterCountryInput = document.getElementById('filter-country');
        const filterTagInput = document.getElementById('filter-tag');

        filterCountryInput.addEventListener('input', this.debounce((e) => {
            this.filterCountry = e.target.value;
            this.page = 0;
            this.stations = [];
            this.loadStations();
        }, 500));

        filterTagInput.addEventListener('input', this.debounce((e) => {
            this.filterTag = e.target.value;
            this.page = 0;
            this.stations = [];
            this.loadStations();
        }, 500));

        document.getElementById('filter-toggle').addEventListener('click', () => {
            const section = document.getElementById('filter-section');
            const icon = document.querySelector('#filter-toggle .fa-chevron-down');
            section.classList.toggle('hidden');
            section.classList.toggle('flex');
            icon.style.transform = section.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
        });

        document.querySelectorAll('.genre-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.genre-btn').forEach(b => {
                    b.classList.remove('bg-white/20', 'text-white');
                    b.classList.add('bg-white/5', 'text-slate-300');
                });
                e.target.classList.remove('bg-white/5', 'text-slate-300');
                e.target.classList.add('bg-white/20', 'text-white');

                const genre = e.target.dataset.genre;
                this.searchQuery = '';
                this.elSearch.value = '';

                if (genre) {
                    this.filterTag = genre;
                    document.getElementById('filter-tag').value = genre;
                } else {
                    this.filterTag = '';
                    document.getElementById('filter-tag').value = '';
                }

                this.page = 0;
                this.stations = [];
                this.loadStations();
            });
        });

        const tabStations = document.getElementById('tab-stations');
        const tabFavorites = document.getElementById('tab-favorites');
        if (tabStations) tabStations.addEventListener('click', () => this.switchTab('stations'));
        if (tabFavorites) tabFavorites.addEventListener('click', () => this.switchTab('favorites'));

        this.elScrollContainer.addEventListener('scroll', () => {
            if (this.currentTab === 'stations' &&
                this.elScrollContainer.scrollTop + this.elScrollContainer.clientHeight >= this.elScrollContainer.scrollHeight - 50) {
                this.loadStations();
            }
        });

        this.elPlayBtn.addEventListener('click', () => {
            if (this.currentStation) {
                this.audio.toggle();
                this.updatePlayButton();
            }
        });

        document.getElementById('btn-prev').addEventListener('click', () => this.playPrevious());
        document.getElementById('btn-next').addEventListener('click', () => this.playNext());

        document.getElementById('volume-slider').addEventListener('input', (e) => {
            this.audio.setVolume(e.target.value);
        });

        document.getElementById('mute-btn').addEventListener('click', () => {
            const slider = document.getElementById('volume-slider');
            if (this.audio.audio.volume > 0) {
                this.audio.setVolume(0);
                slider.value = 0;
            } else {
                this.audio.setVolume(0.8);
                slider.value = 0.8;
            }
        });

        document.getElementById('viz-mode-btn').addEventListener('click', () => {
            this.visualizer.toggleMode();
        });

        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Initialize volume
        const volumeSlider = document.getElementById('volume-slider');
        this.audio.setVolume(volumeSlider.value);

        new Sortable(this.elStationList, {
            animation: 150,
            handle: '.drag-handle',
            onEnd: (evt) => {
                if (this.currentTab === 'favorites') {
                    const item = this.favorites.splice(evt.oldIndex, 1)[0];
                    this.favorites.splice(evt.newIndex, 0, item);
                    this.saveFavorites();
                }
            }
        });

        this.audio.onMetadata = (meta) => {
            if (meta && meta.StreamTitle) {
                if (this.metadataTimeout) {
                    clearTimeout(this.metadataTimeout);
                    this.metadataTimeout = null;
                }
                const songInfo = document.getElementById('player-song-info');
                songInfo.textContent = meta.StreamTitle;
                songInfo.classList.remove('animate-pulse');
                if (this.currentStation) {
                    this.audio.updateMediaSession(this.currentStation, meta.StreamTitle);
                }
            }
        };

        // Set a timeout to update the UI if no metadata arrives
        this.metadataTimeout = null;

        // Setup Import/Export functionality
        this.setupImportExport();

        // Listen for playback state changes
        this.audio.onStateChange = (isPlaying) => {
            this.updatePlayButton();
        };
    }

    setupImportExport() {
        // Create import/export buttons container
        const tabsDiv = document.querySelector('.flex.gap-2.border-b.border-white\\/10');
        if (tabsDiv && !document.getElementById('favorites-controls')) {
            const controlsDiv = document.createElement('div');
            controlsDiv.id = 'favorites-controls';
            controlsDiv.className = 'hidden p-2 flex gap-2 border-b border-white/10';
            controlsDiv.innerHTML = `
                <button id="export-btn" class="flex-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-colors flex items-center justify-center gap-2">
                    <i class="fa-solid fa-download"></i>Export
                </button>
                <button id="import-btn" class="flex-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-colors flex items-center justify-center gap-2">
                    <i class="fa-solid fa-upload"></i>Import
                </button>
            `;

            // Insert after tabs
            tabsDiv.parentNode.insertBefore(controlsDiv, tabsDiv.nextSibling);

            // Create hidden file input
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.id = 'import-file-input';
            fileInput.accept = '.json';
            fileInput.className = 'hidden';
            document.body.appendChild(fileInput);
        }

        // Add event listeners
        const exportBtn = document.getElementById('export-btn');
        const importBtn = document.getElementById('import-btn');
        const fileInput = document.getElementById('import-file-input');

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportFavorites());
        }

        if (importBtn) {
            importBtn.addEventListener('click', () => {
                fileInput.click();
            });
        }

        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.importFavorites(e));
        }
    }

    switchTab(tab) {
        this.currentTab = tab;
        const tabStations = document.getElementById('tab-stations');
        const tabFavorites = document.getElementById('tab-favorites');
        const favoritesControls = document.getElementById('favorites-controls');

        if (tab === 'stations') {
            tabStations.classList.add('active');
            tabFavorites.classList.remove('active');
            if (favoritesControls) favoritesControls.classList.add('hidden');
        } else {
            tabStations.classList.remove('active');
            tabFavorites.classList.add('active');
            if (favoritesControls) favoritesControls.classList.remove('hidden');
        }
        this.renderList();
    }

    async loadStations() {

        if (this.isLoading) return;
        this.isLoading = true;
        const loadingEl = document.getElementById('loading-more');
        if (loadingEl) loadingEl.classList.remove('hidden');

        const newStations = await this.api.getStations(
            this.searchQuery,
            this.filterCountry,
            this.filterTag,
            20,
            this.page * 20
        );

        if (newStations.length > 0) {
            this.stations = [...this.stations, ...newStations];
            this.page++;
            this.renderList();
        }

        this.isLoading = false;
        const loadingEl2 = document.getElementById('loading-more');
        if (loadingEl2) loadingEl2.classList.add('hidden');
    }

    async loadFilters() {
        this.countries = await this.api.getCountries();
        this.tags = await this.api.getTags();
    }

    setupFilterDropdowns() {
        const setupDropdown = (inputId, listId, dataKey, nameKey) => {
            const input = document.getElementById(inputId);
            const list = document.getElementById(listId);

            input.addEventListener('input', (e) => {
                const val = input.value.toLowerCase();
                if (val.length < 1) {
                    list.classList.add('hidden');
                    return;
                }

                const matches = this[dataKey].filter(item =>
                    item[nameKey].toLowerCase().includes(val)
                ).slice(0, 10);

                if (matches.length > 0) {
                    list.innerHTML = matches.map(item => `
                        <li class="px-3 py-2 hover:bg-white/10 cursor-pointer text-xs text-slate-300 transition-colors"
                            onclick="app.selectFilter('${inputId}', '${listId}', '${item[nameKey].replace(/'/g, "\\'")}')">
                            ${item[nameKey]} <span class="opacity-50 text-[10px] ml-1">(${item.stationcount})</span>
                        </li>
                    `).join('');
                    list.classList.remove('hidden');
                } else {
                    list.classList.add('hidden');
                }
            });

            document.addEventListener('click', (e) => {
                if (!input.contains(e.target) && !list.contains(e.target)) {
                    list.classList.add('hidden');
                }
            });

            input.addEventListener('focus', () => {
                if (input.value.length >= 1) {
                    input.dispatchEvent(new Event('input'));
                }
            });
        };

        setupDropdown('filter-country', 'country-suggestions', 'countries', 'name');
        setupDropdown('filter-tag', 'tag-suggestions', 'tags', 'name');
    }

    selectFilter(inputId, listId, value) {
        const input = document.getElementById(inputId);
        input.value = value;
        document.getElementById(listId).classList.add('hidden');
        input.dispatchEvent(new Event('input'));
    }

    renderList() {
        const list = this.currentTab === 'favorites' ? this.favorites : this.stations;
        this.elStationList.innerHTML = list.map((station, index) => {
            const isFav = this.favorites.find(f => f.stationuuid === station.stationuuid);
            const isPlaying = this.currentStation && this.currentStation.stationuuid === station.stationuuid;
            return `
                <div class="group flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors cursor-pointer ${isPlaying ? 'bg-white/10 border border-pink-500/30' : 'border border-transparent'}"
                    onclick="app.playStationByUuid('${station.stationuuid}')">
                    ${this.currentTab === 'favorites' ? '<i class="drag-handle fa-solid fa-grip-vertical text-white/20 hover:text-white/60 cursor-grab"></i>' : ''}
                    <div class="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                        ${station.favicon ? `<img src="${station.favicon}" onerror="this.style.display='none'" class="w-full h-full object-cover">` : ''}
                        <i class="fa-solid fa-music text-white/20 absolute ${station.favicon ? 'z-[-1]' : ''}"></i>
                        ${isPlaying ? '<div class="absolute inset-0 bg-pink-500/20 flex items-center justify-center"><i class="fa-solid fa-chart-simple animate-pulse text-pink-400"></i></div>' : ''}
                    </div>
                    <div class="flex-1 min-w-0">
                        <h3 class="font-medium text-sm truncate text-slate-100">${station.name}</h3>
                        <p class="text-xs text-slate-400 truncate">${station.tags || 'Unknown Genre'}</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/20 text-slate-400 border border-white/5">${station.bitrate}k</span>
                        <button onclick="event.stopPropagation(); app.toggleFavorite('${station.stationuuid}')" 
                            class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors ${isFav ? 'text-yellow-400' : 'text-white/20'}">
                            <i class="fa-${isFav ? 'solid' : 'regular'} fa-star"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    playStationByUuid(uuid) {
        const list = this.currentTab === 'favorites' ? this.favorites : this.stations;
        const station = list.find(s => s.stationuuid === uuid);

        if (station) {
            this.currentPlaylist = list;
            this.playStation(station);
        } else {
            // Fallback: check other list if not found in current (e.g. if switching tabs quickly)
            const otherList = this.currentTab === 'favorites' ? this.stations : this.favorites;
            const otherStation = otherList.find(s => s.stationuuid === uuid);
            if (otherStation) {
                this.currentPlaylist = otherList;
                this.playStation(otherStation);
            }
        }
    }

    playNext() {
        if (!this.currentStation || this.currentPlaylist.length === 0) return;

        const currentIndex = this.currentPlaylist.findIndex(s => s.stationuuid === this.currentStation.stationuuid);
        if (currentIndex === -1) return;

        const nextIndex = (currentIndex + 1) % this.currentPlaylist.length;
        this.playStation(this.currentPlaylist[nextIndex]);
    }

    playPrevious() {
        if (!this.currentStation || this.currentPlaylist.length === 0) return;

        const currentIndex = this.currentPlaylist.findIndex(s => s.stationuuid === this.currentStation.stationuuid);
        if (currentIndex === -1) return;

        const prevIndex = (currentIndex - 1 + this.currentPlaylist.length) % this.currentPlaylist.length;
        this.playStation(this.currentPlaylist[prevIndex]);
    }

    playStation(station) {
        this.currentStation = station;
        this.audio.play(station.url_resolved || station.url);

        // Update UI
        document.getElementById('player-station-name').textContent = station.name;
        document.getElementById('player-song-info').textContent = station.tags || 'Loading...';
        document.getElementById('player-genre').textContent = station.tags?.split(',')[0] || 'Radio';

        // Update player icon
        const playerIcon = document.getElementById('player-icon');
        if (station.favicon) {
            playerIcon.innerHTML = '';
            const img = document.createElement('img');
            img.src = station.favicon;
            img.className = 'w-full h-full object-cover rounded-lg md:rounded-xl';
            img.onerror = () => {
                playerIcon.innerHTML = '<i class="fa-solid fa-music text-xl md:text-2xl text-white"></i>';
            };
            playerIcon.appendChild(img);
        } else {
            playerIcon.innerHTML = '<i class="fa-solid fa-music text-xl md:text-2xl text-white"></i>';
        }

        // Setup metadata listener
        this.audio.onMetadata = (meta) => {
            const songInfo = meta.StreamTitle || meta.title || station.tags || 'Now Playing';
            document.getElementById('player-song-info').textContent = songInfo;
            // Update media session with current song
            this.audio.updateMediaSession(station, meta.StreamTitle || meta.title);
        };

        // Tech info
        const techInfo = document.getElementById('player-tech-info');
        const parts = [];
        if (station.bitrate) parts.push(station.bitrate + ' kbps');
        if (station.codec) parts.push(station.codec);
        techInfo.textContent = parts.join(' • ');



        // Update media session immediately on station start
        this.audio.updateMediaSession(station);

        this.updatePlayButton();
        this.renderList();
    }

    toggleFavorite(uuid) {
        const existingIdx = this.favorites.findIndex(f => f.stationuuid === uuid);
        if (existingIdx >= 0) {
            this.favorites.splice(existingIdx, 1);
        } else {
            const station = this.stations.find(s => s.stationuuid === uuid);
            if (station) this.favorites.push(station);
        }
        this.saveFavorites();
        this.renderList();
    }

    saveFavorites() {
        localStorage.setItem('favorites', JSON.stringify(this.favorites));
    }

    updatePlayButton() {
        const btn = document.getElementById('play-btn');
        const icon = btn.querySelector('i');

        if (this.audio.isPlaying) {
            icon.className = 'fa-solid fa-pause text-base md:text-xl';
        } else {
            icon.className = 'fa-solid fa-play text-base md:text-xl ml-0.5 md:ml-1';
            // Clear metadata if no station is playing
            if (!this.currentStation) {
                this.audio.clearMediaSession();
            }
        }

        // Update MediaSession playback state (centralized in audio-manager)
        this.audio.updatePlaybackState();
    }

    toggleTheme() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', this.theme);
        this.applyTheme();
    }

    applyTheme() {
        const html = document.documentElement;
        const icon = document.querySelector('#theme-toggle i');
        if (this.theme === 'dark') {
            html.classList.add('dark');
            if (icon) {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        } else {
            html.classList.remove('dark');
            if (icon) {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            }
        }
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    exportFavorites() {
        if (this.favorites.length === 0) {
            alert('No favorites to export!');
            return;
        }

        // Create JSON blob
        const dataStr = JSON.stringify(this.favorites, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        // Create download link
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        const timestamp = new Date().toISOString().split('T')[0];
        link.download = `radio-favorites-${timestamp}.json`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    importFavorites(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);

                if (!Array.isArray(imported)) {
                    alert('Invalid file format!');
                    return;
                }

                // Merge with existing favorites (avoid duplicates based on stationuuid)
                const existingUUIDs = new Set(this.favorites.map(f => f.stationuuid));
                const newFavorites = imported.filter(station => !existingUUIDs.has(station.stationuuid));

                this.favorites = [...this.favorites, ...newFavorites];
                localStorage.setItem('favorites', JSON.stringify(this.favorites));

                // Show success message
                alert(`Successfully imported ${newFavorites.length} new stations!\nTotal favorites: ${this.favorites.length}`);

                if (this.currentTab === 'favorites') {
                    this.renderList();
                }
            } catch (error) {
                alert('Error reading file! Please make sure it\'s a valid JSON file.');
            }
        };

        reader.readAsText(file);

        // Reset file input so the same file can be selected again
        event.target.value = '';
    }
}

// Initialize app when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
