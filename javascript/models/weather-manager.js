const fs = require('fs');
const os = require('os');
const path = require('path');
const { IPApi } = require('../integration/ip-api');
const { OpenWeather } = require('../integration/open-weather');

const MAXIMUM_CITIES_PER_IMPORT_FILE = 10;
const CONFIG_DIR = `${os.homedir()}/.open-weather-cli-config`;

exports.WeatherManager = class WeatherManager {


    constructor(cli) {
        this.cli = cli;
        this.openWeather = new OpenWeather();
        this.ipApi = new IPApi();
    }

    serializeOptions(commandArguments) {
        const options = {
            t: commandArguments.includes('-t') ? this.extractFlagValue(commandArguments, '-t') : 'c'
        };
        switch (true) {
            case commandArguments.includes('-c'): return { ...options, c: this.extractFlagValue(commandArguments, '-c') };
            case commandArguments.includes('--city'): return { ...options, c: this.extractFlagValue(commandArguments, '--city') };
            case commandArguments.includes('-z'): return { ...options, z: this.extractFlagValue(commandArguments, '-z') };
            default: throw ['Could not serialize Options'].join('\n');
        }
    }

    deserializeOptions(options) {
        return Object.keys(options)
            .reduce((acc, key) => [...acc, `-${key}`, options[key]], []);
    }

    saveLatestQuery(commandArguments) {
        const options = this.serializeOptions(commandArguments);
        fs.writeFileSync(CONFIG_DIR, JSON.stringify(options));
    }

    getLatestQuery() {
        try {
            const options = JSON.parse(fs.readFileSync(CONFIG_DIR).toString());
            return this.deserializeOptions(options);
        } catch (err) {
            if (err && err.code === 'ENOENT') {
                throw ['No previous queries!'].join('\n');
            }
            throw ['Invalid config file'].join('\n');
        }
    }

    extractFlagValue(commandArguments, flag) {
        const flagPosition = commandArguments.indexOf(flag);
        const flagValue = commandArguments[flagPosition + 1];
        if (!flagValue) {
            throw [`${flag} flag with no Value`].join('\n');
        }
        return flagValue;
    }

    async getWeatherMessage(commandArguments) {
        const temperature = this.getTemperature(commandArguments);
        switch (true) {
            case commandArguments.includes('-c'): {
                const city = this.extractFlagValue(commandArguments, '-c');
                return this.openWeather.getCurrentWeatherByCity(city, temperature);
            }

            case commandArguments.includes('--city'): {
                const city = this.extractFlagValue(commandArguments, '--city');
                return this.openWeather.getCurrentWeatherByCity(city, temperature);
            }

            case commandArguments.includes('-z'): {
                const zipCode = this.extractFlagValue(commandArguments, '-z');
                return this.openWeather.getCurrentWeatherByZipCode(zipCode, temperature);
            }
        }
        return undefined;
    }

    getTemperature(commandArguments) {
        if (!commandArguments.includes('-t')) {
            return 'metric';
        }
        const unCheckedTemperature = this.extractFlagValue(commandArguments, '-t');
        if (unCheckedTemperature !== 'f' && unCheckedTemperature !== 'c') {
            throw [
                `Invalid Temperature Unit '${unCheckedTemperature}'`,
                'Valid values are \'f\' and \'c\''
            ].join('\n');
        }
        return unCheckedTemperature === 'c' ? 'metric' : 'imperial';
    }

    async getWeatherForLatestQuery() {
        const command = this.getLatestQuery();
        const message = await this.getWeatherMessage(command);
        return message;
    }

    async getWeatherFromImportFile(fileLocation) {
        const pwd = process.env.PWD;
        const filePath = fileLocation.startsWith('/') ? fileLocation : path.resolve(pwd, fileLocation);
        try {
            const cityNames = fs.readFileSync(filePath).toString().split('\n');
            if (cityNames.length > MAXIMUM_CITIES_PER_IMPORT_FILE) {
                throw [
                    'Limit Exceeded',
                    'Maximum of 10 Cities per import'
                ].join('\n');
            }
            const weather = await this.openWeather.getCurrentWeatherMultipleCities(cityNames, 'metric');
            return weather;
        } catch (err) {
            if (err && err.code === 'ENOENT') {
                throw ['File doesn\'t exist!'].join('\n');
            }
            throw err;
        }
    }

    async getWeather(commandArguments) {
        try {
            const weather = await this.getWeatherMessage(commandArguments);
            switch (true) {
                case !!weather: {
                    this.saveLatestQuery(commandArguments);
                    this.cli.writeMessage(weather);
                    return this.cli.end();
                }
                case commandArguments.includes('--import'): {
                    const fileLocation = this.extractFlagValue(commandArguments, '--import');
                    const importWeather = await this.getWeatherFromImportFile(fileLocation);
                    this.cli.writeMessage(importWeather);
                    return this.cli.end();
                }
                case commandArguments.includes('-l'): {
                    const latestQueryWeather = await this.getWeatherForLatestQuery();
                    this.cli.writeMessage(latestQueryWeather);
                    return this.cli.end();
                }
                case commandArguments.includes('-g'): {
                    return this.promptZipCode();
                }
                default: {
                    return this.promptGeoLocation();
                }
            }
        } catch (err) {
            return this.cli.sendError(err);
        }
    }

    promptZipCode() {
        this.cli.queuePrompt({
            question: 'What\'s the zipcode?',
            action: (answer) => this.openWeather.getCurrentWeatherByZipCode(answer, 'metric')
        });
    }

    async promptGeoLocation() {
        const city = await this.ipApi.getCity();
        this.cli.queuePrompt({
            question: 'Which Location?',
            suggestion: city,
            action: (answer) => this.openWeather.getCurrentWeatherByCity(answer, 'metric')
        });
    }
};
