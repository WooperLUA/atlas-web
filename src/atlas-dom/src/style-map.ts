import type { AtlasCSS } from "@types";

/**
 * StyleMap scopes a map of CSS rules to a unique container class to prevent style leakage.
 *
 * @param css - A record where keys are CSS selectors and values are {@link AtlasCSS} objects.
 *              Supports multiple selectors (comma-separated) and camelCase properties.
 *
 * @returns A unique class name string (e.g., "atlas-abc12") to be applied to the
 *          component's root element.
 */
export function StyleMap(css: Record<string, AtlasCSS>): string {
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