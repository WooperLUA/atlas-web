import type { Children } from "@types";
import { handleCleanupLifecycle } from "./lifecycle.ts";
import {_Structure} from "@/atlas-dom";

/**
 * _Loop
 * Renders a list of items reactively.
 *
 * @param {() => T[]} dataSource - Reactive function returning the array.
 * @param {(item: T, index : () => number) => any} renderer - Function to render each item.
 */

export function _Loop<T>(
    dataSource: () => T[],
    renderer: (item: T, index: () => number) => any
): DocumentFragment {
    const fragment = document.createDocumentFragment();
    const container = document.createElement("div");
    fragment.appendChild(container);

    const renderItems = () => {
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        const items = dataSource();
        items.forEach((item, i) => {
            const indexGetter = () => {
                return dataSource().indexOf(item);
            };

            const element = renderer(item, indexGetter);
            container.appendChild(_Structure(element));
        });
    };

    (window as any)._atlas.activeListener = renderItems;
    renderItems();
    (window as any)._atlas.activeListener = null;

    return fragment;
}