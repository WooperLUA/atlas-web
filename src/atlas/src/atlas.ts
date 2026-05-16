import {logger} from "@services";

export type Listener = () => void;

/**
 * Creates a reactive state object.
 *
 * @template T - The type of the initial state object.
 * @param {T} initialState - The initial state object to make reactive.
 * @returns {T} A proxy-wrapped reactive version of the state.
 */
export function createState<T extends object>(initialState: T): T
{
    const listeners = new Set<Listener>();

    (window as any)._atlas_subscribe = (fn: Listener) => listeners.add(fn);

    const handler: ProxyHandler<object> = {
        get(target, prop, receiver)
        {
            if (prop === '__atlas_origin')
            {
                return {subscribe: (fn: Listener) => listeners.add(fn)};
            }

            const value = Reflect.get(target, prop, receiver);

            if (value !== null && typeof value === 'object')
            {
                return new Proxy(value, handler as any);
            }

            return value;
        },
        set(target, prop, value, receiver)
        {
            if (Reflect.get(target, prop, receiver) === value)
            {
                return true;
            }

            const success = Reflect.set(target, prop, value, receiver);

            if (success)
            {
                logger.debug("Atlas", `State changed: ${String(prop)}`, value);
                listeners.forEach(updateFn => updateFn());
            }

            return success;
        }
    };

    return new Proxy(initialState, handler as any) as T;
}

/**
 * createFormula
 * Creates a derived, read-only reactive value.
 *
 * @param calculation - A function that returns the derived value.
 * @returns A function that returns the current calculated value.
 */
export function createFormula<T>(calculation: () => T): () => T
{
    return () =>
    {
        return calculation();
    };
}


/**
 * createEffect
 * Creates a persistent side-effect that re-runs whenever its state dependencies change.
 *  @param effect - The code to run.
 *  @param deps   - An array representing the dependency to watch.
 */
export function createEffect(effect: () => void, deps: any[]): void
{
    effect();

    deps.forEach(dep =>
    {
        const origin = dep?.['__atlas_origin'];

        if (origin && typeof origin.subscribe === 'function')
        {
            origin.subscribe(effect);
        } else
        {
            logger.warn("Atlas", "To watch a state property, pass the state object itself to the deps array.");
        }
    });
}

/**
 * createArchive
 * Creates a reactive state that persists in localStorage.
 *
 * @param key - The unique string key for storage.
 * @param initialState - The default values if no snapshot exists.
 */
export function createArchive<T extends object>(key: string, initialState: T): T
{
    const saved = localStorage.getItem(key);
    const data = saved ? JSON.parse(saved) : initialState;


    const state = createState(data);

    createEffect(() =>
    {
        localStorage.setItem(key, JSON.stringify(state));
    }, [state]);

    return state;
}