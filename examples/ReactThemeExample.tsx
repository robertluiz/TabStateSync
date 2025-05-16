import React from 'react';
import { useTabStateSync } from '../src';

export function ThemeSwitcher() {
    const [theme, setTheme] = useTabStateSync<'light' | 'dark'>('theme', 'light');
    const toggle = () => setTheme(theme === 'light' ? 'dark' : 'light');
    return (
        <button onClick={toggle}>
            Switch to {theme === 'light' ? 'dark' : 'light'}
        </button>
    );
} 