
exports.formattedMessage = function formattedMessage(...messages) {
    return messages.join("\n");
}

exports.isGotError = function isGotError(error) {
    return !!error.name;
}
