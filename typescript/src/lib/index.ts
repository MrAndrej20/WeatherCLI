import { GotError } from "got/dist/source";

export function formattedMessage(...messages: string[]): string {
    return messages.join("\n");
}

export function isGotError(error: GotError): error is GotError {
    return !!error.name;
}
