const request = require('got');

exports.IPApi = class IPApi {
    constructor() {
        this.baseUrl = 'http://ip-api.com';
    }

    async getCity() {
        try {
            const response = await request(`${this.baseUrl}/json?fields=city`);
            const { city } = JSON.parse(response.body);
            return city;
        } catch (err) {
            throw ['Could not get Geo Location'].join('\n');
        }
    }
};
