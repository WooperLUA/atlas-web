import type {View} from "@types"

/**
 * Represents a single route definition.
 */
export interface Route {
    /** The URL path pattern (e.g., '/home', '/user/:id'). */
    path: string;
    /** The view function to execute when the path matches. */
    view: View;
}