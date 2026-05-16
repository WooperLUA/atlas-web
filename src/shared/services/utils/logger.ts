import type {Logger} from "@interfaces";
import type {AtlasPrefixes} from '@types'

const format = (prefix: AtlasPrefixes, message: string) => `[${prefix}]: ${message}`;

export const logger: Logger = {
    log: (prefix: AtlasPrefixes, message: string, ...args: any[]) => {
        console.log(format(prefix, message), ...args);
    },
    warn: (prefix: AtlasPrefixes, message: string, ...args: any[]) => {
        console.warn(format(prefix, message), ...args);
    },
    error: (prefix: AtlasPrefixes, message: string, ...args: any[]) => {
        console.error(format(prefix, message), ...args);
    },
    debug: (prefix: AtlasPrefixes, message: string, ...args: any[]) => {
        console.debug(format(prefix, message), ...args);
    }
}