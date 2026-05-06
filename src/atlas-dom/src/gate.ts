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
        // Remove old nodes from the DOM
        currentContent.forEach(node => node.parentNode?.removeChild(node));
        currentContent = [];

        if (props.when())
        {
            // We create a temporary fragment to parse children
            const tempFrag = document.createDocumentFragment();
            children.flat().forEach(child =>
            {
                if (child instanceof Node) tempFrag.appendChild(child);
                else tempFrag.appendChild(document.createTextNode(String(child)));
            });

            // Keep track of what we added so we can remove it later
            currentContent = Array.from(tempFrag.childNodes);

            // Insert before the marker in the actual DOM
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