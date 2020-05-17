const request = require('got');
const { formattedMessage } = require("../lib");

exports.IPApi = class IPApi {
    constructor() {
        this.baseUrl = 'http://ip-api.com';
    }

    async getCity() {
        try {
            const { body: { city } } = await request(`${this.baseUrl}/json?fields=city`, {
                responseType: "json"
            });
            return city;
        } catch (err) {
            throw formattedMessage('Could not get Geo Location');
        }
    }
};
