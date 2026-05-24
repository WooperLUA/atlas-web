import type {AtlasNode} from "@types";

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
    if (!(node instanceof HTMLElement)) return;

    if ((node as any)._atlas_cleanups)
    {
        (node as any)._atlas_cleanups.forEach((cleanup: () => void) => cleanup());
        (node as any)._atlas_cleanups = [];
    }

    node.querySelectorAll('*').forEach((el: any) =>
    {
        if (el._atlas_cleanups)
        {
            el._atlas_cleanups.forEach((cleanup: () => void) => cleanup());
            el._atlas_cleanups = [];
        }
    });
}

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