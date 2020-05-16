import * as got from "got";
import mockRequire from "mock-require";

const request = got.default;

async function mockRequest(url: string) {
    switch (true) {
        case url.includes("https://api.openweathermap.org/data/2.5/group"): {
            return {
                body: JSON.stringify({
                    cnt: 1,
                    list: [
                        {
                            coord: {
                                lon: 21.43,
                                lat: 42
                            },
                            sys: {
                                country: "MK",
                                timezone: 7200,
                                sunrise: 1589685105,
                                sunset: 1589737790
                            },
                            weather: [
                                {
                                    id: 804,
                                    main: "Clouds",
                                    description: "overcast clouds",
                                    icon: "04n"
                                }
                            ],
                            main: {
                                temp: 17,
                                feels_like: 18.24,
                                temp_min: 17,
                                temp_max: 17,
                                pressure: 1020,
                                humidity: 88
                            },
                            visibility: 10000,
                            wind: {
                                speed: 0.53,
                                deg: 44
                            },
                            clouds: {
                                all: 99
                            },
                            dt: 1589666957,
                            id: 785842,
                            name: "Skopje"
                        }
                    ]
                })
            };
        }
        case url.includes("https://api.openweathermap.org/data/2.5/find"): {
            return {
                body: JSON.stringify({
                    message: "accurate",
                    cod: "200",
                    count: 1,
                    list: [
                        {
                            id: 785842,
                            name: "Skopje",
                            coord: {
                                lat: 42,
                                lon: 21.4333
                            },
                            main: {
                                temp: 17,
                                feels_like: 18.24,
                                temp_min: 17,
                                temp_max: 17,
                                pressure: 1020,
                                humidity: 88
                            },
                            dt: 1589666957,
                            wind: {
                                speed: 0.53,
                                deg: 44
                            },
                            sys: {
                                country: "MK"
                            },
                            rain: null,
                            snow: null,
                            clouds: {
                                all: 99
                            },
                            weather: [
                                {
                                    id: 804,
                                    main: "Clouds",
                                    description: "overcast clouds",
                                    icon: "04n"
                                }
                            ]
                        }
                    ]
                })
            };
        }
        case url.includes("https://api.openweathermap.org/data/2.5/weather"): {
            return {
                body: JSON.stringify({
                    coord: {
                        lon: 21.43,
                        lat: 42
                    },
                    weather: [
                        {
                            id: 804,
                            main: "Clouds",
                            description: "overcast clouds",
                            icon: "04n"
                        }
                    ],
                    base: "stations",
                    main: {
                        temp: 17,
                        feels_like: 18.29,
                        temp_min: 17,
                        temp_max: 17,
                        pressure: 1020,
                        humidity: 88
                    },
                    visibility: 10000,
                    wind: {
                        speed: 0.47,
                        deg: 60
                    },
                    clouds: {
                        all: 99
                    },
                    dt: 1589668817,
                    sys: {
                        type: 1,
                        id: 7023,
                        country: "MK",
                        sunrise: 1589685105,
                        sunset: 1589737790
                    },
                    timezone: 7200,
                    id: 0,
                    name: "Skopje",
                    cod: 200
                })
            };
        }
        default: {
            return request(url);
        }
    }
}

(got.default as any) = mockRequest;

mockRequire("got", got);
