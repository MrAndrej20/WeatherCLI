const request = require('got');
const { formattedMessage } = require('../lib');

/**
 * Class for integrating with ip-api.com
 * https://ip-api.com/
 *
 * @export
 * @class IPApi
 */
exports.IPApi = class IPApi {
    constructor() {
        this.baseUrl = 'http://ip-api.com';
    }

    /**
     * Sends a request towards IPApi to get city from geolocation
     *
     * @returns {Promise<string>}
     * @memberof IPApi
     */
    async getCity() {
        try {
            const { body: { city } } = await request(`${this.baseUrl}/json?fields=city`, {
                responseType: 'json'
            });
            return city;
        } catch (err) {
            throw formattedMessage('Could not get Geo Location');
        }
    }
};
