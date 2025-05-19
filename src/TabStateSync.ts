type Callback<T> = (value: T) => void;

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

  private isSafari(): boolean {
    // Basic Safari detection (desktop and iOS)
    return (
      typeof navigator !== 'undefined' &&
      /safari/i.test(navigator.userAgent) &&
      !/chrome|android/i.test(navigator.userAgent)
    );
  }

  constructor(key: string) {
    this.key = key;
    this.isBroadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window;
    if (this.isBroadcastChannel) {
      this.channel = new BroadcastChannel(key);
      this.channel.onmessage = (event) => {
        if (this.isSetting) return;
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
            const { value } = JSON.parse(raw);
            this.notify(value);
          } catch {}
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
    if (this.isBroadcastChannel && this.channel) {
      this.channel.postMessage(value);
    } else {
      localStorage.setItem(this.key, JSON.stringify({ value, ts: Date.now() }));
      // For Safari polling, update lastPolledValue immediately
      if (this.isSafari()) {
        this.lastPolledValue = localStorage.getItem(this.key);
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
      const { value } = JSON.parse(e.newValue);
      localStorage.removeItem(this.key);
      this.notify(value);
    } catch {}
  };

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