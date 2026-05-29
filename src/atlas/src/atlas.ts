import { logger } from "@services";

export type Listener = () => void;

// Global Atlas context for reactivity tracking
const atlasGlobal = (window as any)._atlas || ((window as any)._atlas = {
    activeListener: null,
    listenerStack: [],
    registerUnsubscribe: null
});

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

const targetMap = new WeakMap<object, Map<string | symbol, Set<Listener>>>();

const registry = new Map<string, object>();

/**
 * Creates a fine-grained reactive state proxy.
 * Dependencies are tracked automatically when properties are accessed
 * inside reactive contexts (DOM traits, effects, formulas).
 *
 * @template T - Must be an object. Wrap arrays/primitives: `createState({ items: [] })`
 * @param initialState - The initial value of the reactive state.
 * @returns A Proxy that intercepts property access and mutations.
 */
export function createState<T extends object>(initialState: T): T {
    const proxyCache = new WeakMap<object, object>();

    const createHandler = (): ProxyHandler<object> => ({
        get(target, prop, receiver) {
            const currentListener = atlasGlobal.listenerStack.length > 0
                ? atlasGlobal.listenerStack[atlasGlobal.listenerStack.length - 1]
                : atlasGlobal.activeListener;

            if (currentListener) {
                let depsMap = targetMap.get(target);
                if (!depsMap) {
                    depsMap = new Map();
                    targetMap.set(target, depsMap);
                }

                let listeners = depsMap.get(prop);
                if (!listeners) {
                    listeners = new Set();
                    depsMap.set(prop, listeners);
                }

                listeners.add(currentListener);

                if (atlasGlobal.registerUnsubscribe) {
                    atlasGlobal.registerUnsubscribe(() => {
                        targetMap.get(target)?.get(prop)?.delete(currentListener);
                    });
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
                const listeners = targetMap.get(target)?.get(prop);
                if (listeners) {
                    listeners.forEach(fn => queueUpdate(fn));
                }
            }
            return success;
        }
    });

    return new Proxy(initialState, createHandler()) as T;
}

/**
 * Extracts reactive getter functions from a state proxy for easy destructuring.
 *
 * @template T - Shape of the state object.
 * @param proxy - The reactive state proxy returned by `createState`.
 * @returns An object where each key maps to a `() => T[K]` reactive getter.
 */
export function getRefs<T extends object>(proxy: T): { [K in keyof T]: () => T[K] } {
    return new Proxy({} as any, {
        get(_, prop: string | symbol) {
            return () => proxy[prop as keyof T];
        }
    });
}

/**
 * Executes a callback immediately and schedules it to re-run
 * when any accessed reactive state changes.
 *
 * @param effect - The side-effect function to execute.
 */
export function createEffect(effect: () => void): void {
    const runEffect = () => {
        atlasGlobal.listenerStack.push(runEffect);
        try {
            effect();
        } finally {
            atlasGlobal.listenerStack.pop();
        }
    };
    runEffect();
}

/**
 * Creates a derived value getter that recalculates only when
 * its tracked dependencies change.
 *
 * @template T - Return type of the calculation.
 * @param calculation - Function that computes the derived value.
 * @returns A reactive getter `() => T`.
 */
export function createFormula<T>(calculation: () => T): () => T {
    return () => calculation();
}

/**
 * Creates a reactive state that automatically syncs with `localStorage`.
 * Acts as a singleton: calling this multiple times with the same key returns the same instance.
 *
 * @template T - Must be an object.
 * @param key - Unique `localStorage` key for persistence.
 * @param initialState - Fallback value if no stored data exists.
 * @returns A reactive state proxy synced to storage.
 */
export function createArchive<T extends object>(key: string, initialState: T): T {
    if (registry.has(key)) {
        return registry.get(key) as T;
    }

    let data: T = initialState;
    try {
        const saved = localStorage.getItem(key);
        if (saved) data = JSON.parse(saved);
    } catch (e) {
        logger.warn('Atlas', `Failed to parse localStorage key "${key}". Using initial state.`);
    }

    const state = createState(data);

    createEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(state));
        } catch (e) {
            logger.error('Atlas', 'Failed to save state to localStorage', e);
        }
    });

    registry.set(key, state);
    return state;
}

/**
 * Creates a global reactive flow (non-persistent shared state).
 * Shares the same registry as createArchive for consistency.
 *
 * @template T - Must be an object.
 * @param name - Unique name for this flow.
 * @param initialState - Initial value for the flow.
 * @returns A shared reactive state proxy.
 */
export function createFlow<T extends object>(name: string, initialState: T): T {
    if (!registry.has(name)) {
        registry.set(name, createState(initialState));
    }
    return registry.get(name) as T;
}

/**
 * Retrieves an existing global state by name. Throws if not initialized.
 *
 * @template T - Shape of the state object.
 * @param name - Name of the flow to retrieve.
 * @returns The shared reactive state proxy.
 */
export function getFlow<T extends object>(name: string): T {
    const ctx = registry.get(name);
    if (!ctx) {
        logger.error('Atlas', `Flow "${name}" not initialized.`);
    }
    return ctx as T;
}