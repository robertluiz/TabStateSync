import { useEffect, useRef, useState } from 'react';
import { TabStateSync } from './TabStateSync';

/**
 * React hook for synchronizing state across browser tabs using TabStateSync.
 * @param key Unique key/channel for the sync.
 * @param initialValue Initial value for the state.
 * @returns [state, setState] tuple, like useState, but synced across tabs.
 */
export function useTabStateSync<T = any>(key: string, initialValue: T): [T, (v: T) => void] {
  const [state, setState] = useState<T>(initialValue);
  const syncRef = useRef<TabStateSync<T> | null>(null);

  useEffect(() => {
    syncRef.current = new TabStateSync<T>(key);
    const handleChange = (value: T) => setState(value);
    syncRef.current.subscribe(handleChange);
    return () => {
      if (syncRef.current) {
        syncRef.current.unsubscribe(handleChange);
        syncRef.current.destroy();
      }
    };
  }, [key]);

  const set = (value: T) => {
    setState(value);
    syncRef.current?.set(value);
  };

  return [state, set];
} 