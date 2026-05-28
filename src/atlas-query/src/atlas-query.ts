import {createState} from '@atlas';
import {logger} from "@services";

/**
 * Reactive wrapper for the native Fetch API.
 *
 * This function initializes a reactive state object that tracks the progress
 * and result of an asynchronous request. It integrates directly with the
 * Atlas reactivity system, triggering UI updates automatically when data,
 * loading status, or errors change.
 *
 * @template T - The expected shape of the response data.
 *
 * @param {RequestInfo | (() => Promise<T>)} request - The network request to perform.
 * Can be a URL string, a Request object, or a custom async function that returns a Promise.
 *
 * @param {RequestInit} [options={}] - Standard fetch configuration options (method, headers, body, etc.).
 * Only used if `request` is a URL or Request object.
 *
 * @returns {Object} An object containing:
 * - `state`: A reactive Atlas state containing `data`, `error`, `loading`, and `status`.
 * - `refresh`: A function to manually re-trigger the asynchronous operation.
 *
 */
export function createFetch<T>(request: RequestInfo | (() => Promise<T>), options: RequestInit = {})
{
    const state = createState({
        data:    null as T | null,
        error:   null as any | null,
        loading: true,
        status:  0
    });

    const execute = async () =>
    {
        state.loading = true;
        try
        {
            if (typeof request === 'function') {
                state.data = await request();
            } else {
                const response = await fetch(request, options);
                state.status = response.status;

                if (!response.ok) {
                    logger.error("Atlas-Query", `Fetch error: ${response.statusText}`);
                    state.error = new Error(`HTTP Error ${response.status}`);
                } else {
                    state.data = await response.json();
                    state.error = null;
                }
            }
        }
        catch (err)
        {
            state.error = err;
            state.data = null;
        }
        finally
        {
            state.loading = false;
        }
    };

    execute();

    return {
        state,
        refresh: execute
    };
}

/**
 * Reactive wrapper for manual asynchronous actions (POST, PUT, DELETE).
 *
 * Unlike createFetch, mutations do not run automatically and are triggered by
 * calling the returned `execute` function.
 *
 * @template T - The expected shape of the response data.
 * @template V - The type of variables/arguments passed to the mutation.
 */
export function createMutation<T, V = void>(mutationFn: (variables: V) => Promise<T>)
{
    const state = createState({
        data:    null as T | null,
        error:   null as any | null,
        loading: false,
        status:  0
    });

    const execute = async (variables: V) =>
    {
        state.loading = true;
        try
        {
            state.data = await mutationFn(variables);
            state.error = null;
        }
        catch (err)
        {
            state.error = err;
            state.data = null;
            logger.error("Atlas-Query", `Mutation error: ${err instanceof Error ? err.message : String(err)}`);
        }
        finally
        {
            state.loading = false;
        }
    };

    return {
        state,
        execute
    };
}