/**
 * Radio Browser API Wrapper
 */
class RadioApi {
    constructor() {
        this.baseUrl = 'https://de1.api.radio-browser.info/json';
    }

    async getStations(query = '', country = '', tag = '', limit = 20, offset = 0) {
        try {
            let url;
            const params = new URLSearchParams({
                limit: limit,
                offset: offset,
                hidebroken: true,
                order: 'clickcount',
                reverse: true
            });

            if (country) params.append('country', country);
            if (tag) params.append('tag', tag);

            if (query) {
                url = `${this.baseUrl}/stations/search?name=${encodeURIComponent(query)}&${params.toString()}`;
            } else if (tag) {
                url = `${this.baseUrl}/stations/search?${params.toString()}`;
            } else if (country) {
                url = `${this.baseUrl}/stations/search?${params.toString()}`;
            } else {
                url = `${this.baseUrl}/stations/topclick?${params.toString()}`;
            }

            const response = await fetch(url);
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return [];
        }
    }

    async sendClick(stationUuid) {
        try {
            await fetch(`${this.baseUrl}/url/${stationUuid}`);
        } catch (e) { }
    }

    async getCountries() {
        try {
            const response = await fetch(`${this.baseUrl}/countries?order=stationcount&reverse=true&limit=100`);
            return await response.json();
        } catch (error) {
            console.error('API Error (Countries):', error);
            return [];
        }
    }

    async getTags() {
        try {
            const response = await fetch(`${this.baseUrl}/tags?order=stationcount&reverse=true&limit=100`);
            return await response.json();
        } catch (error) {
            console.error('API Error (Tags):', error);
            return [];
        }
    }
}
