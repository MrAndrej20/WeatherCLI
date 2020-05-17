
exports.CLI = class CLI {

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

    end() {
        this.rl.close();
    }

    writeMessage(message) {
        this.rl.write(`${message}\n`);
    }

    sendError(message) {
        this.writeMessage(message);
        this.end();
    }

    queuePrompt(prompt) {
        this.queue.push(prompt);
        if (!this.inQueue) {
            this.prompt();
        }
    }

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
