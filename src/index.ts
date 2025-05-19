import { TabStateSync } from './TabStateSync';
import { useTabStateSync } from './useTabStateSync';

/**
 * Creates a new TabStateSync instance for a given key/channel.
 * @param key Unique key/channel for the sync.
 * @returns TabStateSync instance for the given key.
 */
export function createTabStateSync<T = any>(key: string) {
  return new TabStateSync<T>(key);
}

export { TabStateSync, useTabStateSync }; 