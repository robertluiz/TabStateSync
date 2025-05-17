# 🧩 TabStateSync

![CI](https://github.com/robertluiz/TabStateSync/actions/workflows/ci.yml/badge.svg)
![Tests](https://github.com/robertluiz/TabStateSync/actions/workflows/ci.yml/badge.svg?label=tests)

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

### `createTabStateSync(key: string): TabStateSync`
Creates a new sync channel for a given key.

### `TabStateSync<T>`
Class for synchronizing state across tabs.

#### Constructor
- `new TabStateSync<T>(key: string)`

#### Methods
- `subscribe(callback: (value: T) => void): void` — Registers a callback for value changes from other tabs.
- `unsubscribe(callback: (value: T) => void): void` — Removes a previously registered callback.
- `set(value: T): void` — Updates the value and notifies other tabs.
- `destroy(): void` — Cleans up listeners and disables the instance.

### `useTabStateSync(key: string, initialValue: any): [any, (v: any) => void]` *(React only)*
Custom React hook for syncing state across tabs.

---

## 🧪 E2E Cross-Browser Testing

TabStateSync is tested automatically in Chromium, Firefox and WebKit (Safari) using Playwright.

### How to run E2E tests

1. Build the JS bundle for browser tests:
   ```bash
   npx esbuild src/index.ts --bundle --format=esm --outfile=examples/tabstatesync.bundle.js
   ```
2. Start a local server:
   ```bash
   npx http-server -p 8080 -c-1 .
   ```
3. In another terminal, run Playwright tests:
   ```bash
   npx playwright test
   ```

### Fallback/localStorage test
To test the fallback, temporarily comment out or remove `window.BroadcastChannel` in your browser's devtools or in the bundle, then rerun the E2E test. The library will use localStorage events for sync.

---

## 🚀 Automated Semantic Versioning & Release

This project uses [standard-version](https://github.com/conventional-changelog/standard-version) for automated semantic versioning and changelog generation.

### How to create a new release

1. Commit your changes using [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).
2. Run:
   ```bash
   npm run release
   git push --follow-tags origin master
   ```
3. Create a GitHub release or push a tag (the CI will publish to npm and create the release automatically).

---

## ❓ FAQ & Known Limitations

- **Does it sync between different devices or users?**
  - No. Sync only works between tabs/windows of the same browser and domain.
- **Does it require a backend or cookies?**
  - No. It is 100% client-side and does not use cookies or any backend.
- **What happens if BroadcastChannel is not available?**
  - It automatically falls back to using localStorage events for maximum compatibility. On Safari, due to browser limitations, the library uses a polling mechanism to detect changes, since the storage event is not reliably fired between tabs.
- **Is it suitable for real-time multi-user collaboration?**
  - No. It is designed for client-side, same-user scenarios (e.g., SPAs, PWAs, admin panels).
- **Does it work in incognito/private mode?**
  - Yes, as long as the browser supports BroadcastChannel or localStorage events in that mode. On Safari, the fallback uses polling to ensure sync even when the storage event does not fire.
- **What about memory leaks?**
  - Always call `destroy()` when you no longer need a TabStateSync instance (e.g., on component unmount).

---

## 🛡️ Browser Support

* Full support: Chrome, Edge, Firefox, Safari (latest)
* Falls back to `localStorage` for legacy browsers

---

## 📄 License

MIT

---

Contributions and suggestions are welcome!

---

## Safari/Apple limitations

**Safari (desktop and iOS) does not reliably fire the `storage` event between tabs.**
To ensure cross-tab sync, TabStateSync automatically enables a polling fallback only on Safari, checking for changes every 500ms. This ensures maximum compatibility, but may have a slight performance impact only on Safari. All other browsers use the more efficient `storage` event.
