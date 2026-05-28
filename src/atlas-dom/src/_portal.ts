export function _Portal(element: HTMLElement, target: HTMLElement | string = document.body): Comment {
    const targetEl = target instanceof HTMLElement
        ? target
        : (typeof target === 'string' ? document.querySelector(target) : document.body);

    if (!targetEl) {
        console.warn(`[Atlas-Portal] Target "${target}" not found`);
        return document.createComment('atlas-portal-placeholder');
    }

    targetEl.appendChild(element);

    const placeholder = document.createComment('atlas-portal-placeholder');

    (placeholder as any)._atlas_onUnmount = () => {
        if (element.parentNode) {
            element.parentNode.removeChild(element);
        }
    };

    return placeholder;
}