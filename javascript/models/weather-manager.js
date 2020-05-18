const fs = require('fs');
const os = require('os');
const path = require('path');
const { IPApi } = require('../integration/ip-api');
const { formattedMessage } = require('../lib');
const { OpenWeather } = require('../integration/open-weather');

const MAXIMUM_CITIES_PER_IMPORT_FILE = 10;
const CONFIG_DIR = `${os.homedir()}/.open-weather-cli-config`;

/**
 *  Contains logic for managing the user input, prompting the user and sending messages
 *
 * @exports
 * @class WeatherManager
 */
exports.WeatherManager = class WeatherManager {

    /**
     * Creates an instance of WeatherManager.
     *
     * @param {CLIManager} cli
     * @memberof WeatherManager
     */
    constructor(cli) {
        this.cli = cli;
        this.openWeather = new OpenWeather();
        this.ipApi = new IPApi();
    }

    /**
     * Serializes query data, from command arguments to an Options object
     * Making it easier to store last query data
     *
     * @param {string[]} commandArguments
     * @returns {Object}
     * @memberof WeatherManager
     */
    serializeOptions(commandArguments) {
        const options = {
            t: commandArguments.includes('-t') ? this.extractFlagValue(commandArguments, '-t') : 'c'
        };
        switch (true) {
            case commandArguments.includes('-c'): return { ...options, c: this.extractFlagValue(commandArguments, '-c') };
            case commandArguments.includes('--city'): return { ...options, c: this.extractFlagValue(commandArguments, '--city') };
            case commandArguments.includes('-z'): return { ...options, z: this.extractFlagValue(commandArguments, '-z') };
            default: throw formattedMessage('Could not serialize Options');
        }
    }

    /**
     * Deserializes query data, from an Options object to command arguments
     *
     * @param {Object} options
     * @returns {string[]}
     * @memberof WeatherManager
     */
    deserializeOptions(options) {
        return Object.keys(options)
            .reduce((acc, key) => [...acc, `-${key}`, options[key]], []);
    }

    /**
     * Stores the latest query into the config file
     *
     * @param {string[]} commandArguments
     * @memberof WeatherManager
     */
    saveLatestQuery(commandArguments) {
        const options = this.serializeOptions(commandArguments);
        fs.writeFileSync(CONFIG_DIR, JSON.stringify(options));
    }

    /**
     * Returns the latest query from the config file
     *
     * @returns {string[]}
     * @memberof WeatherManager
     */
    getLatestQuery() {
        try {
            const options = JSON.parse(fs.readFileSync(CONFIG_DIR).toString());
            return this.deserializeOptions(options);
        } catch (err) {
            if (err && err.code === 'ENOENT') {
                throw formattedMessage('No previous queries!');
            }
            throw formattedMessage('Invalid config file');
        }
    }

    /**
     * Extracts data for a flag from command arguments
     *
     * @param {string[]} commandArguments
     * @param {string} flag
     * @returns {string}
     * @memberof WeatherManager
     */
    extractFlagValue(commandArguments, flag) {
        const flagPosition = commandArguments.indexOf(flag);
        const flagValue = commandArguments[flagPosition + 1];
        if (!flagValue) {
            throw formattedMessage(`${flag} flag with no Value`);
        }
        return flagValue;
    }

    /**
     * If any of supported flags match, it will execute a certain action and return a proper message
     *
     * @param {string[]} commandArguments
     * @returns {Promise<string | undefined>}
     * @memberof WeatherManager
     */
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
            default: {
                return undefined;
            }
        }
    }

    /**
     * Returns a temperature unit from command argruments
     *
     * @param {string[]} commandArguments
     * @returns {"metric"|"imperial"}
     * @memberof WeatherManager
     */
    getTemperature(commandArguments) {
        if (!commandArguments.includes('-t')) {
            return 'metric';
        }
        const unCheckedTemperature = this.extractFlagValue(commandArguments, '-t');
        if (unCheckedTemperature !== 'f' && unCheckedTemperature !== 'c') {
            throw formattedMessage(
                `Invalid Temperature Unit '${unCheckedTemperature}'`,
                'Valid values are \'f\' and \'c\''
            );
        }
        return unCheckedTemperature === 'c' ? 'metric' : 'imperial';
    }

    /**
     * Returns a weather message from the last query
     *
     * @private
     * @returns {Promise<string>}
     * @memberof WeatherManager
     */
    async getWeatherForLatestQuery() {
        const command = this.getLatestQuery();
        const message = await this.getWeatherMessage(command);
        return message;
    }

    /**
     * Given a file location, it will return a weather report for each city name in the file
     * Maximum of 10 cities per imported file
     * The temperature is returned in metric units
     *
     * @private
     * @param {string} fileLocation
     * @returns {Promise<string>}
     * @memberof WeatherManager
     */
    async getWeatherFromImportFile(fileLocation) {
        const pwd = process.env.PWD;
        const filePath = fileLocation.startsWith('/') ? fileLocation : path.resolve(pwd, fileLocation);
        try {
            const cityNames = fs.readFileSync(filePath).toString().split('\n');
            if (cityNames.length > MAXIMUM_CITIES_PER_IMPORT_FILE) {
                throw formattedMessage(
                    'Limit Exceeded',
                    'Maximum of 10 Cities per import'
                );
            }
            const weather = await this.openWeather.getCurrentWeatherMultipleCities(cityNames, 'metric');
            return weather;
        } catch (err) {
            if (err && err.code === 'ENOENT') {
                throw formattedMessage('File doesn\'t exist!');
            }
            throw err;
        }
    }

    /**
     * Contains logic for mapping the user input to the proper action
     *
     * @param {string[]} commandArguments
     * @memberof WeatherManager
     */
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

    /**
     * Prompts the user for the zipcode, returns a weather report message to the user
     *
     * @private
     * @memberof WeatherManager
     */
    promptZipCode() {
        this.cli.queuePrompt({
            question: 'What\'s the zipcode?',
            action: (answer) => this.openWeather.getCurrentWeatherByZipCode(answer, 'metric')
        });
    }

    /**
     * Prompts the user for which location to fetch a weather report, with a suggestion from geolocation
     * Sends a weather report for the location specified to the user
     *
     * @private
     * @memberof WeatherManager
     */
    async promptGeoLocation() {
        const city = await this.ipApi.getCity();
        this.cli.queuePrompt({
            question: 'Which Location?',
            suggestion: city,
            action: (answer) => this.openWeather.getCurrentWeatherByCity(answer, 'metric')
        });
    }
};
