const fs = require('fs');
const path = require("path");
const request = require('got');
const { formattedMessage, isGotError } = require("../lib");


/**
 * Class for integrating with Open Weather
 * https://openweathermap.org/
 *
 * @exports
 * @class OpenWeather
 */
exports.OpenWeather = class OpenWeather {

    /**
     * Creates an instance of OpenWeather.
     * @memberof OpenWeather
     */
    constructor() {
        this.baseUrl = 'https://api.openweathermap.org/data/2.5';
        this.appId = '84c646a7cac391335fc2615712ec3e40';

    }

    /**
     * Returns a City List with containing each city in Open Weather database with their metadata
     *
     * @returns {Object[]}
     * @memberof OpenWeather
     */
    getCityList() {
        if (!this.cityList) {
            const filePath = path.resolve(`${__dirname}/../../city-list.json`);
            this.cityList = JSON.parse(fs.readFileSync(filePath).toString());
        }
        return this.cityList;
    }

    /**
     * Creates a standardized "Weather Message"
     *
     * @param {Object} { city, temp, humidity, weather }
     * @returns {string}
     * @memberof OpenWeather
     */
    weatherMessage({ city, temp, humidity, weather }) {
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
     * @param {"metric"|"imperial"} temperatureUnit
     * @returns {Promise<string>}
     * @memberof OpenWeather
     */
    async getCurrentWeatherMultipleCities(cityNames, temperatureUnit) {
        const cityIds = cityNames.map((cityName) => {
            const city = this.getCityList().find((cl) => cl.name.toLowerCase() === cityName.toLowerCase());
            if (!city) {
                throw formattedMessage(`City ${cityName} doesn't exist`);
            }
            return city.id;
        });
        const qs = [
            `id=${encodeURIComponent(cityIds.join(','))}`,
            `units=${encodeURIComponent(temperatureUnit)}`,
            `appid=${encodeURIComponent(this.appId)}`
        ].join('&');
        try {
            const { body } = await request(`${this.baseUrl}/group?${qs}`, {
                responseType: "json"
            });
            if (!body.list.length) {
                throw formattedMessage(`Could not get weather for ${cityNames.join()}`);
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
     * @param {"metric"|"imperial"} temperatureUnit
     * @returns {Promise<string>}
     * @memberof OpenWeather
     */
    async getCurrentWeatherByCity(city, temperatureUnit) {
        const qs = [
            `q=${encodeURIComponent(city)}`,
            `units=${encodeURIComponent(temperatureUnit)}`,
            `appid=${encodeURIComponent(this.appId)}`
        ].join('&');

        try {
            const { body } = await request(`${this.baseUrl}/find?${qs}`, {
                responseType: "json"
            });
            if (!body.list.length) {
                throw formattedMessage(`Could not get weather for ${city}`);
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
     * @param {"metric"|"imperial"} temperatureUnit
     * @returns {Promise<string>}
     * @memberof OpenWeather
     */
    async getCurrentWeatherByZipCode(zipCode, temperatureUnit) {
        const qs = [
            `zip=${encodeURIComponent(zipCode)}`,
            `units=${encodeURIComponent(temperatureUnit)}`,
            `appid=${encodeURIComponent(this.appId)}`
        ].join('&');
        try {
            const { body: city } = await request(`${this.baseUrl}/weather?${qs}`, {
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
};
