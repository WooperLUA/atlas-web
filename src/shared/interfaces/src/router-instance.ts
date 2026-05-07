export interface RouterInstance
{
    init: () => void;
    navigateTo: (path: string) => void;
}