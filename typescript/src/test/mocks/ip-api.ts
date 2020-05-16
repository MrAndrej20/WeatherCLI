import * as got from "got";
import mockRequire from "mock-require";

const request = got.default;

async function mockRequest(url: string) {
    switch (true) {
        case url.includes("http://ip-api.com/json"): {
            return {
                body: JSON.stringify({
                    city: "Skopje"
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
