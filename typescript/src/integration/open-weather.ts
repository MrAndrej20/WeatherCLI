import fs from "fs";
import request from "got";
import path from "path";
import { formattedMessage, isGotError } from "../lib";

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

interface WeatherMetadata {
    city: string;
    temp: number;
    humidity: number;
    weather: string;
}

export type TemperatureUnit = "metric" | "imperial";

/**
 * Class for integrating with Open Weather
 * https://openweathermap.org/
 *
 * @export
 * @class OpenWeather
 */
export class OpenWeather {

    /**
     * Open Weather api endpoint
     *
     * @private
     * @memberof OpenWeather
     */
    private readonly baseUrl = "https://api.openweathermap.org/data/2.5";

    /**
     * Application Id for authenticating with Open Weather
     *
     * @private
     * @memberof OpenWeather
     */
    private readonly appId = "84c646a7cac391335fc2615712ec3e40";

    private cityList: CityListEntry[];

    /**
     * Returns a City List with containing each city in Open Weather database with their metadata
     *
     * @private
     * @returns {CityListEntry[]}
     * @memberof OpenWeather
     */
    private getCityList(): CityListEntry[] {
        if (!this.cityList) {
            const filePath = path.resolve(`${__dirname}/../../../city-list.json`);
            this.cityList = JSON.parse(fs.readFileSync(filePath).toString());
        }
        return this.cityList;
    }

    /**
     * Creates a standardized "Weather Message"
     *
     * @private
     * @param {WeatherMetadata} { city, temp, humidity, weather }
     * @returns {string}
     * @memberof OpenWeather
     */
    private weatherMessage({ city, temp, humidity, weather }: WeatherMetadata) {
        return formattedMessage(
            `City: ${city}`,
            `Temperature is: ${temp}`,
            `Humidity is: ${humidity}`,
            `Weather is: ${weather}`
        );
    }

    /**
     * Returns current weather for multiple cities by city names
     *
     * @param {string[]} cityNames
     * @param {TemperatureUnit} temperatureUnit
     * @returns {Promise<string>}
     * @memberof OpenWeather
     */
    async getCurrentWeatherMultipleCities(cityNames: string[], temperatureUnit: TemperatureUnit): Promise<string> {
        const cityIds = cityNames.map(cityName => {
            const city = this.getCityList().find(cl => cl.name.toLowerCase() === cityName.toLowerCase());
            if (!city) {
                throw formattedMessage(`City ${cityName} doesn't exist`);
            }
            return city.id;
        });
        const qs = [
            `id=${encodeURIComponent(cityIds.join(","))}`,
            `units=${encodeURIComponent(temperatureUnit)}`,
            `appid=${encodeURIComponent(this.appId)}`,
        ].join("&");

        try {
            const { body } = await request<OpenWeather.GroupWeatherResponse>(`${this.baseUrl}/group?${qs}`, {
                responseType: "json"
            });
            if (!body.list.length) {
                throw formattedMessage(`Could not get weather for ${cityNames.join(", ")}`);
            }
            return formattedMessage(
                ...body.list.map(city => this.weatherMessage({
                    city: city.name,
                    temp: city.main.temp,
                    humidity: city.main.humidity,
                    weather: city.weather.map(w => w.description).join(", ")
                }))
            );
        } catch (err) {
            if (isGotError(err)) {
                throw formattedMessage(`Could not get weather for ${cityNames.join(", ")}`);
            }
            throw err;
        }
    }

    /**
     * Returns current weather by city name
     *
     * @param {string} cityName
     * @param {TemperatureUnit} temperatureUnit
     * @returns {Promise<string>}
     * @memberof OpenWeather
     */
    async getCurrentWeatherByCity(cityName: string, temperatureUnit: TemperatureUnit): Promise<string> {
        const qs = [
            `q=${encodeURIComponent(cityName)}`,
            `units=${encodeURIComponent(temperatureUnit)}`,
            `appid=${encodeURIComponent(this.appId)}`,
        ].join("&");

        try {
            const { body } = await request<OpenWeather.FindWeatherResponse>(`${this.baseUrl}/find?${qs}`, {
                responseType: "json"
            });
            if (!body.list.length) {
                throw formattedMessage(`Could not get weather for ${cityName}`);
            }
            const city = body.list[0];
            return this.weatherMessage({
                city: city.name,
                temp: city.main.temp,
                humidity: city.main.humidity,
                weather: city.weather.map(w => w.description).join(", ")
            });
        } catch (err) {
            if (isGotError(err)) {
                throw formattedMessage(`Could not get weather for ${cityName}`);
            }
            throw err;
        }
    }

    /**
     * Returns current weather by zip code
     *
     * @param {string} zipCode
     * @param {TemperatureUnit} temperatureUnit
     * @returns {Promise<string>}
     * @memberof OpenWeather
     */
    async getCurrentWeatherByZipCode(zipCode: string, temperatureUnit: TemperatureUnit): Promise<string> {
        const qs = [
            `zip=${encodeURIComponent(zipCode)}`,
            `units=${encodeURIComponent(temperatureUnit)}`,
            `appid=${encodeURIComponent(this.appId)}`,
        ].join("&");

        try {
            const { body: city } = await request<OpenWeather.CurrentWeatherResponse>(`${this.baseUrl}/weather?${qs}`, {
                responseType: "json"
            });
            return this.weatherMessage({
                city: city.name,
                temp: city.main.temp,
                humidity: city.main.humidity,
                weather: city.weather.map(w => w.description).join(", ")
            });
        } catch (err) {
            if (isGotError(err)) {
                throw formattedMessage(`Could not get weather for ${zipCode}`);
            }
            throw err;
        }
    }
}

/**
 * Namespace of all OpenWeather API responses
 */
namespace OpenWeather {

    /**
     * Response Body from GET Current Weather Request
     *
     * @export
     * @interface CurrentWeatherResponse
     */
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

    /**
     * Response Body from GET Group Weather Request
     *
     * @export
     * @interface GroupWeatherResponse
     */
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

    /**
     * Response Body from GET Find Weather Request
     *
     * @export
     * @interface FindWeatherResponse
     */
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

