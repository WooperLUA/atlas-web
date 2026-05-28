import { _Structure } from "@/atlas-dom";

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

        items.forEach((item) => {
            const indexGetter = () => dataSource().indexOf(item);
            const rendered = renderer(item, indexGetter);
            const structure = _Structure(rendered);

            Array.from(structure.childNodes).forEach(child => {
                tempFrag.appendChild(child);
                currentNodes.push(child);
            });
        });

        marker.parentNode?.insertBefore(tempFrag, marker);
    };

    (window as any)._atlas.activeListener = renderItems;
    renderItems();
    (window as any)._atlas.activeListener = null;

    return fragment;
}