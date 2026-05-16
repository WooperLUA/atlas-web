import type {Route, RouterOptions} from "@interfaces";
import {logger} from "@services";

/**
 * Manages client-side routing and view rendering.
 */
export class Router
{
    private routes: Route[];
    private root: HTMLElement;
    private basePath: string;

    /**
     * Initializes a new Router instance.
     *
     * @param {RouterOptions} config - Configuration options including routes and root element ID.
     * @throws {Error} If the root element is not found.
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
    private init(): void {
        window.addEventListener("popstate", () => this.render());

        document.addEventListener("click", (e: MouseEvent) => {
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
     * Navigates to a new path and updates the browser history.
     *
     * @param {string} path - The destination path.
     */
    public navigate(path: string): void
    {
        let fullPath = path;
        if (this.basePath && !path.startsWith(this.basePath)) {
            const cleanPath = path.startsWith('/') ? path : '/' + path;
            fullPath = `${this.basePath}${cleanPath}`;
        }

        if (window.location.pathname === fullPath) return;

        window.history.pushState(null, "", fullPath);
        this.render();
    }

    /**
     * Renders the view corresponding to the current path.
     * Handles parameter extraction and element composition.
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
            return pathDefinitions.some(pathDef => {
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

            this.root.innerHTML = '';

            if (typeof view === 'string') {
                this.root.innerHTML = view;
            }
            else if (Array.isArray(view)) {
                view.forEach(node => {
                    if (node instanceof Node) {
                        this.root.appendChild(node);
                    }
                });
            }
            else if (view instanceof DocumentFragment) {
                this.root.appendChild(view);
            }
            else if (view instanceof Node) {
                this.root.appendChild(view);
            }
        }
        else
        {
            this.root.innerHTML = "404 - Not Found";
        }
    }
}