import type {Traits, Children, AtlasNode} from "@types";
import {logger} from "@services";

function applyStyle(element: HTMLElement, style: any)
{
    if (typeof style === 'string')
    {
        element.style.cssText = style;
    }
    else if (style && typeof style === 'object')
    {
        element.style.cssText = '';
        window.Object.assign(element.style, style);
    }
}

export function Fragment(tag: string, traits: any = {}, ...children: Children[]): AtlasNode<any>
{
    const svgTags = [
        'svg', 'path', 'circle', 'rect', 'line', 'polyline',
        'polygon', 'ellipse', 'g', 'defs', 'clipPath', 'text', 'use',
        'animate', 'animateMotion', 'animateTransform', 'desc', 'foreignObject',
        'image', 'linearGradient', 'marker', 'mask', 'metadata', 'pattern',
        'radialGradient', 'stop', 'switch', 'symbol', 'textPath', 'tspan', 'view'
    ];
    const isSvg = svgTags.includes(tag.toLowerCase());

    const element = isSvg
        ? (document.createElementNS('http://www.w3.org/1999/svg', tag) as SVGElement)
        : document.createElement(tag);

    // Call window.Object.entries explicitly to prevent the variable name minification clash
    for (const [key, value] of window.Object.entries(traits))
    {
        if (key.startsWith('on') && typeof value === 'function')
        {
            const eventName = key.toLowerCase().substring(2);
            element.addEventListener(eventName, value as EventListener);
        }
        else if (typeof value === 'function')
        {
            const update = () =>
            {
                const freshValue = value();
                if (key === 'style')
                {
                    applyStyle(element as HTMLElement, freshValue);
                }
                else
                {
                    (element as any)[key] = freshValue;
                }

                if ((element as any)._atlas_onUpdate)
                {
                    (element as any)._atlas_onUpdate(element);
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
        }
        else
        {
            if (key === 'style')
            {
                applyStyle(element as HTMLElement, value);
            }
            else
            {
                try
                {
                    (element as any)[key] = value;
                }
                catch
                {
                    element.setAttribute(key, String(value));
                }
            }
        }
    }

    if (traits.onMount) (element as any)._atlas_onMount = traits.onMount;
    if (traits.onUnmount) (element as any)._atlas_onUnmount = traits.onUnmount;
    if (traits.onUpdate) (element as any)._atlas_onUpdate = traits.onUpdate;

    children.flat().forEach(child =>
    {
        if (child instanceof HTMLElement && !(child as any)._atlas_onMount) {
            logger.warn('Atlas-Dom','You are appending a raw HTMLElement. Please use Atlas factory functions instead.' )
        }

        if (child instanceof Node)
        {
            element.appendChild(child);
        }
        else if (typeof child === 'string' || typeof child === 'number')
        {
            element.appendChild(document.createTextNode(String(child)));
        }
    });

    return element;
}

const tags = [
    'html', 'head', 'title', 'base', 'link', 'meta', 'style',
    'body', 'article', 'section', 'nav', 'aside', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'header', 'footer', 'address', 'main',
    'p', 'hr', 'pre', 'blockquote', 'ol', 'ul', 'menu', 'li', 'dl', 'dt', 'dd',
    'figure', 'figcaption', 'div',
    'a', 'em', 'strong', 'small', 's', 'cite', 'q', 'dfn', 'abbr', 'ruby', 'rt', 'rp',
    'data', 'time', 'code', 'var', 'samp', 'kbd', 'sub', 'sup', 'i', 'b', 'u', 'mark',
    'bdi', 'bdo', 'span', 'br', 'wbr',
    'img', 'iframe', 'embed', 'object', 'picture', 'source', 'portal',
    'video', 'audio', 'track', 'canvas', 'map', 'area',
    'form', 'label', 'input', 'button', 'select', 'datalist', 'optgroup', 'option',
    'textarea', 'output', 'progress', 'meter', 'fieldset', 'legend',
    'details', 'summary', 'dialog', 'search',
    'ins', 'del', 'script', 'noscript', 'template', 'slot',
    'table', 'caption', 'colgroup', 'col', 'tbody', 'thead', 'tfoot', 'tr', 'td', 'th',
    'svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse', 'g',
    'defs', 'clipPath', 'text', 'use', 'animate', 'animateMotion', 'animateTransform',
    'desc', 'foreignObject', 'image', 'linearGradient', 'marker', 'mask', 'metadata',
    'pattern', 'radialGradient', 'stop', 'switch', 'symbol', 'textPath', 'tspan', 'view'
] as const;

type AtlasTags = {
    /**
     * Creates a reactive Atlas component.
     *
     * @param traits HTML attributes, DOM properties, reactive styles, and lifecycle hooks.
     * @param children Child elements, strings, numbers, or reactive components.
     * @returns An AtlasNode seamlessly integrated into the reactivity graph.
     */
    [K in typeof tags[number] as Capitalize<K>]: (
        traits?: Traits<K extends keyof HTMLElementTagNameMap ? K : 'div'>,
        ...children: Children[]
    ) => AtlasNode<any>;
};

export const Atlas = new Proxy({} as any, {
    get(target, prop: string)
    {
        if (typeof prop !== 'string') return target[prop];

        const tag = prop.charAt(0).toLowerCase() + prop.slice(1);

        if (!target[prop])
        {
            target[prop] = (traits?: any, ...children: Children[]) =>
                Fragment(tag, traits, ...children);
        }
        return target[prop];
    }
}) as AtlasTags & Record<string, any>;

const elements = {} as any;

tags.forEach((tag) =>
{
    const capitalizedName = tag.charAt(0).toUpperCase() + tag.slice(1);
    elements[capitalizedName] = Atlas[capitalizedName];
});

export const {
    Html, Head, Title, Base, Link, Meta, Style,
    Body, Article, Section, Nav, Aside, H1, H2, H3, H4, H5, H6,
    Header, Footer, Address, Main,
    P, Hr, Pre, Blockquote, Ol, Ul, Menu, Li, Dl, Dt, Dd,
    Figure, Figcaption, Div,
    A, Em, Strong, Small, S, Cite, Q, Dfn, Abbr, Ruby, Rt, Rp,
    Data, Time, Code, Var, Samp, Kbd, Sub, Sup, I, B, U, Mark,
    Bdi, Bdo, Span, Br, Wbr,
    Img, Iframe, Embed, Object, Picture, Source, Portal,
    Video, Audio, Track, Canvas, Map, Area,
    Form, Label, Input, Button, Select, Datalist, Optgroup, Option,
    Textarea, Output, Progress, Meter, Fieldset, Legend,
    Details, Summary, Dialog, Search,
    Ins, Del, Script, Noscript, Template, Slot,
    Table, Caption, Colgroup, Col, Tbody, Thead, Tfoot, Tr, Td, Th,
    Svg, Path, Circle, Rect, Line, Polyline, Polygon, Ellipse, G,
    Defs, ClipPath, Text, Use, Animate, AnimateMotion, AnimateTransform,
    Desc, ForeignObject, Image, LinearGradient, Marker, Mask, Metadata,
    Pattern, RadialGradient, Stop, Switch, Symbol, TextPath, Tspan, View
} = elements;