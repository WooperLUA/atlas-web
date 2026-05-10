/**
 * Overlay
 * Renders an Atlas element into a different part of the DOM.
 *
 * @param element - The Atlas element/component to render.
 * @param target - The DOM element where the portal should live (default: document.body).
 * @returns An empty Comment node to act as a placeholder in the original tree.
 */
export function Overlay(element: HTMLElement, target: HTMLElement = document.body): Comment
{
    target.appendChild(element);

    return document.createComment('atlas-overlay-placeholder');
}