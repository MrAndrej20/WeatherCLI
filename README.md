# Weather CLI

Weather CLI is a Node.JS library for fetching weather data.

## Prerequisites
* [npm](https://www.npmjs.com/)
* [Node.js](https://nodejs.org/en/)

## Installation

Installing dependencies and then adding the command globally to your OS.

```bash
npm install && npm install -g
```

## Usage

```bash
# Will prompt the user to enter a city for which to gather weather data
# Will suggest a city based on geolocation
> weather

# Will prompt the user to enter a zipcode for which to get weather data
# Disables geolocation -g
> weather -g

# Will fetch weather data for the city Skopje -c skopje
> weather -c skopje

# Will fetch weather data for the city Skopje -c skopje
# Returns temperature as Celsius -t c
> weather -c skopje -t c

# Will fetch weather data for the Zip Code "1000,mk" -z 1000,mk
# Returns temperature as Fahrenheit -t f
> weather -z 1000,mk -t f
```

## Technology stack
* Node.js
* TypeScript

## Dependencies
* [got](https://www.npmjs.com/package/got) HTTP request library for Node.js
