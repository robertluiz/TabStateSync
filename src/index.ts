import { TabStateSync } from './TabStateSync';
import { useTabStateSync } from './useTabStateSync';

export function createTabStateSync<T = any>(key: string) {
  return new TabStateSync<T>(key);
}

export { TabStateSync, useTabStateSync }; 