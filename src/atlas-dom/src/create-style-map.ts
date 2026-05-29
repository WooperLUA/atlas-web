import type { AtlasCSS } from "@types";

/**
 * Generates a scoped CSS class to prevent style leakage.
 * Converts camelCase properties to kebab-case and prefixes selectors.
 *
 * @param css - Record of selectors and CSS property maps.
 * @returns Unique class name string to apply to root elements.
 */
export function createStyleMap(css: Record<string, AtlasCSS>): string {
    const scopeId = `atlas-${Math.random().toString(36).slice(2, 7)}`;

    const scopedCss = Object.entries(css).map(([selector, properties]) => {
       // camel to snake
        const rules = Object.entries(properties)
            .map(([prop, value]) => {
                const kebabProp = prop.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
                return `${kebabProp}: ${value};`;
            })
            .join(' ');

        const scopedSelector = selector.trim()
            .split(',')
            .map(s => `.${scopeId} ${s.trim()}`)
            .join(', ');

        return `${scopedSelector} { ${rules} }`;
    }).join('\n');

    let styleTag = document.getElementById('atlas-scoped-styles') as HTMLStyleElement;
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'atlas-scoped-styles';
        document.head.appendChild(styleTag);
    }

    styleTag.textContent += `\n/* Scope: ${scopeId} */\n${scopedCss}`;

    return scopeId;
}