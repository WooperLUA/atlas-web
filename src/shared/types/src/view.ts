/**
 * Parameters extracted from a dynamic route (e.g., { id: '123' }).
 */
export type ViewParams = Record<string, string>;

/**
 * A function that returns a view for a route.
 * Can return a string, an HTMLElement, or a DocumentFragment.
 */
export type View = (params: ViewParams) => HTMLElement | string | DocumentFragment;