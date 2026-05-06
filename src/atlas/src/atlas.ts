export type Listener = () => void;

/**
 * Creates a reactive state object.
 *
 * @template T - The type of the initial state object.
 * @param {T} initialState - The initial state object to make reactive.
 * @returns {T} A proxy-wrapped reactive version of the state.
 */
export function createState<T extends object>(initialState: T): T {
    const listeners = new Set<Listener>();

    (window as any)._atlas_subscribe = (fn: Listener) => listeners.add(fn);

    const handler: ProxyHandler<object> = {
        get(target, prop, receiver) {
            const value = Reflect.get(target, prop, receiver);

            if (value !== null && typeof value === 'object') {
                return new Proxy(value, handler as any);
            }

            return value;
        },
        set(target, prop, value, receiver) {
            if (Reflect.get(target, prop, receiver) === value) {
                return true;
            }

            const success = Reflect.set(target, prop, value, receiver);

            if (success) {
                listeners.forEach(updateFn => updateFn());
            }

            return success;
        }
    };

    return new Proxy(initialState, handler as any) as T;
}