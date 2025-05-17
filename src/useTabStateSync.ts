import { useEffect, useRef, useState } from 'react';
import { TabStateSync } from './TabStateSync';

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