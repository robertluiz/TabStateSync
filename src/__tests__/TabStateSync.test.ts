import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TabStateSync } from '../TabStateSync';

import { JSDOM } from 'jsdom';

declare global {
  interface Window {
    BroadcastChannel?: any;
  }
}

let dom: JSDOM;

// Shared mock BroadcastChannel for all instances
class MockBroadcastChannel {
  static channels: Record<string, MockBroadcastChannel[]> = {};
  onmessage: ((event: { data: any }) => void) | null = null;
  key: string;
  constructor(key: string) {
    this.key = key;
    if (!MockBroadcastChannel.channels[key]) {
      MockBroadcastChannel.channels[key] = [];
    }
    MockBroadcastChannel.channels[key].push(this);
  }
  postMessage(data: any) {
    // Simulate async propagation to all other instances with the same key
    setTimeout(() => {
      MockBroadcastChannel.channels[this.key].forEach((ch) => {
        if (ch !== this && ch.onmessage) {
          ch.onmessage({ data });
        }
      });
    }, 0);
  }
  close() {
    const arr = MockBroadcastChannel.channels[this.key];
    if (arr) {
      const idx = arr.indexOf(this);
      if (idx !== -1) arr.splice(idx, 1);
    }
  }
}

describe('TabStateSync', () => {
  beforeEach(() => {
    dom = new JSDOM('', { url: 'http://localhost' });
    (global as any).window = dom.window;
    (global as any).localStorage = dom.window.localStorage;
    vi.resetAllMocks();
    window.localStorage.clear();
  });

  afterEach(() => {
    dom.window.close();
  });

  it('should call subscribe callback on set (BroadcastChannel)', async () => {
    window.BroadcastChannel = MockBroadcastChannel;
    const sync = new TabStateSync<string>('test');
    const cb = vi.fn();
    sync.subscribe(cb);
    sync.set('abc');
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(cb).toHaveBeenCalledWith('abc');
  });

  it('should fallback to localStorage if BroadcastChannel not available', () => {
    delete window.BroadcastChannel;
    const sync = new TabStateSync<string>('test');
    const cb = vi.fn();
    sync.subscribe(cb);
    window.dispatchEvent(new window.StorageEvent('storage', { key: 'test', newValue: JSON.stringify({ value: 'xyz', ts: Date.now() }) }));
    expect(cb).toHaveBeenCalledWith('xyz');
  });

  it('should not call callback for own set (BroadcastChannel)', async () => {
    window.BroadcastChannel = MockBroadcastChannel;
    const sync = new TabStateSync<string>('test');
    const cb = vi.fn();
    sync.subscribe(cb);
    sync.set('abc');
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('should not call unsubscribed callback', async () => {
    window.BroadcastChannel = MockBroadcastChannel;
    const sync = new TabStateSync<string>('test');
    const cb = vi.fn();
    sync.subscribe(cb);
    sync.unsubscribe(cb);
    sync.set('abc');
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(cb).not.toHaveBeenCalled();
  });

  it('should call all subscribed callbacks', async () => {
    window.BroadcastChannel = MockBroadcastChannel;
    const sync = new TabStateSync<string>('test');
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    sync.subscribe(cb1);
    sync.subscribe(cb2);
    sync.set('abc');
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(cb1).toHaveBeenCalledWith('abc');
    expect(cb2).toHaveBeenCalledWith('abc');
  });

  it('should not call callbacks after destroy', async () => {
    window.BroadcastChannel = MockBroadcastChannel;
    const sync = new TabStateSync<string>('test');
    const cb = vi.fn();
    sync.subscribe(cb);
    sync.destroy();
    sync.set('abc');
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(cb).not.toHaveBeenCalled();
  });

  it('should isolate events between different keys', async () => {
    window.BroadcastChannel = MockBroadcastChannel;
    const sync1 = new TabStateSync<string>('key1');
    const sync2 = new TabStateSync<string>('key2');
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    sync1.subscribe(cb1);
    sync2.subscribe(cb2);
    sync1.set('a');
    sync2.set('b');
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(cb1).toHaveBeenCalledWith('a');
    expect(cb2).toHaveBeenCalledWith('b');
    expect(cb1).not.toHaveBeenCalledWith('b');
    expect(cb2).not.toHaveBeenCalledWith('a');
  });

  it('should sync undefined, null, object, and array values', async () => {
    window.BroadcastChannel = MockBroadcastChannel;
    const sync = new TabStateSync<any>('edge');
    const cb = vi.fn();
    sync.subscribe(cb);
    sync.set(undefined);
    sync.set(null);
    sync.set({ foo: 'bar' });
    sync.set([1, 2, 3]);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(cb).toHaveBeenCalledWith(undefined);
    expect(cb).toHaveBeenCalledWith(null);
    expect(cb).toHaveBeenCalledWith({ foo: 'bar' });
    expect(cb).toHaveBeenCalledWith([1, 2, 3]);
  });

  it('should not break on invalid JSON in localStorage', () => {
    delete window.BroadcastChannel;
    const sync = new TabStateSync<string>('badjson');
    const cb = vi.fn();
    sync.subscribe(cb);
    localStorage.setItem('badjson', 'not-a-json');
    // Simula polling ou evento storage
    window.dispatchEvent(new window.StorageEvent('storage', { key: 'badjson', newValue: 'not-a-json' }));
    // Não deve lançar erro nem chamar callback
    expect(cb).not.toHaveBeenCalled();
  });
}); 