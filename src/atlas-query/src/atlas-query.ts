import {createState} from '@atlas';
import {logger} from "@services";

/**
 * Reactive wrapper around the Fetch API.
 * Automatically executes on creation and exposes loading/error/data state.
 *
 * @template T - Expected response shape.
 * @param request - URL, Request object, or async resolver function.
 * @param options - Standard fetch init options (ignored if request is a function).
 * @returns `{ state: ReactiveFetchState<T>, refresh: () => Promise<void> }`
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
 * Reactive wrapper for manual async mutations (POST/PUT/DELETE).
 * Does not execute automatically. Trigger via `execute()`.
 *
 * @template T - Response shape.
 * @template V - Variables passed to mutation function.
 * @param mutationFn - Async function accepting variables and returning Promise<T>.
 * @returns `{ state: ReactiveMutationState<T>, execute: (vars: V) => Promise<void> }`
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