import { ReadLine } from "readline";

interface Prompt {
    action: Function;
    question: string;
    suggestion?: string;
}

/**
 * A class for managing CLI prompts, messages and actions
 * Wraps around ReadLine
 *
 * @export
 * @class CLIManager
 */
export class CLIManager {

    private readonly queue: Prompt[] = [];

    private inQueue: boolean = false;

    /**
     * Creates an instance of CLIManager.
     *
     * @param {ReadLine} rl ReadLine Interface
     * @memberof CLIManager
     */
    constructor(
        private readonly rl: ReadLine
    ) {
        // if the user wants to end the session early using control+c
        // this will end the session
        this.rl.on("SIGINT", () => {
            return this.end();
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
    writeMessage(message: string) {
        this.rl.write(`${message}\n`);
    }

    /**
     * Sends an error message towards the ReadLine Interace output
     * and ends the ReadLine Interface
     *
     * @param {string} message
     * @memberof CLIManager
     */
    sendError(message: string) {
        this.writeMessage(message);
        this.end();
    }

    /**
     * Adds a prompt object to the prompt queue
     * if there is no prompt running it will start it
     *
     * @param {Prompt} prompt
     * @memberof CLIManager
     */
    queuePrompt(prompt: Prompt) {
        this.queue.push(prompt);
        if (!this.inQueue) {
            this.prompt();
        }
    }

    /**
     * Contains logic for prompting the user in a sequence, from the prompt queue.
     * Depending on the prompt, it will trigger an action as well.
     *
     * @private
     * @memberof CLIManager
     */
    private prompt() {
        const obj = this.queue.shift();
        if (!obj) {
            return this.end();
        }
        this.inQueue = true;
        this.rl.question(`${obj.question}\n> `, async answer => {
            if (obj.action) {
                try {
                    const response = await obj.action(answer);
                    this.writeMessage(response);
                } catch (err) {
                    this.writeMessage(err);
                    return this.end();
                }
            }
            if (this.queue.length) {
                return this.prompt();
            }
            this.inQueue = false;
            return this.end();
        });
        if (obj.suggestion) {
            this.rl.write(obj.suggestion);
        }
    }

}
