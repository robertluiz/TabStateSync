# TabStateSync Implementation

TabStateSync is a lightweight JavaScript/TypeScript library for synchronizing state across multiple browser tabs in real time, with no backend required. It uses the BroadcastChannel API (with a localStorage fallback) and provides both a functional API and a React hook.

## Completed Tasks

- [x] Create initial README.md with project description
- [x] Set up project structure (package.json, tsconfig.json, .gitignore)
- [x] Implement core module using BroadcastChannel API
- [x] Implement automatic fallback to localStorage
- [x] Implement subscribe method (listen for changes)
- [x] Implement set method (send new value)
- [x] Prevent duplicate events from own tab
- [x] Support multiple keys/channels
- [x] Create custom React hook: useTabStateSync(key, initialValue)

## In Progress Tasks

- [ ] Ensure automatic updates in all React components
- [ ] Test React integration
- [ ] Implement unit tests (Jest or Vitest)
- [ ] Test support in different browsers (Chrome, Firefox, Edge, Safari)
- [ ] Ensure fallback works (localStorage)
- [ ] Add usage examples (React and Vanilla JS)
- [ ] Document API (JSDoc and README)
- [ ] Add "How to use" section with examples
- [ ] Write FAQ/known limitations
- [ ] Prepare build for npm publish
- [ ] Add npm badge and GitHub Actions for build/test

## Future Tasks

- [ ] Support custom events (not just values, but commands)
- [ ] Example usage with Vue or another framework
- [ ] Create site/demo (e.g., Vercel/Netlify) with interactive playground
- [ ] Promote repository (Twitter, Reddit, JS/TS communities)

## Implementation Plan

The library will expose a function-based API for vanilla JS/TS and a custom React hook. It will use BroadcastChannel for modern browsers and fallback to localStorage events for compatibility. The core will support multiple channels (by key), allow subscribing to changes, and setting values. The React hook will mirror useState but sync across tabs. Tests and documentation will ensure reliability and ease of use.

### Relevant Files

- README.md - Project overview and usage instructions ✅
- TASKS.md - Task list and implementation plan (this file)
- src/index.ts - Main entry point for the library
- src/TabStateSync.ts - Core logic for state synchronization
- src/useTabStateSync.ts - React hook for state sync
- src/__tests__/ - Unit tests for core and hook
- examples/ - Usage examples (React and Vanilla JS) 