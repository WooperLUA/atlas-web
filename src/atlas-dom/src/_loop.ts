import type { Children } from "@types";

/**
 * _Loop
 * Renders a list of items reactively.
 *
 * @param {() => T[]} getArray - Reactive function returning the array.
 * @param {(item: T, index: number) => Children} render - Function to render each item.
 */
export function _Loop<T>(
    getArray: () => T[],
    render: (item: T, index: number) => Children
): DocumentFragment {
    const marker = document.createComment("atlas-loop");
    const fragment = document.createDocumentFragment();
    fragment.appendChild(marker);

    let currentItems: T[] = [];
    let currentNodes: Node[] = [];

    const update = () => {
        const newItems = getArray();
        const newNodes: Node[] = [];

        for (let i = 0; i < newItems.length; i++) {
            if (i < currentItems.length && currentItems[i] === newItems[i]) {
                newNodes[i] = currentNodes[i]!;
            } else {
                const rendered = render(newItems[i]!, i);
                let node: Node;


                if (rendered instanceof Node) {
                    node = rendered;
                } else if (Array.isArray(rendered)) {
                    const frag = document.createDocumentFragment();
                    rendered.forEach(child => frag.appendChild(child instanceof Node ? child : document.createTextNode(String(child))));
                    node = frag;
                } else {
                    node = document.createTextNode(String(rendered));
                }

                newNodes[i] = node;

                if (i < currentNodes.length) {
                    const oldNode = currentNodes[i]!;
                    oldNode.parentNode?.replaceChild(node, oldNode);
                } else {
                    marker.parentNode?.insertBefore(node, marker);
                }
            }
        }

        if (currentNodes.length > newItems.length) {
            for (let i = newItems.length; i < currentNodes.length; i++) {
                currentNodes[i]?.parentNode?.removeChild(currentNodes[i]!);
            }
        }

        currentItems = [...newItems];
        currentNodes = newNodes;
    };

    const globalContext = (window as any)._atlas;
    if (globalContext) globalContext.activeListener = update;

    try {
        update();
    } finally {
        if (globalContext) globalContext.activeListener = null;
    }

    return fragment;
}