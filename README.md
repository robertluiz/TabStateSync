# 🧩 TabStateSync

**TabStateSync** is a lightweight TypeScript library for synchronizing state across multiple browser tabs.
It leverages the [BroadcastChannel API](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API) (with a `localStorage` fallback) to keep your application's state or events in sync between tabs, with no backend required.

---

## 🚀 Features

* Sync state between tabs in real time.
* Uses `BroadcastChannel` (modern browsers) or falls back to `localStorage` (maximum compatibility).
* Zero dependencies, minimal bundle size.
* Easy to use with React, Vue, or plain JS/TS.

---

## 📦 Installation

```bash
npm install tabstatesync
```

---

## 🛠️ Usage

### Basic Example (Vanilla JS/TS)

```ts
import { createTabStateSync } from 'tabstatesync';

// Create a channel
const tabSync = createTabStateSync('theme');

// Listen for changes from other tabs
tabSync.subscribe((newValue) => {
  console.log('Theme changed in another tab:', newValue);
});

// Update value (all other tabs will be notified)
tabSync.set('dark');
```

---

### React Hook Example

```tsx
import { useTabStateSync } from 'tabstatesync';

function ThemeSwitcher() {
  const [theme, setTheme] = useTabStateSync('theme', 'light');
  
  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Switch to {theme === 'light' ? 'dark' : 'light'}
    </button>
  );
}
```

---

## 💡 Use Cases

* Keep login/logout state synced across tabs
* Real-time shopping cart updates
* User preferences (e.g., theme) consistency
* Cross-tab notifications or dismissals

---

## 📝 API Reference

#### `createTabStateSync(key: string): TabStateSync`

Creates a new sync channel for a given key.

#### `tabStateSync.subscribe(callback: (value: any) => void): void`

Registers a callback for value changes from other tabs.

#### `tabStateSync.set(value: any): void`

Updates the value and notifies other tabs.

#### `useTabStateSync(key: string, initialValue: any): [any, (v: any) => void]` *(React only)*

Custom React hook for syncing state across tabs.

---

## 🛡️ Browser Support

* Full support: Chrome, Edge, Firefox, Safari (latest)
* Falls back to `localStorage` for legacy browsers

---

## 📄 License

MIT

---

Contributions and suggestions are welcome!
