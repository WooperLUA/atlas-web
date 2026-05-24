import {logger} from "@services";

export type Listener = () => void;

// Global ref for activeListener
const atlasGlobal = (window as any)._atlas || ((window as any)._atlas = { activeListener: null });

/**
 * Creates a reactive state object.
 */
export function createState<T extends object>(initialState: T): T
{
    // Local listener storage unique to THIS state instance
    const listeners = new Set<Listener>();

    const handler: ProxyHandler<object> = {
        get(target, prop, receiver)
        {
            if (prop === '__atlas_unsubscribe')
            {
                return (fn: Listener) => listeners.delete(fn);
            }

            if (prop === '__atlas_origin')
            {
                return {subscribe: (fn: Listener) => listeners.add(fn)};
            }

            // If a reactive context is currently running, automatically subscribe it
            if (atlasGlobal.activeListener)
            {
                listeners.add(atlasGlobal.activeListener);

                if (atlasGlobal.registerUnsubscribe) {
                    const currentListener = atlasGlobal.activeListener;
                    atlasGlobal.registerUnsubscribe(() => listeners.delete(currentListener));
                }
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
 * createEffect
 * Creates a persistent side-effect that re-runs whenever its state dependencies change.
 *
 * @param effect - The code to run.
 */
export function createEffect(effect: () => void): void
{
    const runEffect = () => {
        atlasGlobal.activeListener = runEffect;
        try {
            effect();
        } finally {
            atlasGlobal.activeListener = null;
        }
    };

    // Automatically track dependencies on the initial run
    runEffect();
}

/**
 * createFormula
 * Creates a derived, read-only reactive value.
 */
export function createFormula<T>(calculation: () => T): () => T
{
    return () => calculation();
}

/**
 * createArchive
 * Creates a reactive state that persists in localStorage.
 */
export function createArchive<T extends object>(key: string, initialState: T): T
{
    const saved = localStorage.getItem(key);
    const data = saved ? JSON.parse(saved) : initialState;

    const state = createState(data);

    createEffect(() =>
    {
        localStorage.setItem(key, JSON.stringify(state));
    });

    return state;
}