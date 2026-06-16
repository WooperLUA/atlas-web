import {logger} from "@services";

export type Listener = () => void;

interface DevtoolLog
{
    time: number;
    stateName: string;
    prop: string | symbol;
    oldValue: any;
    newValue: any;
    logType?: 'state' | 'query';
}

function getSourceLocation(): string
{
    try
    {
        const stack = new Error().stack;
        if (!stack) return 'Unknown';
        const lines = stack.split('\n');

        let targetIndex = 3;
        for (let i = 2; i < lines.length; i++)
        {
            if (!lines[i]?.includes('getSourceLocation') &&
                !lines[i]?.includes('uState') &&
                !lines[i]?.includes('uFlow') &&
                !lines[i]?.includes('uArchive'))
            {
                targetIndex = i;
                break;
            }
        }

        const callerLine = lines[targetIndex] || '';
        const match = callerLine.match(/([^\/\\]+\.[tj]sx?):(\d+):\d+/);
        return match ? `${match[1]}:${match[2]}` : 'Unknown';
    }
    catch
    {
        return 'Unknown';
    }
}

const atlasGlobal = (window as any)._atlas || ((window as any)._atlas = {
    activeListener:      null,
    listenerStack:       [] as Listener[],
    registerUnsubscribe: null as ((fn: () => void) => void) | null,
    devtools:            null as {
        logs: DevtoolLog[];
        states: Set<object>;
        onUpdate: (() => void) | null;
    } | null
});

const pendingUpdates = new Set<Listener>();
let isTicking = false;

