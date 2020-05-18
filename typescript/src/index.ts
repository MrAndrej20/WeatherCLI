import readline from "readline";
import { CLIManager } from "./models/cli-manager";
import { WeatherManager } from "./models/weather-manager";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

export async function commandLineInterface() {
    const cli = new CLIManager(rl);
    const wm = new WeatherManager(cli);
    await wm.getWeather(process.argv);
}
