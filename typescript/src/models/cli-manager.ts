import { ReadLine } from "readline";

interface Prompt {
    action: Function;
    question: string;
    suggestion?: string;
}

export class CLI {

    private readonly queue: Prompt[] = [];
    private inQueue: boolean = false;

    constructor(
        private readonly rl: ReadLine
    ) {
        this.rl.on("SIGINT", () => {
            this.end();
        });
    }

    end() {
        this.rl.close();
    }

    writeMessage(message: string) {
        this.rl.write(`${message}\n`);
    }

    sendError(message: string) {
        this.writeMessage(message);
        this.end();
    }

    queuePrompt(prompt: Prompt): void {
        this.queue.push(prompt);
        if (!this.inQueue) {
            this.prompt();
        }
    }

    prompt(): void {
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

}
