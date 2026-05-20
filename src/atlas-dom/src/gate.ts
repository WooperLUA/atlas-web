import { Structure } from './structure.ts';
import type { Children } from "@types";

/**
 * Gate
 * Conditionally renders child elements based on a reactive condition function.
 *
 * @param {() => boolean} when - A reactive function that returns a boolean condition.
 * @param {...Children[]} children - Elements to render when the condition is true.
 * @returns {DocumentFragment} A live DOM fragment that handles its own updates.
 */
export function Gate(when: () => boolean, ...children: Children[]): DocumentFragment
{
    const fragment = document.createDocumentFragment();
    const marker = document.createComment("atlas-gate");
    fragment.appendChild(marker);

    let currentNodes: Node[] = [];

    const update = () =>
    {
        currentNodes.forEach(node => node.parentNode?.removeChild(node));

        const nextContent = when() ? Structure(...children) : null;

        if (nextContent)
        {
            currentNodes = Array.from(nextContent.childNodes);
            marker.before(nextContent);
        }
        else
        {
            currentNodes = [];
        }
    };

    const globalContext = (window as any)._atlas;
    if (globalContext) globalContext.activeListener = update;

    try
    {
        update();
    }
    finally
    {
        if (globalContext) globalContext.activeListener = null;
    }

    return fragment;
}