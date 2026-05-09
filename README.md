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

## ⌨️ TypeScript Support

Atlas is written in TypeScript and provides full type safety. You can import internal types if needed:

```typescript
import { Route, Traits, View } from 'atlas/types';
```

---

## 📄 License

MIT
