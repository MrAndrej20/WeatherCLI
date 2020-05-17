const fs = require('fs');
const request = require('got');


exports.OpenWeather = class OpenWeather {
    constructor() {
        this.baseUrl = 'https://api.openweathermap.org/data/2.5';
        this.appId = '84c646a7cac391335fc2615712ec3e40';

    }

    getCityList() {
        if (!this.cityList) {
            this.cityList = JSON.parse(fs.readFileSync(`${__dirname}/../../../city-list.json`).toString());
        }
        return this.cityList;
    }

    async getCurrentWeatherMultipleCities(cityNames, temperatureUnit) {
        const cityIds = cityNames.map((cityName) => {
            const city = this.getCityList().find((cl) => cl.name.toLowerCase() === cityName.toLowerCase());
            if (!city) {
                throw [`City ${cityName} doesn't exist`].join('\n');
            }
            return city.id;
        });
        const qs = [
            `id=${encodeURIComponent(cityIds.join(','))}`,
            `units=${encodeURIComponent(temperatureUnit)}`,
            `appid=${encodeURIComponent(this.appId)}`
        ].join('&');

        const response = await request(`${this.baseUrl}/group?${qs}`);
        const body = JSON.parse(response.body);
        if (!body.list.length) {
            throw [`Could not get weather for ${cityNames.join()}`].join('\n');
        }
        return body.list.map((weather) =>
            [
                `City: ${weather.name}`,
                `Temperature is: ${weather.main.temp}`,
                `Humidity is: ${weather.main.humidity}`,
                `Weather is: ${weather.weather.map((w) => w.description).join()}`
            ].join('\n')
        ).join('\n');
    }

    async getCurrentWeatherByCity(city, temperatureUnit) {
        const qs = [
            `q=${encodeURIComponent(city)}`,
            `units=${encodeURIComponent(temperatureUnit)}`,
            `appid=${encodeURIComponent(this.appId)}`
        ].join('&');

        const response = await request(`${this.baseUrl}/find?${qs}`);
        const body = JSON.parse(response.body);
        if (!body.list.length) {
            throw [`Could not get weather for ${city}`].join('\n');
        }
        const weather = body.list[0];
        return [
            `City: ${weather.name}`,
            `Temperature is: ${weather.main.temp}`,
            `Humidity is: ${weather.main.humidity}`,
            `Weather is: ${weather.weather.map((w) => w.description).join()}`
        ].join('\n');
    }

    async getCurrentWeatherByZipCode(zipCode, temperatureUnit) {
        const qs = [
            `zip=${encodeURIComponent(zipCode)}`,
            `units=${encodeURIComponent(temperatureUnit)}`,
            `appid=${encodeURIComponent(this.appId)}`
        ].join('&');

        const response = await request(`${this.baseUrl}/weather?${qs}`);
        const body = JSON.parse(response.body);
        return [
            `City: ${body.name}`,
            `Temperature is: ${body.main.temp}`,
            `Humidity is: ${body.main.humidity}`,
            `Weather is: ${body.weather.map((w) => w.description).join()}`
        ].join('\n');
    }
};