function queueUpdate(fn: Listener)
{
    pendingUpdates.add(fn);
    if (!isTicking)
    {
        isTicking = true;
        queueMicrotask(() =>
        {
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
 */
export function uState<T extends object>(initialState: T, fallbackName?: string): T
{
    const proxyCache = new WeakMap<object, object>();
    const stateId = fallbackName || getSourceLocation();

    if (!(initialState as any).__atlas_name)
    {
        (initialState as any).__atlas_name = stateId;
    }

    if (atlasGlobal.devtools)
    {
        atlasGlobal.devtools.states.add(initialState);
    }

    const createHandler = (): ProxyHandler<object> => ({
        get(target, prop, receiver)
        {
            const currentListener = atlasGlobal.listenerStack.length > 0
                ? atlasGlobal.listenerStack[atlasGlobal.listenerStack.length - 1]
                : atlasGlobal.activeListener;

            if (currentListener)
            {
                let depsMap = targetMap.get(target);
                if (!depsMap)
                {
                    depsMap = new Map();
                    targetMap.set(target, depsMap);
                }

                let listeners = depsMap.get(prop);
                if (!listeners)
                {
                    listeners = new Set();
                    depsMap.set(prop, listeners);
                }

                listeners.add(currentListener);

                if (atlasGlobal.registerUnsubscribe)
                {
                    atlasGlobal.registerUnsubscribe(() =>
                    {
                        targetMap.get(target)?.get(prop)?.delete(currentListener);
                    });
                }
            }

            const value = Reflect.get(target, prop, receiver);

            if (value !== null && typeof value === 'object')
            {
                if (value instanceof Set ||
                    value instanceof Map ||
                    value instanceof WeakMap ||
                    value instanceof WeakSet ||
                    value instanceof Date ||
                    value instanceof RegExp)
                {
                    return value;
                }

                if (proxyCache.has(value)) return proxyCache.get(value)!;

                const parentName = (target as any).__atlas_name || stateId;
                if (!(value as any).__atlas_name)
                {
                    (value as any).__atlas_name = `${parentName}.${String(prop)}`;
                }

                const childProxy = new Proxy(value, createHandler());
                proxyCache.set(value, childProxy);
                return childProxy;
            }
            return value;
        },
        set(target, prop, value, receiver)
        {
            const oldValue = (target as any)[prop];
            if (oldValue === value) return true;

            const success = Reflect.set(target, prop, value, receiver);

            if (success)
            {
                if (atlasGlobal.devtools)
                {
                    const stateName = (target as any).__atlas_name || stateId;
                    const logType = (target as any).__atlas_type || 'state';

                    atlasGlobal.devtools.logs.push({
                        time:      Date.now(),
                        stateName: stateName,
                        prop,
                        oldValue,
                        newValue:  value,
                        logType
                    });
                    if (atlasGlobal.devtools.onUpdate)
                    {
                        atlasGlobal.devtools.onUpdate();
                    }
                }

                const listeners = targetMap.get(target)?.get(prop);
                if (listeners)
                {
                    listeners.forEach(fn => queueUpdate(fn));
                }
            }
            return success;
        }
    });

    const proxy = new Proxy(initialState, createHandler()) as T;

    if (atlasGlobal.devtools)
    {
        atlasGlobal.devtools.states.add(proxy);
    }

    return proxy;
}

/**
 * Extracts reactive getter functions from a state proxy for easy destructuring.
 */
export function getRefs<T extends object>(proxy: T): { [K in keyof T]: () => T[K] }
{
    return new Proxy({} as any, {
        get(_, prop: string | symbol)
        {
            return () => proxy[prop as keyof T];
        }
    });
}

/**
 * Executes a callback immediately and schedules it to re-run when dependencies change.
 * If the effect function returns a function, it is treated as a cleanup function
 * that runs before the next execution or when disposed.
 * @returns A dispose function to manually clean up the effect.
 */
export function uEffect(
    effect: () => void | (() => void),
    dependencies?: (() => any) | (() => any)[]
): () => void
{
    let cleanup: (() => void) | undefined;

    const run = () =>
    {

        if (cleanup) cleanup();

        const internalCleanups: (() => void)[] = [];
        const prevRegistry = atlasGlobal.registerUnsubscribe;
        atlasGlobal.registerUnsubscribe = (fn: () => void) => internalCleanups.push(fn);

        try
        {
            if (dependencies)
            {
                const depsArray = Array.isArray(dependencies) ? dependencies : [dependencies];
                atlasGlobal.listenerStack.push(run);
                try
                {
                    depsArray.forEach(dep => dep());
                }
                finally
                {
                    atlasGlobal.listenerStack.pop();
                }

                const result = effect();
                if (typeof result === 'function') cleanup = result;
            }
            else
            {

                atlasGlobal.listenerStack.push(run);
                try
                {
                    const result = effect();
                    if (typeof result === 'function') cleanup = result;
                }
                finally
                {
                    atlasGlobal.listenerStack.pop();
                }
            }
        }
        finally
        {

            atlasGlobal.registerUnsubscribe = prevRegistry;


            if (internalCleanups.length > 0)
            {
                const returnedCleanup = cleanup;
                cleanup = () =>
                {
                    internalCleanups.forEach(fn => fn());
                    if (returnedCleanup) returnedCleanup();
                };
            }
        }
    };

    run();

    return () =>
    {
        if (cleanup)
        {
            cleanup();
            cleanup = undefined;
        }
    };
}

/**
 * Creates a debounced side-effect.
 * Tracks dependencies synchronously, but delays execution until
 * the dependencies have stopped changing for the specified delay.
 *
 * @param effect - The side-effect to execute. Can return a cleanup function.
 * @param delay - The time in milliseconds to wait after the last change.
 * @param dependencies - (Optional) Reactive getters to track synchronously.
 * @returns A dispose function to clean up the effect.
 */
export function uDebounceEffect(
    effect: () => void | (() => void),
    delay: number,
    dependencies?: (() => any) | (() => any)[]
): () => void
{
    let timeout: ReturnType<typeof setTimeout>;
    let savedCleanup: (() => void) | undefined;

    return uEffect(() =>
    {
        clearTimeout(timeout);

        if (savedCleanup)
        {
            savedCleanup();
            savedCleanup = undefined;
        }

        timeout = setTimeout(() =>
        {
            const result = effect();
            if (typeof result === 'function')
            {
                savedCleanup = result;
            }
        }, delay);


        return () =>
        {
            clearTimeout(timeout);
            if (savedCleanup)
            {
                savedCleanup();
                savedCleanup = undefined;
            }
        };
    }, dependencies);
}

/**
 * Runs an effect exactly once. After the first successful execution,
 * it stops tracking dependencies. If it returns a cleanup function,
 * that cleanup is registered with the parent reactive scope (e.g., component unmount).
 *
 * @param effect - The side-effect to execute a single time. Can return a cleanup function.
 */
export function uOnceEffect(effect: () => void | (() => void)): void
{
    let hasRun = false;

    const runner = () =>
    {
        if (hasRun) return;
        hasRun = true;

        const result = effect();
        if (typeof result === 'function')
        {
            if (atlasGlobal.registerUnsubscribe)
            {
                atlasGlobal.registerUnsubscribe(result);
            }
        }
    };

    atlasGlobal.listenerStack.push(runner);
    try
    {
        runner();
    }
    finally
    {
        atlasGlobal.listenerStack.pop();
    }
}

/**
 * Watches a specific reactive getter and triggers a callback only when its value changes.
 * Provides both the new and old values to the callback.
 *
 * @param getter - A function that returns the value to watch (e.g., () => state.count).
 * @param callback - Function to run when the value changes (newValue, oldValue).
 * @returns A dispose function to stop watching.
 */
export function uWatchEffect<T>(getter: () => T, callback: (newValue: T, oldValue: T) => void): () => void
{
    let oldValue = getter();

    return uEffect(() =>
    {
        const newValue = getter();
        if (newValue !== oldValue)
        {
            callback(newValue, oldValue);
            oldValue = newValue;
        }
    });
}

/**
 * Creates a derived value getter that recalculates only when its tracked dependencies change.
 */
export function uFormula<T>(calculation: () => T): () => T
{
    const memo = uState<{ value: T }>({value: undefined as any});

    uEffect(() =>
    {
        memo.value = calculation();
    });

    return () => memo.value;
}

/**
 * Creates or retrieves a global reactive archive (synced to localStorage).
 * Acts as a singleton: calling this with just the key retrieves the existing archive.
 * Calling it with a state proxy creates it if it doesn't exist.
 *
 * @template T - Must be an object.
 * @param key - Unique `localStorage` key for persistence.
 * @param state - (Optional) An existing reactive state proxy (from `uState` or `uFlow`). Required on the first call.
 * @returns A shared reactive state proxy synced to storage.
 */
export function uArchive<T extends object>(key: string): T;
export function uArchive<T extends object>(key: string, state: T): T;
export function uArchive<T extends object>(key: string, state?: T): T
{
    const registryKey = `archive:${key}`;

    if (registry.has(registryKey))
    {
        return registry.get(registryKey) as T;
    }

    if (state === undefined)
    {
        throw new Error(`Atlas: Archive "${key}" is not initialized. Provide a uState or uFlow on the first call.`);
    }

    // Hydrate from localStorage
    try
    {
        const saved = localStorage.getItem(key);
        if (saved)
        {
            const parsed = JSON.parse(saved);
            Object.assign(state, parsed);
        }
    }
    catch (e)
    {
        logger.warn('Atlas', `Failed to parse localStorage key "${key}". Using existing state.`);
    }

    // Setup reactive sync to localStorage
    uEffect(() =>
    {
        try
        {
            localStorage.setItem(key, JSON.stringify(state));
        }
        catch (e)
        {
            logger.error('Atlas', 'Failed to save state to localStorage', e);
        }
    });

    registry.set(registryKey, state);
    return state;
}

/**
 * Creates or retrieves a global reactive flow (shared state).
 * Acts as a singleton: calling this with just the name retrieves the existing flow.
 * Calling it with an initialState creates it if it doesn't exist.
 *
 * @template T - Must be an object.
 * @param name - Unique name for this flow.
 * @param initialState - (Optional) Initial value for the flow. Required on first call.
 * @returns A shared reactive state proxy.
 */
export function uFlow<T extends object>(name: string): T;
export function uFlow<T extends object>(name: string, initialState: T): T;
export function uFlow<T extends object>(name: string, initialState?: T): T
{
    const registryKey = `flow:${name}`;

    if (!registry.has(registryKey))
    {
        if (initialState === undefined)
        {
            throw new Error(`Atlas: Flow "${name}" is not initialized. Provide initialState on the first call.`);
        }
        registry.set(registryKey, uState(initialState, registryKey));
    }
    return registry.get(registryKey) as T;
}

// ============================================================================
// DEPRECATED LEGACY ALIASES (For backward compatibility and migration)
// ============================================================================

/** @deprecated Use `uState` instead. */
export function createState<T extends object>(initialState: T, fallbackName?: string): T
{
    logger.warn('Atlas', '`createState` is deprecated. Please use `uState` instead.');
    return uState(initialState, fallbackName);
}

/** @deprecated Use `uEffect` instead. */
export function createEffect(effect: () => void, dependencies?: (() => any) | (() => any)[]): () => void
{
    logger.warn('Atlas', '`createEffect` is deprecated. Please use `uEffect` instead.');
    return uEffect(effect, dependencies);
}

/** @deprecated Use `uFormula` instead. */
export function createFormula<T>(calculation: () => T): () => T
{
    logger.warn('Atlas', '`createFormula` is deprecated. Please use `uFormula` instead.');
    return uFormula(calculation);
}

/** @deprecated Use `uFlow` instead. */
export function createFlow<T extends object>(name: string): T;
export function createFlow<T extends object>(name: string, initialState: T): T;
export function createFlow<T extends object>(name: string, initialState?: T): T
{
    logger.warn('Atlas', '`createFlow` is deprecated. Please use `uFlow` instead.');
    if (initialState === undefined)
    {
        return uFlow<T>(name);
    }
    return uFlow<T>(name, initialState);
}

/**
 * @deprecated Use `uArchive(key, initialState)` instead.
 */
export function createArchive<T extends object>(key: string, initialState: T): T
{
    logger.warn('Atlas', '`createArchive` is deprecated. Please use `uArchive(key, initialState)` instead.');
    return uArchive(key, initialState);
}