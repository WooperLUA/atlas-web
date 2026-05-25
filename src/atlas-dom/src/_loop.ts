import { _Structure } from "@/atlas-dom";

/**
 * _Loop
 * Renders a list of items reactively without wrapping them in a container element.
 * Uses a comment node as an insertion anchor to maintain order and enable updates.
 */
export function _Loop<T>(
    dataSource: () => T[],
    renderer: (item: T, index: () => number) => any
): DocumentFragment {
    const fragment = document.createDocumentFragment();
    const marker = document.createComment("atlas-loop");
    fragment.appendChild(marker);

    let currentNodes: Node[] = [];

    const renderItems = () => {

        currentNodes.forEach(node => node.parentNode?.removeChild(node));
        currentNodes = [];


        const items = dataSource();
        const tempFrag = document.createDocumentFragment();

        items.forEach((item, i) => {
            const indexGetter = () => dataSource().indexOf(item);
            const rendered = renderer(item, indexGetter);
            const structure = _Structure(rendered);

            for (const child of structure.childNodes) {
                tempFrag.appendChild(child);
                currentNodes.push(child);
            }
        });

        marker.parentNode?.insertBefore(tempFrag, marker);
    };

    (window as any)._atlas.activeListener = renderItems;
    renderItems();
    (window as any)._atlas.activeListener = null;

    return fragment;
}