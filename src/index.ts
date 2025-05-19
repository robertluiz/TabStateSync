import { TabStateSync, TabStateSyncOptions } from './TabStateSync';
import { useTabStateSync } from './useTabStateSync';

/**
 * Creates a new TabStateSync instance for a given key/channel.
 * @param key Unique key/channel for the sync.
 * @param options Configuration options for TabStateSync.
 * @returns TabStateSync instance for the given key.
 */
export function createTabStateSync<T = any>(key: string, options?: TabStateSyncOptions) {
  return new TabStateSync<T>(key, options);
}

export { TabStateSync, TabStateSyncOptions, useTabStateSync }; 