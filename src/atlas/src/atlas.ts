import {logger} from "@services";

export type Listener = () => void;

// Global context tracking active engine evaluation runs
const atlasGlobal = (window as any)._atlas || ((window as any)._atlas = { activeListener: null, registerUnsubscribe: null });

/**
 * Runs a block of code internally without registering any reactive dependencies.
 * Used to safeguard logging and internal framework tracking mechanisms.
 */
function internalUntracked<T>(action: () => T): T
{
    const prevListener = atlasGlobal.activeListener;
    atlasGlobal.activeListener = null;
    try
    {
        return action();
    }
    finally
    {
        atlasGlobal.activeListener = prevListener;
    }
}

/**
 * Creates a reactive state object with fine-grained, property-keyed tracking.
 */
export function createState<T extends object>(initialState: T): T
{
    const propertyListenersMap = new Map<string | symbol, Set<Listener>>();
    const instanceListeners = new Set<Listener>();

    // Shared handler that forwards triggers up to its owners
    const createHandler = (onNotify: () => void): ProxyHandler<object> => {
        return {
            get(target, prop, receiver)
            {
                if (prop === '__atlas_unsubscribe')
                {
                    return (fn: Listener) =>
                    {
                        instanceListeners.delete(fn);
                        propertyListenersMap.forEach(listenersSet => listenersSet.delete(fn));
                    };
                }

                if (prop === '__atlas_origin')
                {
                    return {
                        subscribe: (fn: Listener, key?: string | symbol) =>
                                   {
                                       if (key)
                                       {
                                           if (!propertyListenersMap.has(key)) propertyListenersMap.set(key, new Set());
                                           propertyListenersMap.get(key)!.add(fn);
                                       }
                                       else
                                       {
                                           instanceListeners.add(fn);
                                       }
                                   }
                    };
                }

                if (atlasGlobal.activeListener)
                {
                    const currentListener = atlasGlobal.activeListener;

                    if (!propertyListenersMap.has(prop))
                    {
                        propertyListenersMap.set(prop, new Set());
                    }
                    propertyListenersMap.get(prop)!.add(currentListener);
                    instanceListeners.add(currentListener);

                    if (atlasGlobal.registerUnsubscribe)
                    {
                        atlasGlobal.registerUnsubscribe(() =>
                        {
                            instanceListeners.delete(currentListener);
                            const listenersSet = propertyListenersMap.get(prop);
                            if (listenersSet) listenersSet.delete(currentListener);
                        });
                    }
                }

                const value = Reflect.get(target, prop, receiver);

                if (value !== null && typeof value === 'object')
                {
                    // Recursively wrap children, bubbling their notifications back up here
                    return new Proxy(value, createHandler(() => {
                        onNotify();
                    }));
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
                    internalUntracked(() => {
                        logger.debug("Atlas", `State changed: ${String(prop)}`, value);
                    });


                    const uniqueListeners = new Set<Listener>(instanceListeners);
                    const propertyTargets = propertyListenersMap.get(prop);
                    if (propertyTargets)
                    {
                        propertyTargets.forEach(lnk => uniqueListeners.add(lnk));
                    }
                    Array.from(uniqueListeners).forEach(updateFn => updateFn());


                    onNotify();
                }

                return success;
            }
        };
    };

    // Root node notification trigger
    const rootNotify = () => {
        Array.from(instanceListeners).forEach(updateFn => updateFn());
    };

    return new Proxy(initialState, createHandler(rootNotify)) as T;
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
/**
 * Converts a reactive object into a plain object where each property
 * is a function pointing back to the original proxy key.
 * This safely permits destructuring without breaking reactivity.
 */
export function getRefs<T extends object>(proxy: T): { [K in keyof T]: () => T[K] }
{
    const refs: any = {};

    for (const key in proxy)
    {
        refs[key] = () => proxy[key];
    }

    return refs;
}
