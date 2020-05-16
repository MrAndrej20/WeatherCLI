import fs from "fs";
import request from "got";

interface CityListEntry {
    id: number;
    name: string;
    state: string;
    country: string;
    coord: {
        lon: number;
        lat: number;
    };
}

export type TemperatureUnit = "metric" | "imperial";

export class OpenWeather {
    private readonly baseUrl = "https://api.openweathermap.org/data/2.5";
    private readonly appId = "84c646a7cac391335fc2615712ec3e40";
    private cityList: CityListEntry[];

    private getCityList(): CityListEntry[] {
        if (!this.cityList) {
            this.cityList = JSON.parse(fs.readFileSync(`${__dirname}/../../../city-list.json`).toString());
        }
        return this.cityList;
    }

    async getCurrentWeatherMultipleCities(cityNames: string[], temperatureUnit: TemperatureUnit): Promise<string> {
        const cityIds = cityNames.map(cityName => {
            const city = this.getCityList().find(cl => cl.name.toLowerCase() === cityName.toLowerCase());
            if (!city) {
                throw [`City ${cityName} doesn't exist`].join("\n");
            }
            return city.id;
        });
        const qs = [
            `id=${encodeURIComponent(cityIds.join(","))}`,
            `units=${encodeURIComponent(temperatureUnit)}`,
            `appid=${encodeURIComponent(this.appId)}`,
        ].join("&");

        try {
            const response = await request(`${this.baseUrl}/group?${qs}`);
            const body = JSON.parse(response.body) as OpenWeather.GroupWeatherResponse;
            if (!body.list.length) {
                throw [`Could not get weather for ${cityNames.join()}`].join("\n");
            }
            return body.list.map(weather =>
                [
                    `City: ${weather.name}`,
                    `Temperature is: ${weather.main.temp}`,
                    `Humidity is: ${weather.main.humidity}`,
                    `Weather is: ${weather.weather.map(w => w.description).join()}`,
                ].join("\n")
            ).join("\n");
        } catch (err) {
            throw err;
        }
    }

    async getCurrentWeatherByCity(city: string, temperatureUnit: TemperatureUnit): Promise<string> {
        const qs = [
            `q=${encodeURIComponent(city)}`,
            `units=${encodeURIComponent(temperatureUnit)}`,
            `appid=${encodeURIComponent(this.appId)}`,
        ].join("&");

        try {
            const response = await request(`${this.baseUrl}/find?${qs}`);
            const body = JSON.parse(response.body) as OpenWeather.FindWeatherResponse;
            if (!body.list.length) {
                throw [`Could not get weather for ${city}`].join("\n");
            }
            const weather = body.list[0];
            return [
                `City: ${weather.name}`,
                `Temperature is: ${weather.main.temp}`,
                `Humidity is: ${weather.main.humidity}`,
                `Weather is: ${weather.weather.map(w => w.description).join()}`,
            ].join("\n");
        } catch (err) {
            throw err;
        }
    }
    async getCurrentWeatherByZipCode(zipCode: string, temperatureUnit: TemperatureUnit): Promise<string> {
        const qs = [
            `zip=${encodeURIComponent(zipCode)}`,
            `units=${encodeURIComponent(temperatureUnit)}`,
            `appid=${encodeURIComponent(this.appId)}`,
        ].join("&");

        try {
            const response = await request(`${this.baseUrl}/weather?${qs}`);
            const body = JSON.parse(response.body) as OpenWeather.CurrentWeatherResponse;
            return [
                `City: ${body.name}`,
                `Temperature is: ${body.main.temp}`,
                `Humidity is: ${body.main.humidity}`,
                `Weather is: ${body.weather.map(w => w.description).join()}`,
            ].join("\n");
        } catch (err) {
            throw err;
        }
    }
}

namespace OpenWeather {

    export interface CurrentWeatherResponse {
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

