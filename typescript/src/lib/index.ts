import { GotError } from "got/dist/source";

/**
 * Formats multiple messages as one, joining them with a newline
 *
 * @export
 * @param {...string[]} messages
 * @returns {string}
 */
export function formattedMessage(...messages: string[]): string {
    return messages.join("\n");
}

/**
 * Typeguard for checking if an error object is of type GotError
 *
 * @export
 * @param {GotError} error
 * @returns {error is GotError}
 */
export function isGotError(error: GotError): error is GotError {
    return !!error.name;
}
