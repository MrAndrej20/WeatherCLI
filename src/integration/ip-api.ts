import request from "got";

export class IPApi {
    private readonly baseUrl = "http://ip-api.com";

    async getCity(): Promise<string> {
        try {
            const response = await request(`${this.baseUrl}/json?fields=city`);
            const { city } = JSON.parse(response.body);
            return city;
        } catch (err) {
            throw ["Could not get Geo Location"].join("\n");
        }
    }
}

namespace IPApi {

    export interface GetLocationResponse {
        base: string;
        visibility: number;
        dt: number;
        timezone: number;
        id: number;
        name: string;
        cod: number;
        coord: {
            lon: number;
            lat: number;
        };
        weather: {
            id: number;
            main: string;
            description: string;
            icon: string;
        }[];
        main: {
            temp: number;
            feels_like: number;
            temp_min: number;
            temp_max: number;
            pressure: number;
            humidity: number;
        };
        wind: {
            speed: number;
            deg: number;
        };
        clouds: {
            all: number;
        };
        sys: {
            type: number;
            id: number;
            country: string;
            sunrise: number;
            sunset: number;
        };
    }

    export interface GroupWeatherResponse {
        cnt: number;
        list: {
            coord: {
                lon: number;
                lat: number;
            };
            sys: {
                type: number;
                id: number;
                message: number;
                country: string;
                sunrise: number;
                sunset: number;
            };
            weather: {
                id: number;
                main: string;
                description: string;
                icon: string;
            }[];
            main: {
                temp: number;
                pressure: number;
                humidity: number;
                temp_min: number;
                temp_max: number;
            };
            visibility: number;
            wind: {
                speed: number;
                deg: number;
            };
            clouds: {
                all: number;
            };
            dt: number;
            id: number;
            name: string;
        }[];
    }

    export interface FindWeatherResponse {
        message: string;
        cod: string;
        count: number;
        list: {
            id: number;
            name: string;
            coord: {
                lat: number;
                lon: number;
            };
            main: {
                temp: number;
                feels_like: number;
                temp_min: number;
                temp_max: number;
                pressure: number;
                humidity: number;
            };
            dt: number;
            wind: {
                speed: number;
                deg: number;
            };
            sys: {
                country: string;
            };
            rain?: any;
            snow?: any;
            clouds: {
                all: number;
            };
            weather: {
                id: number;
                main: string;
                description: string;
                icon: string;
            }[];
        }[];
    }
}

