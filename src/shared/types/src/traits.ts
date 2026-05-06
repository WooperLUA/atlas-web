/**
 * Represents a value that can be either static or a reactive function.
 */
export type Reactive<T> = T | (() => T);

/**
 * Defines the attributes and event listeners for an HTML element.
 * Supports reactive bindings for standard properties.
 *
 * @template T - The HTML tag name.
 */
export type Traits<T extends keyof HTMLElementTagNameMap> = {
    [K in keyof Omit<Partial<HTMLElementTagNameMap[T]>, 'style'>]: Reactive<HTMLElementTagNameMap[T][K]>;
} & {

    style?: Reactive<string>;
    text?: Reactive<string>;

    /* Event listener. */
    onClick?: (e: MouseEvent) => void;
    onInput?: (e: InputEvent) => void;
    onChange?: (e: Event) => void;

    /* Lifecycle */
    onMount?: (el: HTMLElementTagNameMap[T]) => void;
    onUnmount?: (el: HTMLElementTagNameMap[T]) => void;
    onUpdate?: (el: HTMLElementTagNameMap[T]) => void;
};