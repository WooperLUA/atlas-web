import type {AtlasPrefixes} from "@types";

export interface Logger
{
    log(prefix: AtlasPrefixes, message: string, ...args: any[]): void;
    warn(prefix: AtlasPrefixes, message: string, ...args: any[]): void;
    error(prefix: AtlasPrefixes, message: string, ...args: any[]): void;
    debug(prefix: AtlasPrefixes, message: string, ...args: any[]): void;
}