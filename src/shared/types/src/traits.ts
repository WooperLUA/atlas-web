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

    /** Click event listener. */
    onClick?: (e: MouseEvent) => void;
    /** Input event listener. */
    onInput?: (e: InputEvent) => void;
    /** Change event listener. */
    onChange?: (e: Event) => void;
};