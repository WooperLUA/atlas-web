import type {Children} from "@types";

export interface LoopTraits<T>
{
    each: () => T[];
    render: (item: T, index: number) => Children;
}

export function Loop<T>(props: LoopTraits<T>): DocumentFragment
{
    const marker = document.createComment("atlas-loop");
    const fragment = document.createDocumentFragment();
    fragment.appendChild(marker);

    let currentItems: T[] = [];
    let currentNodes: Node[] = [];

    const update = () =>
    {
        const newItems = props.each();

        const newNodes: Node[] = [];

        for (let i = 0; i < newItems.length; i++)
        {
            if (i < currentItems.length && currentItems[i] === newItems[i])
            {

                newNodes[i] = currentNodes[i]!;
            } else
            {

                const rendered = props.render(newItems[i]!, i);
                let node: Node;
                if (rendered instanceof Node)
                {
                    node = rendered;
                } else
                {
                    node = document.createTextNode(String(rendered));
                }
                newNodes[i] = node;

                if (i < currentNodes.length)
                {

                    const oldNode = currentNodes[i]!;
                    oldNode.parentNode?.replaceChild(node, oldNode);
                } else
                {

                    marker.before(node);
                }
            }
        }


        if (currentNodes.length > newItems.length)
        {
            for (let i = newItems.length; i < currentNodes.length; i++)
            {
                currentNodes[i]?.parentNode?.removeChild(currentNodes[i]!);
            }
        }

        currentItems = [...newItems];
        currentNodes = newNodes;
    };

    if ((window as any)._atlas_subscribe)
    {
        (window as any)._atlas_subscribe(update);
    }

    update();
    return fragment;
}