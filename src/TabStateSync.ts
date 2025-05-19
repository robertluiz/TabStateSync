type Callback<T> = (value: T) => void;

/**
 * Configuration options for TabStateSync
 */
export interface TabStateSyncOptions {
  /**
   * Namespace prefix for localStorage keys to prevent collisions
   * @default 'tss'
   */
  namespace?: string;
  
  /**
   * Enable simple encryption for localStorage storage
   * Note: This is not secure for highly sensitive data
   * @default false
   */
  enableEncryption?: boolean;
  
  /**
   * Secret key for encryption (use a random string)
   * Only used if enableEncryption is true
   * @default 'change-this-key'
   */
  encryptionKey?: string;
  
  /**
   * Enable debug logging of errors
   * @default false
   */
  debug?: boolean;
}

/**
 * Simple data validator for cross-tab messages
 */
interface SyncMessage<T> {
  value: T;
  ts: number;
  v: number; // Schema version
}

/**
 * TabStateSync synchronizes state across browser tabs using BroadcastChannel or localStorage.
 * On Safari, a polling fallback is used for localStorage due to unreliable storage events.
 */
export class TabStateSync<T = any> {
  private key: string;
  private channel: BroadcastChannel | null = null;
  private callbacks: Set<Callback<T>> = new Set();
  private lastValue: T | undefined;
  private isBroadcastChannel: boolean;
  private isSetting: boolean = false;
  private destroyed = false;
  private pollingInterval: number | null = null;
  private lastPolledValue: string | null = null;
  private options: Required<TabStateSyncOptions>;
  private static readonly SCHEMA_VERSION = 1;

  private isSafari(): boolean {
    // Basic Safari detection (desktop and iOS)
    return (
      typeof navigator !== 'undefined' &&
      /safari/i.test(navigator.userAgent) &&
      !/chrome|android/i.test(navigator.userAgent)
    );
  }

  /**
   * Creates a new instance of TabStateSync
   * @param key Unique key/channel for the sync
   * @param options Configuration options
   */
  constructor(key: string, options: TabStateSyncOptions = {}) {
    // Set default options
    this.options = {
      namespace: options.namespace ?? 'tss',
      enableEncryption: options.enableEncryption ?? false,
      encryptionKey: options.encryptionKey ?? 'change-this-key',
      debug: options.debug ?? false
    };

    // Apply namespace to key for localStorage
    this.key = `${this.options.namespace}:${key}`;
    
    this.isBroadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window;
    if (this.isBroadcastChannel) {
      // BroadcastChannel doesn't need namespace prefix
      this.channel = new BroadcastChannel(key);
      this.channel.onmessage = (event) => {
        if (this.isSetting) return;
        
        if (!this.isValidMessage(event.data)) {
          this.logError('Invalid message format received:', event.data);
          return;
        }
        
        this.notify(event.data);
      };
    } else if (this.isSafari()) {
      // Safari fallback: use polling because storage event is unreliable
      this.lastPolledValue = localStorage.getItem(this.key); // Initialize with current value
      this.pollingInterval = window.setInterval(() => {
        const raw = localStorage.getItem(this.key);
        if (raw && raw !== this.lastPolledValue) {
          this.lastPolledValue = raw;
          try {
            const decryptedData = this.options.enableEncryption 
              ? this.decrypt(raw) 
              : raw;
              
            const parsed = JSON.parse(decryptedData);
            
            if (!this.isValidSyncMessage(parsed)) {
              this.logError('Invalid data format in localStorage:', parsed);
              return;
            }
            
            this.notify(parsed.value);
          } catch (err) {
            this.logError('Error parsing localStorage data:', err);
          }
        }
      }, 500);
    } else {
      // All other browsers: use storage event
      window.addEventListener('storage', this.onStorage);
    }
  }

  /**
   * Registers a callback to be called when the value changes in another tab.
   * @param callback Function to call with the new value.
   */
  subscribe(callback: Callback<T>): void {
    this.callbacks.add(callback);
  }

  /**
   * Removes a previously registered callback.
   * @param callback The callback to remove.
   */
  unsubscribe(callback: Callback<T>): void {
    this.callbacks.delete(callback);
  }

