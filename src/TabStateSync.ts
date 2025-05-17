type Callback<T> = (value: T) => void;

export class TabStateSync<T = any> {
  private key: string;
  private channel: BroadcastChannel | null = null;
  private callbacks: Set<Callback<T>> = new Set();
  private lastValue: T | undefined;
  private isBroadcastChannel: boolean;
  private isSetting: boolean = false;
  private destroyed = false;

  constructor(key: string) {
    this.key = key;
    this.isBroadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window;
    if (this.isBroadcastChannel) {
      this.channel = new BroadcastChannel(key);
      this.channel.onmessage = (event) => {
        if (this.isSetting) return;
        this.notify(event.data);
      };
    } else {
      window.addEventListener('storage', this.onStorage);
    }
  }

  subscribe(callback: Callback<T>): void {
    this.callbacks.add(callback);
  }

  unsubscribe(callback: Callback<T>): void {
    this.callbacks.delete(callback);
  }

  set(value: T): void {
    if (this.destroyed) return;
    this.lastValue = value;
    this.isSetting = true;
    if (this.isBroadcastChannel && this.channel) {
      this.channel.postMessage(value);
    } else {
      localStorage.setItem(this.key, JSON.stringify({ value, ts: Date.now() }));
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
      if (this.isSetting) return;
      this.notify(value);
    } catch {}
  };

  destroy() {
    if (this.isBroadcastChannel && this.channel) {
      this.channel.close();
    } else {
      window.removeEventListener('storage', this.onStorage);
    }
    this.callbacks.clear();
    this.destroyed = true;
  }
} 