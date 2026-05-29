import type {Route} from "./route.ts";

/**
 * Configuration for the client-side router.
 */
export interface RouterOptions {
    /** ID of the root container element. */
    rootId: string;
    /** Route definitions array. */
    routes: Route[];
    /** Optional base path for subdomain/spa deployments. */
    basePath?: string;
}