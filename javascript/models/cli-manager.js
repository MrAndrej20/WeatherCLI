
/**
 * A class for managing CLI prompts, messages and actions
 * Wraps around ReadLine
 *
 * @exports
 * @class CLIManager
 */
exports.CLI = class CLI {

    /**
     * Creates an instance of CLIManager.
     *
     * @param {ReadLine} rl ReadLine Interface
     * @memberof CLIManager
     */
    constructor(
        rl
    ) {
        this.queue = [];
        this.inQueue = false;
        this.rl = rl;
        this.rl.on('SIGINT', () => {
            this.end();
        });
    }

    /**
     * Ends the ReadLine Interface
     *
     * @memberof CLIManager
     */
    end() {
        this.rl.close();
    }

    /**
     * Writes a message to the ReadLine Interface output
     *
     * @param {string} message
     * @memberof CLIManager
     */
    writeMessage(message) {
        this.rl.write(`${message}\n`);
    }

    /**
     * Sends an error message towards the ReadLine Interace output
     * and ends the ReadLine Interface
     *
     * @param {string} message
     * @memberof CLIManager
     */
    sendError(message) {
        this.writeMessage(message);
        this.end();
    }

    /**
     * Adds a prompt object to the prompt queue
     * if there is no prompt running it will start it
     *
     * @param {Object} prompt
     * @memberof CLIManager
     */
    queuePrompt(prompt) {
        this.queue.push(prompt);
        if (!this.inQueue) {
            this.prompt();
        }
    }

    /**
     * Contains logic for prompting the user in a sequence, from the prompt queue.
     * Depending on the prompt, it will trigger an action as well.
     *
     * @memberof CLIManager
     */
    prompt() {
        const obj = this.queue.shift();
        if (!obj) {
            return this.end();
        }
        this.inQueue = true;
        this.rl.question(`${obj.question}\n> `, async (answer) => {
            if (obj.action) {
                try {
                    const response = await obj.action(answer);
                    this.writeMessage(response);
                } catch (err) {
                    this.writeMessage(err);
                }
            }
            if (this.queue.length) {
                this.prompt();
            } else {
                this.inQueue = false;
                this.end();
            }
        });
        if (obj.suggestion) {
            this.rl.write(obj.suggestion);
        }
    }

};
