# 🧩 TabStateSync

[![npm version](https://img.shields.io/npm/v/tabstatesync.svg)](https://www.npmjs.com/package/tabstatesync)
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

See also complete examples in [`examples/VanillaThemeExample.ts`](examples/VanillaThemeExample.ts) and [`examples/e2e-sync.html`](examples/e2e-sync.html).

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

See also complete example in [`examples/ReactThemeExample.tsx`](examples/ReactThemeExample.tsx).

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

### `createTabStateSync(key: string, options?: TabStateSyncOptions): TabStateSync`
Creates a new sync channel for a given key with optional configuration.

### `TabStateSync<T>`
Class for synchronizing state across tabs.

#### Constructor
- `new TabStateSync<T>(key: string, options?: TabStateSyncOptions)`

#### Methods
- `subscribe(callback: (value: T) => void): void` — Registers a callback for value changes from other tabs.
- `unsubscribe(callback: (value: T) => void): void` — Removes a previously registered callback.
- `set(value: T): void` — Updates the value and notifies other tabs.
- `destroy(): void` — Cleans up listeners and disables the instance.

### `TabStateSyncOptions`
Configuration options for `TabStateSync`.

```ts
interface TabStateSyncOptions {
  // Namespace prefix for localStorage keys to prevent collisions
  namespace?: string; // default: 'tss'
  
  // Enable simple encryption for localStorage storage
  enableEncryption?: boolean; // default: false
  
  // Secret key for encryption (use a random string)
  encryptionKey?: string; // default: 'change-this-key'
  
  // Enable debug logging of errors
  debug?: boolean; // default: false
}
```

### `useTabStateSync(key: string, initialValue: any, options?: TabStateSyncOptions): [any, (v: any) => void]` *(React only)*
Custom React hook for syncing state across tabs.


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
- **Is my data secure when stored in localStorage?**
  - By default, data in localStorage is stored in plaintext. For improved security, enable the encryption option, but note that this is NOT suitable for highly sensitive data. The library uses a simple XOR encryption that helps prevent casual inspection but is not cryptographically secure.

## Security Considerations

- **Data Security**: The optional encryption feature provides basic protection against casual inspection of localStorage data. However, it is not a replacement for proper encryption and should not be used for highly sensitive information.
- **XSS Protection**: Always sanitize any HTML content before rendering it to the DOM, especially if it was received through TabStateSync.
- **Error Handling**: Enable debug mode during development to catch potential issues with data formatting or transport.
- **Namespace Collisions**: Use the namespace option to prevent key collisions with other applications or libraries using localStorage.

---

## 🛡️ Browser Support

* Full support: Chrome, Edge, Firefox, Safari (latest)
* Falls back to `localStorage` for legacy browsers

---

## Safari/Apple limitations

**Safari (desktop and iOS) does not reliably fire the `storage` event between tabs.**
To ensure cross-tab sync, TabStateSync automatically enables a polling fallback only on Safari, checking for changes every 500ms. This ensures maximum compatibility, but may have a slight performance impact only on Safari. All other browsers use the more efficient `storage` event.

---

## 📄 License

MIT

---

Contributions and suggestions are welcome!

---

## 🧪 E2E Cross-Browser Testing

TabStateSync is automatically tested in Chromium, Firefox, and WebKit (Safari) using Playwright. This ensures robust cross-browser compatibility, including fallback and edge cases.

### How to run E2E tests locally

1. **Build the JS bundle for browser tests:**
   ```bash
   npm run build:bundle
   ```
2. **Start a local server:**
   ```bash
   npm run serve:e2e
   ```
3. **In another terminal, run Playwright tests:**
   ```bash
   npm run test:e2e
   ```

- The tests will open browsers automatically and check sync between tabs, fallback to localStorage, and edge cases.
- To test the fallback, temporarily comment out or remove `window.BroadcastChannel` in your browser's devtools or in the bundle, then rerun the E2E test. The library will use localStorage events for sync.

#### Available npm scripts for E2E and build

- `npm run build:bundle` — Build browser bundle for E2E/examples
- `npm run serve:e2e` — Serve local files for browser tests
- `npm run test:e2e` — Run Playwright E2E tests

---


