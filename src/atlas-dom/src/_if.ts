import {_Structure} from '@atlas-dom';
import type {Children} from "@types";

/** _If
 * Conditionally renders child elements based on a reactive condition function.
 *
 * @param {() => boolean} when - A reactive function that returns a boolean condition.
 * @param {...Children[]} children - Elements to render when the condition is true.
 * @returns {DocumentFragment} A live DOM fragment that handles its own updates.
 */
export function _If(when: () => boolean, ...children: Children[]): DocumentFragment {
    const fragment = document.createDocumentFragment();
    const marker = document.createComment("atlas-if");
    fragment.appendChild(marker);

    let currentNodes: Node[] = [];

    const update = () => {
        currentNodes.forEach(node => node.parentNode?.removeChild(node));
        if (when()) {
            const nextContent = _Structure(...children);
            currentNodes = Array.from(nextContent.childNodes);
            marker.parentNode?.insertBefore(nextContent, marker);
        } else {
            currentNodes = [];
        }
    };

    (window as any)._atlas.activeListener = update;
    update();
    (window as any)._atlas.activeListener = null;

    return fragment;
}