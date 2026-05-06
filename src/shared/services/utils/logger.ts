import type {Logger} from "@interfaces";

const prefix = "[Atlas]"
export const logger = {
    log: ({message} : Logger) => {
        console.log(`${prefix}: ${message}`);
    },
    error: ({message, data} : Logger) => {
        console.error(`${prefix} | ${data}: ${message}`);
    }

}