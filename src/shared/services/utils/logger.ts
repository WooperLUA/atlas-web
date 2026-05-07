import type {Logger} from "@interfaces";

const prefix = "[Atlas]"

const format = (message: string) => `${prefix}: ${message}`;

export const logger: Logger = {
    log: (message: string, ...args: any[]) => {
        console.log(format(message), ...args);
    },
    warn: (message: string, ...args: any[]) => {
        console.warn(format(message), ...args);
    },
    error: (message: string, ...args: any[]) => {
        console.error(format(message), ...args);
    },
    debug: (message: string, ...args: any[]) => {
        console.debug(format(message), ...args);
    }
}