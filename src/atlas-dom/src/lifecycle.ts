import type { AtlasNode } from "@types";

const lifecycleObserver = new MutationObserver((mutations) =>
{
    mutations.forEach((mutation) =>
    {
        mutation.addedNodes.forEach(node => handleLifecycle(node, '_atlas_onMount'));
        mutation.removedNodes.forEach(node => handleLifecycle(node, '_atlas_onUnmount'));
    })
});

function handleLifecycle(node: Node, hook: string)
{
    if (!(node instanceof HTMLElement)) return;

    const atlasNode = node as AtlasNode<any>;

    if ((atlasNode as any)[hook])
        (atlasNode as any)[hook](atlasNode);

    atlasNode.querySelectorAll('*').forEach((el: any) =>
    {
        const atlasChild = el as AtlasNode<any>;
        if ((atlasChild as any)[hook])
            (atlasChild as any)[hook](atlasChild);
    });
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