  /**
   * Sets a new value and notifies other tabs.
   * Uses BroadcastChannel if available, otherwise falls back to localStorage.
   * On Safari, triggers polling fallback for cross-tab sync.
   * @param value The new value to set and broadcast.
   */
  set(value: T): void {
    if (this.destroyed) return;
    this.lastValue = value;
    this.isSetting = true;
    
    const message: SyncMessage<T> = {
      value,
      ts: Date.now(),
      v: TabStateSync.SCHEMA_VERSION
    };
    
    if (this.isBroadcastChannel && this.channel) {
      this.channel.postMessage(value);
    } else {
      const serialized = JSON.stringify(message);
      const dataToStore = this.options.enableEncryption 
        ? this.encrypt(serialized) 
        : serialized;
        
      localStorage.setItem(this.key, dataToStore);
      
      // For Safari polling, update lastPolledValue immediately
      if (this.isSafari()) {
        this.lastPolledValue = dataToStore;
      }
    }
    
    this.notify(value);
    setTimeout(() => { this.isSetting = false; }, 0);
  }

  private notify(value: T) {
    this.lastValue = value;
    this.callbacks.forEach(cb => cb(value));
  }

  private onStorage = (e: StorageEvent) => {
    if (e.key !== this.key || !e.newValue) return;
    try {
      const decryptedData = this.options.enableEncryption 
        ? this.decrypt(e.newValue) 
        : e.newValue;
        
      const parsed = JSON.parse(decryptedData);
      
      if (!this.isValidSyncMessage(parsed)) {
        this.logError('Invalid data format in storage event:', parsed);
        return;
      }
      
      this.notify(parsed.value);
    } catch (err) {
      this.logError('Error handling storage event:', err);
    }
  };

  /**
   * Validates if the message has the expected format
   */
  private isValidMessage(data: unknown): data is T {
    // Add your custom validation logic for BroadcastChannel messages
    // This is a basic validation that can be enhanced
    return data !== null && data !== undefined;
  }

  /**
   * Validates if a parsed object matches the SyncMessage format
   */
  private isValidSyncMessage(data: unknown): data is SyncMessage<T> {
    if (!data || typeof data !== 'object') return false;
    
    const msg = data as Partial<SyncMessage<T>>;
    return (
      'value' in msg && 
      'ts' in msg &&
      typeof msg.ts === 'number' &&
      'v' in msg &&
      typeof msg.v === 'number'
    );
  }

  /**
   * Very simple encryption for localStorage
   * Note: This is NOT secure for highly sensitive data!
   */
  private encrypt(text: string): string {
    if (!this.options.enableEncryption) return text;
    
    // Simple XOR encryption with the key
    const key = this.options.encryptionKey;
    let result = '';
    
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    
    // Return base64 encoded string
    return btoa(result);
  }

  /**
   * Decrypt data from localStorage
   */
  private decrypt(text: string): string {
    if (!this.options.enableEncryption) return text;
    
    try {
      // Decode base64
      const decoded = atob(text);
      const key = this.options.encryptionKey;
      let result = '';
      
      // Simple XOR decryption
      for (let i = 0; i < decoded.length; i++) {
        const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        result += String.fromCharCode(charCode);
      }
      
      return result;
    } catch (err) {
      this.logError('Decryption error:', err);
      return text; // Fallback to original text on error
    }
  }

  /**
   * Log errors if debug mode is enabled
   */
  private logError(message: string, data?: unknown): void {
    if (this.options.debug) {
      console.error(`[TabStateSync] ${message}`, data);
    }
  }

  /**
   * Cleans up listeners and disables the instance.
   * Removes BroadcastChannel, storage event, or polling interval as needed.
   */
  destroy() {
    if (this.isBroadcastChannel && this.channel) {
      this.channel.close();
    } else if (this.isSafari() && this.pollingInterval) {
      // Clear polling interval for Safari
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    } else {
      window.removeEventListener('storage', this.onStorage);
    }
    this.callbacks.clear();
    this.destroyed = true;
  }
} 