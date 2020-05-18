
/**
 * Formats multiple messages as one, joining them with a newline
 *
 * @exports
 * @param {...string[]} messages
 * @returns {string}
 */
exports.formattedMessage = function formattedMessage(...messages) {
    return messages.join("\n");
}

/**
 * Typeguard for checking if an error object is of type GotError
 *
 * @exports
 * @param {*} error
 * @returns {boolean}
 */
exports.isGotError = function isGotError(error) {
    return !!error.name;
}
