import { createTabStateSync } from '../src';

const tabSync = createTabStateSync<'light' | 'dark'>('theme');

tabSync.subscribe((newValue) => {
  document.body.setAttribute('data-theme', newValue);
});

function setTheme(theme: 'light' | 'dark') {
  tabSync.set(theme);
}

(window as any).setTheme = setTheme; 