import type {Children} from "@types";

export function _Structure(...children: Children[]): DocumentFragment
{
    const fragment = document.createDocumentFragment();

    children.flat().forEach(child =>
    {
        if (typeof child === 'string')
        {
            fragment.appendChild(document.createTextNode(child));
        }
        else if (child instanceof Node)
        {
            fragment.appendChild(child);
        }
    });

    return fragment;
}