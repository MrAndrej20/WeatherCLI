import request from "got";
import { formattedMessage } from "../lib";

export class IPApi {
    private readonly baseUrl = "http://ip-api.com";

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

namespace IPApi {

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

