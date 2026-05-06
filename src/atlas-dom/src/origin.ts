import type { Traits, Children } from "@types";

/**
 * Creates a new HTML element with the specified tag, traits, and children.
 *
 * @param {string} tag - The HTML tag name (e.g., 'div', 'h1').
 * @param {any} [traits={}] - An object containing attributes, events, and reactive bindings.
 * @param {...Children[]} children - Child elements or text strings to be appended.
 * @returns {HTMLElement} The constructed HTML element.
 */
export function Origin(tag: string, traits: any = {}, ...children: Children[]): HTMLElement {
    const element = document.createElement(tag);

    for (const [key, value] of Object.entries(traits)) {
        if (key.startsWith('on') && typeof value === 'function') {
            const eventName = key.toLowerCase().substring(2);
            element.addEventListener(eventName, value as EventListener);
        }

        else if (typeof value === 'function') {
            const update = () => {
                const freshValue = value();
                if (key === 'style' && typeof freshValue === 'string') {
                    element.style.cssText = freshValue;
                }
                else (element as any)[key] = freshValue;
            };

            if ((window as any)._atlas_subscribe) {
                (window as any)._atlas_subscribe(update);
            }

            update();
        }

        else {
             if (key === 'style' && typeof value === 'string') {
                element.style.cssText = value;
            }
            else {
                try {
                    (element as any)[key] = value;
                } catch {
                    element.setAttribute(key, String(value));
                }
            }
        }
    }

    children.flat().forEach(child => {
        if (child instanceof Node) {
            element.appendChild(child);
        } else if (typeof child === 'string' || typeof child === 'number') {
            element.appendChild(document.createTextNode(String(child)));
        }
    });

    return element;
}

const tags = [
    'div', 'span', 'p', 'h1', 'h2', 'h3', 'button', 'input',
    'nav', 'section', 'article', 'a', 'main', 'header', 'footer',
    'ul', 'li', 'img', 'form', 'label', 'canvas', 'video'
] as const;

type AtlasTags = {
    [K in typeof tags[number] as Capitalize<K>]: (
        traits?: Traits<K>,
        ...children: Children[]
    ) => HTMLElement;
};

const elements = {} as any;

tags.forEach((tag) => {
    const capitalizedName = tag.charAt(0).toUpperCase() + tag.slice(1);
    elements[capitalizedName] = (traits?: any, ...children: Children[]) =>
        Origin(tag, traits, ...children);
});

export const {
    Div, Span, P, H1, H2, H3, Button, Input, Nav, Section,
    Article, A, Main, Header, Footer, Ul, Li, Img, Form, Label,
    Canvas, Video
} = elements as AtlasTags;