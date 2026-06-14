import {_Structure} from "@/atlas-dom";
import {uEffect} from "@atlas";

/**
 * Renders a list of items reactively.
 * Supports keyed reconciliation for focus/state preservation.
 *
 * @template T - Item type in the data source.
 * @param dataSource - Reactive getter returning the array.
 * @param renderer - Function returning a DOM node for each item.
 * @param getKey - Optional stable key extractor for O(1) reconciliation.
 * @returns DocumentFragment containing list nodes.
 */
export function _Loop<T>(
    dataSource: () => T[],
    renderer: (item: T, index: () => number) => any,
    getKey?: (item: T) => string | number
): DocumentFragment
{
    const fragment = document.createDocumentFragment();
    const marker = document.createComment("atlas-loop");
    fragment.appendChild(marker);

    let currentItems: T[] = [];
    let currentNodes: (Node | DocumentFragment)[] = [];
    const keyMap = new Map<string | number, Node>();
    const useKeys = !!getKey;
    let dispose: (() => void) | undefined;
    const update = () =>
    {

        const newItems = dataSource();
        const parent = marker.parentNode;
        if (!parent) return;

        currentNodes.forEach(node =>
        {
            if ((node as any)._atlas_cleanups)
            {
                (node as any)._atlas_cleanups.forEach((cleanup: () => void) => cleanup());
                (node as any)._atlas_cleanups = [];
            }
            if (node instanceof DocumentFragment)
            {
                Array.from(node.childNodes).forEach(child => child.parentNode?.removeChild(child));
            }
            else
            {
                if (!useKeys || !keyMap.has(getKey!(currentItems[currentNodes.indexOf(node)] as T)))
                {
                    node.parentNode?.removeChild(node);
                }
            }
        });

        if (useKeys && getKey)
        {
            const newKeys = new Set<string | number>();
            const itemsAndKeys = newItems.map((item) => ({item, key: getKey!(item)}));

            itemsAndKeys.forEach(({key}) => newKeys.add(key));

            keyMap.forEach((node, key) =>
            {
                if (!newKeys.has(key))
                {
                    node.parentNode?.removeChild(node);
                    keyMap.delete(key);
                }
            });

            currentNodes = [];
            currentItems = [];

            itemsAndKeys.forEach(({item, key}) =>
            {
                let node = keyMap.get(key);
                if (!node)
                {
                    const indexGetter = () => newItems.indexOf(item);
                    const rendered = renderer(item, indexGetter);
                    const structure = _Structure(rendered);
                    node = structure.childNodes.length === 1 ? structure.firstChild! : structure;
                    keyMap.set(key, node);
                }
                parent.appendChild(node);
                currentNodes.push(node);
                currentItems.push(item);
            });
        }
        else
        {
            for (let i = newItems.length; i < currentItems.length; i++)
            {
                const node = currentNodes[i];
                if (node instanceof DocumentFragment)
                {
                    Array.from(node.childNodes).forEach(child => child.parentNode?.removeChild(child));
                }
                else
                {
                    if (node) node.parentNode?.removeChild(node);
                }
            }

            currentItems.length = newItems.length;
            currentNodes.length = newItems.length;

            for (let i = 0; i < newItems.length; i++)
            {
                const newItem = newItems[i]!;
                if (currentItems[i] !== newItem)
                {
                    const oldNode = currentNodes[i];
                    if (oldNode instanceof DocumentFragment)
                    {
                        Array.from(oldNode.childNodes).forEach(child => child.parentNode?.removeChild(child));
                    }
                    else
                    {
                        if (oldNode) oldNode.parentNode?.removeChild(oldNode);
                    }

                    const indexGetter = () => i;
                    const rendered = renderer(newItem, indexGetter);
                    const structure = _Structure(rendered);

                    let referenceNode: Node = marker;
                    for (let j = i + 1; j < currentNodes.length; j++) {
                        const nextNode = currentNodes[j];
                        if (nextNode && nextNode.parentNode === parent) {
                            referenceNode = nextNode;
                            break;
                        }
                    }

                    parent.insertBefore(structure, referenceNode);

                    currentItems[i] = newItem;
                    currentNodes[i] = structure;
                }
            }
        }
    };

    dispose = uEffect(update);

    (marker as any)._atlas_cleanups = (marker as any)._atlas_cleanups || [];
    (marker as any)._atlas_cleanups.push(() =>
    {
        if (dispose) dispose();
        keyMap.forEach(node => node.parentNode?.removeChild(node));
        keyMap.clear();
    });

    return fragment;
}