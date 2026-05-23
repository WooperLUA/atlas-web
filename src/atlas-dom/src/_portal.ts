/**
 * _Portal
 * Renders an Atlas element into a different part of the DOM.
 *
 * @param element - The Atlas element/component to render.
 * @param target - The DOM element where the portal should live or a CSS selector (default: document.body).
 * @returns An empty Comment node to act as a placeholder in the original tree.
 */
export function _Portal(element: HTMLElement, target: HTMLElement | string = document.body): Comment
{
    if (target instanceof HTMLElement)
        target.appendChild(element);
    else
        document.body.querySelector(target)?.append(element);

    return document.createComment('atlas-portal-placeholder');
}