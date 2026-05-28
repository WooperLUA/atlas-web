import {_Structure} from '@atlas-dom';
import type {Children} from "@types";

export function _If(when: () => boolean, ...children: (Children | (() => Children))[]): DocumentFragment {
    const fragment = document.createDocumentFragment();
    const marker = document.createComment("atlas-if");
    fragment.appendChild(marker);
    let currentNodes: Node[] = [];

    const update = () => {
        currentNodes.forEach(node => node.parentNode?.removeChild(node));

        if (when()) {
            const prevListener = (window as any)._atlas?.activeListener;
            (window as any)._atlas.activeListener = () => {};

            const evaluatedChildren = children.map(child =>
                typeof child === 'function' ? child() : child
            );

            const nextContent = _Structure(...evaluatedChildren);

            (window as any)._atlas.activeListener = prevListener;

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