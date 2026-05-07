# 🌍 Atlas Framework

Atlas is a lightweight, modular, and reactive TypeScript framework for building modern web applications. It focuses on simplicity, performance, and a declarative developer experience.

## 🚀 Key Features

- **Reactive State**: Effortless state management using JavaScript Proxies.
- **Declarative DOM**: Create UI components using simple, type-safe functions.
- **Smart Reactivity**: Only updates the parts of the DOM that actually change.
- **Built-in Router**: Client-side routing with parameter support and automatic link interception.
- **Zero Dependencies**: Core framework is built from scratch with no external runtime dependencies.
- **Modular Imports**: Pay only for what you use with dedicated entry points for state, DOM, and routing.

---

## 📦 Installation

Atlas is currently designed to be used as a library within your TypeScript project.

```bash
npm install atlas
```

---

## 🛠 Usage

Atlas is divided into three main modules that can be imported separately:

### 1. Reactive State (`atlas`)
Create a reactive state object that automatically triggers UI updates when modified.

```typescript
import { createState } from 'atlas';

const state = createState({
    count: 0,
    user: { name: 'Atlas' }
});

// Any change to state will trigger updates in subscribed DOM elements
state.count++;
```

### 2. UI & Components (`atlas/dom`)
Build your UI declaratively using capitalized element functions. You can create reusable components by simply writing functions that return Atlas elements.

```typescript
import { Div, H1, Button, P } from 'atlas/dom';
import { createState } from 'atlas';

const state = createState({ count: 0 });

// A reusable component
const Counter = (props: { label: string }) => 
    Div({ class: 'counter-box' },
        H1({ text: props.label }),
        P({ text: () => `Count: ${state.count}` }),
        Button({ 
            onClick: () => state.count++,
            text: 'Add'
        })
    );

// Usage
document.body.appendChild(Counter({ label: 'My Counter' }));
```

### 3. Routing (`atlas/router`)
Manage navigation and views with the `Router` (exported as `AtlasRouter`).

```typescript
import { AtlasRouter } from 'atlas/router';
import { Div, H1 } from 'atlas/dom';

const routes = [
    { 
        path: '/', 
        view: () => Div({}, H1({ text: 'Home Page' })) 
    },
    { 
        path: '/user/:id', 
        view: (params) => Div({}, H1({ text: `User Profile: ${params.id}` })) 
    }
];

const router = new AtlasRouter({
    rootId: 'app',
    routes
});
```

---

## 🧬 Core Concepts

### Reactivity
Atlas uses a "pull-based" reactivity system. When you pass a function as a trait (like `text` or `style`), Atlas automatically subscribes that element to state changes. When any part of your reactive state changes, all subscribed elements re-evaluate their reactive traits.

### Lifecycle Hooks
Every Atlas element supports lifecycle hooks to manage side effects:

- `onMount`: Triggered when the element is added to the DOM.
- `onUnmount`: Triggered when the element is removed from the DOM.
- `onUpdate`: Triggered whenever a reactive trait of the element is updated.

```typescript
Div({
    onMount: (el) => console.log('Div added!', el),
    onUnmount: (el) => console.log('Div removed!'),
    text: 'I am alive'
})
```

### Components
In Atlas, a component is simply a function that returns an `HTMLElement` or a `DocumentFragment`. Since Atlas uses standard DOM nodes, you can compose them naturally.

```typescript
import { Div, P, Structure } from 'atlas/dom';

// Component with children
const Layout = (props: any, ...children: any[]) => 
    Div({ class: 'layout' },
        HeaderComponent(),
        Main({ class: 'content' }, ...children),
        FooterComponent()
    );

// Usage
const Page = () => Layout({}, 
    P({ text: 'This is the main content' })
);
```

### Conditional Rendering (`Gate`)
Use the `Gate` component for efficient conditional rendering.

```typescript
import { Gate } from 'atlas/dom';

Gate(
    { 
        when: () => state.isLoggedIn, 
        fallback: Button({ text: 'Login' }) 
    },
    P({ text: 'Welcome back!' })
)
```

### Lists & Loops (`Loop`)
Use the `Loop` component for efficient rendering of reactive lists. It performs basic diffing to only update the DOM when items change.

```typescript
import { Loop, Li } from 'atlas/dom';

Loop({
    each: () => state.items,
    render: (item) => Li({ text: item.name })
})
```

---

## 📚 API Reference

### `atlas`
- `createState<T>(initialState: T): T`: Wraps an object in a Proxy to track changes recursively.

### `atlas/dom`
- `Div`, `Span`, `P`, `H1`, `Button`, `Input`, etc.: Functions to create specific HTML elements.
- `Fragment(tag, traits, ...children)`: The base function for creating any HTML element.
- `Structure(...children)`: Returns a `DocumentFragment` containing the provided children.
- `Gate({ when, fallback }, ...children)`: A reactive wrapper for conditional rendering.
- `Loop({ each, render })`: A reactive wrapper for rendering lists with basic diffing.
- `H1, H2, H3, P, Button, Input, Pre, Code, ...`: Standard HTML elements as capitalized functions.

### `atlas/router`
- `AtlasRouter({ rootId, routes })`: 
    - `navigate(path)`: Programmatically change the URL.
    - `render()`: Re-renders the current route (usually handled automatically).

---

## ⌨️ TypeScript Support

Atlas is written in TypeScript and provides full type safety. You can import internal types if needed:

```typescript
import { Route, Traits, View } from 'atlas/types';
```

---

## 📄 License

MIT
