import {_Structure} from "@atlas-dom";
import type {Children} from "@types";

/**
 * Conditionally renders children based on a reactive boolean.
 * Automatically handles mounting/unmounting and cleanup registration.
 *
 * @param when - Reactive predicate `() => boolean`.
 * @param children - Nodes or factories to render when truthy.
 * @returns DocumentFragment with conditional subtree.
 */
export function _If(when: () => boolean, ...children: (Children | (() => Children))[]): DocumentFragment {
    const fragment = document.createDocumentFragment();
    const marker = document.createComment("atlas-if");
    fragment.appendChild(marker);
    let currentNodes: Node[] = [];

    const update = () => {
        currentNodes.forEach(node => {
            if ((node as any)._atlas_cleanups) {
                (node as any)._atlas_cleanups.forEach((cleanup: () => void) => cleanup());
                (node as any)._atlas_cleanups = [];
            }
            node.parentNode?.removeChild(node);
        });

        if (when()) {
            const globalContext = (window as any)._atlas;

            const evaluatedChildren = children.map(child =>
                typeof child === 'function' ? child() : child
            );

            const nextContent = _Structure(...evaluatedChildren);
            currentNodes = Array.from(nextContent.childNodes);
            marker.parentNode?.insertBefore(nextContent, marker);
        } else {
            currentNodes = [];
        }
    };

    const globalContext = (window as any)._atlas;
    globalContext.listenerStack.push(update);
    try { update(); } finally { globalContext.listenerStack.pop(); }

    return fragment;
}