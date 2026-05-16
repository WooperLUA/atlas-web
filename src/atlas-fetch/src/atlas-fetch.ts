import {createState} from '@atlas';
import {logger} from "@services";

/**
 * Atlas-Fetch: Reactive wrapper for the native Fetch API.
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
            if (typeof request === 'function')
            {
                state.data = await request();
            }
            else
            {
                const response = await fetch(request, options);
                state.status = response.status;

                if (!response.ok) logger.error("Atlas-Fetch", `Fetch error: ${response.statusText}`)
                state.data = await response.json();
            }
            state.error = null;
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
        retry: execute
    };
}