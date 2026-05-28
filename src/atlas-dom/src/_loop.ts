import { _Structure } from "@/atlas-dom";

export function _Loop<T>(
    dataSource: () => T[],
    renderer: (item: T, index: () => number) => any,
    getKey?: (item: T) => string | number
): DocumentFragment {
    const fragment = document.createDocumentFragment();
    const marker = document.createComment("atlas-loop");
    fragment.appendChild(marker);

    let currentItems: T[] = [];
    let currentNodes: Node[] = [];
    const keyMap = new Map<string | number, Node>();
    const useKeys = !!getKey;

    const update = () => {
        const newItems = dataSource();
        const parent = marker.parentNode;
        if (!parent) return;

        if (useKeys && getKey) {

            const newKeys = new Set<string | number>();
            const itemsAndKeys = newItems.map((item) => ({
                item,
                key: getKey(item),
            }));

            itemsAndKeys.forEach(({ key }) => newKeys.add(key));


            keyMap.forEach((node, key) => {
                if (!newKeys.has(key)) {
                    node.parentNode?.removeChild(node);
                    keyMap.delete(key);
                }
            });

            currentNodes = [];

            itemsAndKeys.forEach(({ item, key }) => {
                let node = keyMap.get(key);
                if (!node) {
                    const indexGetter = () => newItems.indexOf(item);
                    const rendered = renderer(item, indexGetter);
                    const structure = _Structure(rendered);
                    node = structure.childNodes.length === 1 ? structure.firstChild! : structure;
                    keyMap.set(key, node);
                }
                parent.appendChild(node);
                currentNodes.push(node);
            });
        } else {
            for (let i = newItems.length; i < currentItems.length; i++) {
                const node = currentNodes[i];
                if (node) node.parentNode?.removeChild(node);
            }
            currentItems.length = newItems.length;
            currentNodes.length = newItems.length;

            for (let i = 0; i < newItems.length; i++) {
                const newItem = newItems[i]!;
                if (currentItems[i] !== newItem) {
                    const oldNode = currentNodes[i];
                    if (oldNode) oldNode.parentNode?.removeChild(oldNode);

                    const indexGetter = () => i;
                    const rendered = renderer(newItem, indexGetter);
                    const structure = _Structure(rendered);
                    const newNode = structure.childNodes.length === 1 ? structure.firstChild! : structure;

                    parent.insertBefore(newNode, currentNodes[i + 1] || marker);

                    currentItems[i] = newItem;
                    currentNodes[i] = newNode;
                }
            }
        }
    };

    const globalContext = (window as any)._atlas;
    globalContext.listenerStack.push(update);
    try { update(); } finally { globalContext.listenerStack.pop(); }

    return fragment;
}