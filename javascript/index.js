const readline = require('readline');
const { CLI } = require('./models/cli-manager');
const { WeatherManager } = require('./models/weather-manager');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

exports.commandLineInterface = async function commandLineInterface() {
    const cli = new CLI(rl);
    const wm = new WeatherManager(cli);
    await wm.getWeather(process.argv);
};
