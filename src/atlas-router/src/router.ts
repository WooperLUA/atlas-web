import type {Route, RouterOptions} from "@interfaces";

/**
 * Manages client-side routing and view rendering.
 */
export class Router
{
    private routes: Route[];
    private root: HTMLElement;

    /**
     * Initializes a new Router instance.
     *
     * @param {RouterOptions} config - Configuration options including routes and root element ID.
     * @throws {Error} If the root element is not found.
     */
    constructor(config: RouterOptions)
    {
        this.routes = config.routes;
        const element = document.getElementById(config.rootId);

        if (!element)
        {
            throw new Error(`[Atlas]: Root element #${config.rootId} not found.`);
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


            if (!anchor) return;


            if (anchor.target === "_blank") return;


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
        if (window.location.pathname === path) return;

        window.history.pushState(null, "", path);
        this.render();
    }

    /**
     * Renders the view corresponding to the current path.
     * Handles parameter extraction and element composition.
     */
    public render(): void
    {
        const currentPath = window.location.pathname;
        let params: Record<string, string> = {};

        const route = this.routes.find(r =>
        {
            const paramNames: string[] = [];
            const pattern = r.path
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
            else if (view instanceof Node) {
                this.root.appendChild(view);
            }
        } else
        {
            this.root.innerHTML = "404 - Not Found";
        }
    }
}