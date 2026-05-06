const lifecycleObserver = new MutationObserver((mutations) =>
{
    for (const mutation of mutations)
    {
        mutation.addedNodes.forEach(node => handleLifecycle(node, '_atlas_onMount'));
        mutation.removedNodes.forEach(node => handleLifecycle(node, '_atlas_onUnmount'));
    }
});

function handleLifecycle(node: Node, hook: string)
{
    if (node instanceof HTMLElement)
    {
        if ((node as any)[hook]) (node as any)[hook](node);

        node.querySelectorAll('*').forEach(el =>
        {
            if ((el as any)[hook]) (el as any)[hook](el);
        });
    }
}

if (document.body) {
    lifecycleObserver.observe(document.body, {childList: true, subtree: true});
} else {
    window.addEventListener('DOMContentLoaded', () => {
        lifecycleObserver.observe(document.body, {childList: true, subtree: true});
    });
}