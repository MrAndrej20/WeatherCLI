import request from "got";
import { formattedMessage } from "../lib";

/**
 * Class for integrating with ip-api.com
 * https://ip-api.com/
 *
 * @export
 * @class IPApi
 */
export class IPApi {
    private readonly baseUrl = "http://ip-api.com";

    /**
     * Sends a request towards IPApi to get city from geolocation
     *
     * @returns {Promise<string>}
     * @memberof IPApi
     */
    async getCity(): Promise<string> {
        try {
            const { body: { city } } = await request<IPApi.GetLocationResponse>(`${this.baseUrl}/json?fields=city`, {
                responseType: "json"
            });
            return city;
        } catch (err) {
            throw formattedMessage("Could not get Geo Location");
        }
    }
}

/**
 * Namespace of all IPApi responses
 *
 */
namespace IPApi {

    /**
     * Response Body from Get Location Request
     *
     * @export
     * @interface GetLocationResponse
     */
    export interface GetLocationResponse {
        query: string;
        status: string;
        country: string;
        countryCode: string;
        region: string;
        regionName: string;
        city: string;
        zip: string;
        lat: number;
        lon: number;
        timezone: string;
        isp: string;
        org: string;
        as: string;
    }
}

