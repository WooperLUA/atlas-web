import type {Route, RouterOptions} from "@interfaces";
import {logger} from "@services";

/**
 * Manages SPA navigation, route matching, and view rendering.
 * Automatically intercepts `<a>` clicks and handles `popstate`.
 * Uses safe DOM swapping to preserve lifecycle and prevent layout thrashing.
 */
export class Router
{
    private routes: Route[];
    private root: HTMLElement;
    private basePath: string;
    private currentViewNode: Node | null = null;

    /**
     * Initializes the router instance.
     * @param config - Router configuration options.
     * @throws Error if `rootId` element is not found in DOM.
     */
    constructor(config: RouterOptions)
    {
        this.routes = config.routes;
        this.basePath = config.basePath ? config.basePath.replace(/\/$/, "") : "";

        const element = document.getElementById(config.rootId);

        if (!element)
        {
            logger.error("Atlas-Router", `Root element #${config.rootId} not found.`);
            throw new Error(`[Atlas-Router]: Root element #${config.rootId} not found.`);
        }

        this.root = element;
        this.init();
    }

    /**
     * Sets up global event listeners for navigation.
     * @private
     */
    private init(): void
    {
        window.addEventListener("popstate", () => this.render());

        document.addEventListener("click", (e: MouseEvent) =>
        {
            const anchor = (e.target as HTMLElement).closest("a");

            if (!anchor || anchor.target === "_blank") return;

            const isInternal = anchor.origin === window.location.origin;
            if (!isInternal) return;

            e.preventDefault();
            this.navigate(anchor.pathname);
        });

        this.render();
    }

    /**
     * Programmatically navigates to a path and updates browser history.
     * @param path - Target route path (e.g., `/dashboard`).
     */
    public navigate(path: string): void
    {
        let fullPath = path;
        if (this.basePath && !path.startsWith(this.basePath))
        {
            const cleanPath = path.startsWith('/') ? path : '/' + path;
            fullPath = `${this.basePath}${cleanPath}`;
        }

        if (window.location.pathname === fullPath) return;

        window.history.pushState(null, "", fullPath);
        this.render();
    }

    /**
     * Renders the view matching the current URL.
     * Called automatically on init, navigation, and back/forward.
     */
    public render(): void
    {
        const currentPath = window.location.pathname;
        logger.debug("Atlas-Router", `Rendering path: ${currentPath}`);
        let params: Record<string, string> = {};

        const route = this.routes.find(r =>
        {
            // Normalize routes into an array so we can process single strings and arrays uniformly
            const pathDefinitions = Array.isArray(r.path) ? r.path : [r.path];

            // Look for any path pattern that matches the current URL path
            return pathDefinitions.some(pathDef =>
            {
                const fullDef = `${this.basePath}${pathDef.startsWith('/') ? pathDef : '/' + pathDef}`;

                const paramNames: string[] = [];
                const pattern = fullDef
                    .replace(/:([^\/]+)/g, (_, name) =>
                    {
                        paramNames.push(name);
                        return '([^\/]+)';
                    })
                    .replace(/\*/g, '.*');

                const regex = new RegExp(`^${pattern}$`);
                const match = currentPath.match(regex);

                if (match)
                {
                    params = paramNames.reduce((acc, name, index) =>
                    {
                        acc[name] = match[index + 1]!;
                        return acc;
                    }, {} as Record<string, string>);
                    return true;
                }
                return false;
            });
        });

        if (route)
        {
            const view = route.view(params);

            if (this.currentViewNode && this.currentViewNode.parentNode)
            {
                this.currentViewNode.parentNode.removeChild(this.currentViewNode);
            }

            let newNode: Node | null = null;

            if (typeof view === 'string')
            {
                const wrapper = document.createElement('div');
                wrapper.innerHTML = view;
                newNode = wrapper;
            }
            else if (view instanceof DocumentFragment)
            {

                const wrapper = document.createElement('div');
                wrapper.appendChild(view);
                newNode = wrapper;
            }
            else if (view instanceof Node)
            {
                newNode = view;
            }

            if (newNode)
            {
                this.root.appendChild(newNode);
                this.currentViewNode = newNode;
            }
        }
        else
        {
            if (this.currentViewNode && this.currentViewNode.parentNode)
            {
                this.currentViewNode.parentNode.removeChild(this.currentViewNode);
            }
            this.currentViewNode = null;
            this.root.innerHTML = "404 - Not Found";
        }
    }
}