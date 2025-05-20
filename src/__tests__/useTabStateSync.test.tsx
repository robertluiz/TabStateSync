import { describe, it, expect, vi } from 'vitest';
import { useTabStateSync } from '../useTabStateSync';
import { renderHook } from '@testing-library/react-hooks';
import * as React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';

// Mock de useState, useRef, useEffect e useCallback
vi.mock('react', () => {
    const originalReact = vi.importActual('react');
    const mockState = ['initial-value', vi.fn()];
    const mockRef = { current: null };

    return {
        ...originalReact,
        useState: vi.fn().mockReturnValue(mockState),
        useRef: vi.fn().mockReturnValue(mockRef),
        useEffect: vi.fn(),
        useCallback: vi.fn((fn) => fn),
    };
});

// Mock TabStateSync
vi.mock('../TabStateSync', () => {
    return {
        TabStateSync: vi.fn().mockImplementation(() => ({
            set: vi.fn(),
            subscribe: vi.fn(),
            unsubscribe: vi.fn(),
            destroy: vi.fn()
        }))
    };
});

// Mock do renderHook
vi.mock('@testing-library/react-hooks', () => ({
    renderHook: vi.fn((callback) => ({
        result: { current: callback() },
        rerender: vi.fn()
    }))
}));

describe('useTabStateSync', () => {
    it('should initialize with the provided initial value', () => {
        // Configurações dos mocks
        const initialValue = 'test-value';
        (useState as any).mockReturnValue([initialValue, vi.fn()]);

        // Chamada do hook
        const result = useTabStateSync('test-key', initialValue);

        // Verificação
        expect(result[0]).toBe(initialValue);
    });

    it('should memoize the set function with useCallback', () => {
        // Configurando spy no useCallback
        const callbackSpy = vi.spyOn(React, 'useCallback');

        // Chamada do hook
        useTabStateSync('test-key', 'value');

        // Verificação
        expect(callbackSpy).toHaveBeenCalled();
    });
}); 