import type {AtlasCSS} from "@shared/types";

/**
 * Represents a value that can be either static or a reactive function.
 */
export type Reactive<T> = T | (() => T);

/**
 * Defines the attributes and event listeners for an AtlasNode.
 * Supports reactive bindings for standard properties.
 *
 * @template T - The HTML tag name.
 */
export type AtlasTraits<T extends keyof HTMLElementTagNameMap> =
    {
        [P in keyof Omit<HTMLElementTagNameMap[T], 'style'>]?: HTMLElementTagNameMap[T][P] extends string
        ? Reactive<string | number>
        : Reactive<HTMLElementTagNameMap[T][P]>;
    } &
{

    style?: Reactive<AtlasCSS | string>;

    /* Lifecycle */
    onMount?: (el: HTMLElementTagNameMap[T]) => void;
    onUnmount?: (el: HTMLElementTagNameMap[T]) => void;
    onUpdate?: (el: HTMLElementTagNameMap[T]) => void;
};