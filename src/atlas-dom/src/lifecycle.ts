const lifecycleObserver = new MutationObserver((mutations) =>
{
    mutations.forEach((mutation) =>
    {
        mutation.addedNodes.forEach(node => handleLifecycle(node, '_atlas_onMount'));
        mutation.removedNodes.forEach(node => {
            handleLifecycle(node, '_atlas_onUnmount');
            handleCleanupLifecycle(node);
        });
    });
});

export function handleCleanupLifecycle(node: Node)
{
    // Clean up the node itself (Crucial for Comment nodes like _Portal placeholders and _If/_Loop markers)
    if ((node as any)._atlas_cleanups)
    {
        (node as any)._atlas_cleanups.forEach((cleanup: () => void) => cleanup());
        (node as any)._atlas_cleanups = [];
    }

    if (node instanceof HTMLElement)
    {
        node.querySelectorAll('*').forEach((el: any) =>
        {
            if (el._atlas_cleanups)
            {
                el._atlas_cleanups.forEach((cleanup: () => void) => cleanup());
                el._atlas_cleanups = [];
            }
        });
    }
}

function handleLifecycle(node: Node, hook: string)
{
    // Trigger hook on the node itself (Crucial for Comment nodes like _Portal placeholders)
    if ((node as any)[hook])
    {
        (node as any)[hook](node);
    }

    if (node instanceof HTMLElement)
    {
        node.querySelectorAll('*').forEach((el: any) =>
        {
            if (el[hook])
            {
                el[hook](el);
            }
        });
    }
}

if (document.body)
{
    lifecycleObserver.observe(document.body, {childList: true, subtree: true});
}
else
{
    window.addEventListener('DOMContentLoaded', () =>
    {
        lifecycleObserver.observe(document.body, {childList: true, subtree: true});
    });
}