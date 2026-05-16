import type {Route} from "./route.ts";

/**
 * Configuration options for the Atlas Router.
 */
export interface RouterOptions
{
    /** The ID of the HTML element where the router will render views. */
    rootId: string;
    /** The list of defined routes. */
    routes: Route[];
    basePath?: string;
}