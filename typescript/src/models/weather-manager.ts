import fs from "fs";
import os from "os";
import path from "path";
import { IPApi, OpenWeather, TemperatureUnit } from "../integration";
import { formattedMessage } from "../lib";
import { CLI } from "./cli-manager";

const MAXIMUM_CITIES_PER_IMPORT_FILE = 10;

interface Options {
    c?: string;
    z?: string;
    t?: "f" | "c";
}

export class WeatherManager {
    private static readonly configDir = `${os.homedir()}/.open-weather-cli-config`;

    private readonly openWeather: OpenWeather;

    private readonly ipApi: IPApi;

    constructor(
        private readonly cli: CLI
    ) {
        this.openWeather = new OpenWeather();
        this.ipApi = new IPApi();
    }

    private serializeOptions(commandArguments: string[]): Options {
        const options: Options = {
            t: commandArguments.includes("-t") ? this.extractFlagValue(commandArguments, "-t") as "f" | "c" : "c"
        };
        switch (true) {
            case commandArguments.includes("-c"): return { ...options, c: this.extractFlagValue(commandArguments, "-c") };
            case commandArguments.includes("--city"): return { ...options, c: this.extractFlagValue(commandArguments, "--city") };
            case commandArguments.includes("-z"): return { ...options, z: this.extractFlagValue(commandArguments, "-z") };
            default: throw formattedMessage("Could not serialize Options");
        }
    }

    private deserializeOptions(options: Options): string[] {
        return Object.keys(options)
            .reduce((acc, key) => [...acc, `-${key}`, (options as any)[key]], [] as string[]);
    }

    private saveLatestQuery(commandArguments: string[]) {
        const options = this.serializeOptions(commandArguments);
        fs.writeFileSync(WeatherManager.configDir, JSON.stringify(options));
    }

    private getLatestQuery() {
        try {
            const options = JSON.parse(fs.readFileSync(WeatherManager.configDir).toString());
            return this.deserializeOptions(options);
        } catch (err) {
            if (err && err.code === "ENOENT") {
                throw formattedMessage("No previous queries!");
            }
            throw formattedMessage("Invalid config file");
        }
    }

    private extractFlagValue(commandArguments: string[], flag: string): string {
        const flagPosition = commandArguments.indexOf(flag);
        const flagValue = commandArguments[flagPosition + 1];
        if (!flagValue) {
            throw formattedMessage(`${flag} flag with no Value`);
        }
        return flagValue;
    }

    private async getWeatherMessage(commandArguments: string[]): Promise<string | undefined> {
        const temperature = this.getTemperature(commandArguments);
        switch (true) {
            case commandArguments.includes("-c"): {
                const city = this.extractFlagValue(commandArguments, "-c");
                return this.openWeather.getCurrentWeatherByCity(city, temperature);
            }

            case commandArguments.includes("--city"): {
                const city = this.extractFlagValue(commandArguments, "--city");
                return this.openWeather.getCurrentWeatherByCity(city, temperature);
            }

            case commandArguments.includes("-z"): {
                const zipCode = this.extractFlagValue(commandArguments, "-z");
                return this.openWeather.getCurrentWeatherByZipCode(zipCode, temperature);
            }
            default: {
                return undefined;
            }
        }
    }

    private getTemperature(commandArguments: string[]): TemperatureUnit {
        if (!commandArguments.includes("-t")) {
            return "metric";
        }
        const unCheckedTemperature = this.extractFlagValue(commandArguments, "-t");
        if (unCheckedTemperature !== "f" && unCheckedTemperature !== "c") {
            throw formattedMessage(
                `Invalid Temperature Unit '${unCheckedTemperature}'`,
                "Valid values are 'f' and 'c'"
            );
        }
        return unCheckedTemperature === "c" ? "metric" : "imperial";
    }

    private async getWeatherForLatestQuery() {
        const command = this.getLatestQuery();
        const message = await this.getWeatherMessage(command);
        return message!;
    }

    private async getWeatherFromImportFile(fileLocation: string) {
        const pwd = process.env.PWD!;
        const filePath = fileLocation.startsWith("/") ? fileLocation : path.resolve(pwd, fileLocation);
        try {
            const cityNames = fs.readFileSync(filePath).toString().split("\n");
            if (cityNames.length > MAXIMUM_CITIES_PER_IMPORT_FILE) {
                throw formattedMessage(
                    "Limit Exceeded",
                    "Maximum of 10 Cities per import"
                );
            }
            const weather = await this.openWeather.getCurrentWeatherMultipleCities(cityNames, "metric");
            return weather;
        } catch (err) {
            if (err && err.code === "ENOENT") {
                throw formattedMessage("File doesn't exist!");
            }
            throw err;
        }
    }

    async getWeather(commandArguments: string[]) {
        try {
            const weather = await this.getWeatherMessage(commandArguments);
            switch (true) {
                case !!weather: {
                    this.saveLatestQuery(commandArguments);
                    this.cli.writeMessage(weather!);
                    return this.cli.end();
                }
                case commandArguments.includes("--import"): {
                    const fileLocation = this.extractFlagValue(commandArguments, "--import");
                    const importWeather = await this.getWeatherFromImportFile(fileLocation);
                    this.cli.writeMessage(importWeather);
                    return this.cli.end();
                }
                case commandArguments.includes("-l"): {
                    const latestQueryWeather = await this.getWeatherForLatestQuery();
                    this.cli.writeMessage(latestQueryWeather);
                    return this.cli.end();
                }
                case commandArguments.includes("-g"): {
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

    private promptZipCode() {
        this.cli.queuePrompt({
            question: "What's the zipcode?",
            action: (answer: string) => this.openWeather.getCurrentWeatherByZipCode(answer, "metric")
        });
    }

    private async promptGeoLocation() {
        const city = await this.ipApi.getCity();
        this.cli.queuePrompt({
            question: "Which Location?",
            suggestion: city,
            action: (answer: string) => this.openWeather.getCurrentWeatherByCity(answer, "metric")
        });
    }
}
