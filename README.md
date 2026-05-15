# 🌍 Atlas Framework

Atlas is a lightweight, modular, and reactive TypeScript framework for building modern web applications. It focuses on simplicity, performance, and a declarative developer experience.

🚀 Key Features

- Reactive State: Effortless state management using JavaScript Proxies.
- Declarative DOM: Create UI components using simple, type-safe functions.
- Smart Reactivity: Only updates the parts of the DOM that actually change.
- Built-in Router: Client-side routing with parameter support and automatic link interception.
- Zero Dependencies: Core framework is built from scratch with no external runtime dependencies.
- Modular Imports: Pay only for what you use with dedicated entry points for state, DOM, and routing.

--------------------------------------------------------------------------------

# 📦 Installation

npm install atlas-web

# 📖 Documentation

Explore the full guides and API references:
https://wooperlua.github.io/atlas-docs/

--------------------------------------------------------------------------------

# 🛠️ Quick Start

Atlas is organized into modular entry points. Here is how you use them:

### Core & Reactivity
import { state, effect } from 'atlas-web';

const data = state({ count: 0 });
effect(() => console.log(`Count is: ${data.count}`));

### DOM Manipulation
import { h } from 'atlas-web/dom';

const element = h('div', { class: 'container' }, [
    h('h1', {}, 'Hello Atlas')
]);

### Routing
import { AtlasRouter } from 'atlas-web/router';

new AtlasRouter({
    rootId: 'app',
    routes: [
        { path: '/', view: HomeView },
        { path: '/about', view: AboutView }
    ]
});

--------------------------------------------------------------------------------

# ⌨️ TypeScript Support

Atlas is written in TypeScript and provides full type safety. You can import internal types if needed:

import type { Route, View } from 'atlas-web/types';

--------------------------------------------------------------------------------

# 📄 License

MIT © Wooper (https://github.com/WooperLUA)