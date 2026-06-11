import {_Structure} from "@atlas-dom";
import type {Children} from "@types";
import {uEffect} from "@atlas";

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
    let dispose: (() => void) | undefined;

    const update = () => {
        if (dispose) dispose();

        currentNodes.forEach(node => {
            if ((node as any)._atlas_cleanups) {
                (node as any)._atlas_cleanups.forEach((cleanup: () => void) => cleanup());
                (node as any)._atlas_cleanups = [];
            }
            if (node instanceof DocumentFragment) {
                Array.from(node.childNodes).forEach(child => child.parentNode?.removeChild(child));
            } else {
                node.parentNode?.removeChild(node);
            }
        });
        currentNodes = [];

        if (when()) {
            const evaluatedChildren = children.map(child =>
                typeof child === 'function' ? child() : child
            );
            const nextContent = _Structure(...evaluatedChildren);

            currentNodes = Array.from(nextContent.childNodes);
            marker.parentNode?.insertBefore(nextContent, marker);
        }
    };

    dispose = uEffect(update);

    (marker as any)._atlas_cleanups = (marker as any)._atlas_cleanups || [];
    (marker as any)._atlas_cleanups.push(() => {
        if (dispose) dispose();
    });

    return fragment;
}