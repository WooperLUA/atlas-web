export type Listener = () => void;

const atlasGlobal = (window as any)._atlas || ((window as any)._atlas = { activeListener: null, registerUnsubscribe: null });

// Microtask batching queue
const pendingUpdates = new Set<Listener>();
let isTicking = false;

function queueUpdate(fn: Listener) {
    pendingUpdates.add(fn);
    if (!isTicking) {
        isTicking = true;
        queueMicrotask(() => {
            const currentUpdates = Array.from(pendingUpdates);
            pendingUpdates.clear();
            isTicking = false;
            currentUpdates.forEach(update => update());
        });
    }
}

export function createState<T extends object>(initialState: T): T {
    const propertyListenersMap = new Map<string | symbol, Set<Listener>>();
    const proxyCache = new WeakMap<object, object>();

    const createHandler = (): ProxyHandler<object> => ({
        get(target, prop, receiver) {
            if (atlasGlobal.activeListener) {
                const currentListener = atlasGlobal.activeListener;
                if (!propertyListenersMap.has(prop)) propertyListenersMap.set(prop, new Set());
                propertyListenersMap.get(prop)!.add(currentListener);

                if (atlasGlobal.registerUnsubscribe) {
                    atlasGlobal.registerUnsubscribe(() => propertyListenersMap.get(prop)?.delete(currentListener));
                }
            }

            const value = Reflect.get(target, prop, receiver);
            if (value !== null && typeof value === 'object') {
                if (proxyCache.has(value)) return proxyCache.get(value)!;
                const childProxy = new Proxy(value, createHandler());
                proxyCache.set(value, childProxy);
                return childProxy;
            }
            return value;
        },
        set(target, prop, value, receiver) {
            if (Reflect.get(target, prop, receiver) === value) return true;
            const success = Reflect.set(target, prop, value, receiver);
            if (success) {
                const targets = propertyListenersMap.get(prop);
                if (targets) targets.forEach(fn => queueUpdate(fn));
            }
            return success;
        }
    });

    return new Proxy(initialState, createHandler()) as T;
}

export function getRefs<T extends object>(proxy: T): { [K in keyof T]: () => T[K] } {
    return new Proxy({} as any, {
        get(_, prop) {
            return () => proxy[prop as keyof T];
        }
    });
}

export function createEffect(effect: () => void): void {
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

export function createFormula<T>(calculation: () => T): () => T {
    return () => calculation();
}

export function createArchive<T extends object>(key: string, initialState: T): T {
    const saved = localStorage.getItem(key);
    const data = saved ? JSON.parse(saved) : initialState;
    const state = createState(data);
    createEffect(() => {
        localStorage.setItem(key, JSON.stringify(state));
    });
    return state;
}