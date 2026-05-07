import type {Children} from "@types";

export function Gate(
    props: { when: () => boolean; fallback?: HTMLElement | string | Node },
    ...children: Children[]
): DocumentFragment
{
    const marker = document.createComment("atlas-show");
    const fragment = document.createDocumentFragment();
    fragment.appendChild(marker);

    let currentContent: Node[] = [];

    const update = () =>
    {

        currentContent.forEach(node => node.parentNode?.removeChild(node));
        currentContent = [];

        if (props.when())
        {

            const tempFrag = document.createDocumentFragment();
            children.flat().forEach(child =>
            {
                if (child instanceof Node) tempFrag.appendChild(child);
                else tempFrag.appendChild(document.createTextNode(String(child)));
            });


            currentContent = Array.from(tempFrag.childNodes);


            marker.before(tempFrag);
        } else if (props.fallback)
        {
            const fallbackNode = props.fallback instanceof Node
                ? props.fallback
                : document.createTextNode(String(props.fallback));

            currentContent = [fallbackNode];
            marker.before(fallbackNode);
        }
    };

    if ((window as any)._atlas_subscribe)
    {
        (window as any)._atlas_subscribe(update);
    }

    update();
    return fragment;
}