import {logger} from "@services";

export type Listener = () => void;

// Global context tracking active engine evaluation runs
const atlasGlobal = (window as any)._atlas || ((window as any)._atlas = { activeListener: null, registerUnsubscribe: null });

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

export function createState<T extends object>(initialState: T): T
{
    const propertyListenersMap = new Map<string | symbol, Set<Listener>>();
    const instanceListeners = new Set<Listener>();
    const proxyCache = new WeakMap<object, object>();

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
                    if (proxyCache.has(value))
                    {
                        return proxyCache.get(value)!;
                    }
                    const childProxy = new Proxy(value, createHandler(() => {
                        onNotify();
                    }));
                    proxyCache.set(value, childProxy);
                    return childProxy;
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

    const rootNotify = () => {
        Array.from(instanceListeners).forEach(updateFn => updateFn());
    };

    return new Proxy(initialState, createHandler(rootNotify)) as T;
}

export function getRefs<T extends object>(proxy: T): { [K in keyof T]: () => T[K] }
{
    return new Proxy({} as any, {
        get(_, prop)
        {
            return () => proxy[prop as keyof T];
        }
    });
}

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

export function createFormula<T>(calculation: () => T): () => T
{
    return () => calculation();
}

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