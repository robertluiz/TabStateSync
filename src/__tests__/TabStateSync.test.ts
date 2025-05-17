import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TabStateSync } from '../TabStateSync';

import { JSDOM } from 'jsdom';

declare global {
  interface Window {
    BroadcastChannel?: any;
  }
}

let dom: JSDOM;

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
    window.BroadcastChannel = class {
      onmessage: any;
      postMessage = (v: any) => {
        setTimeout(() => this.onmessage({ data: v }), 0);
      };
      close = vi.fn();
      constructor(public key: string) {}
    };
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
    window.BroadcastChannel = class {
      onmessage: any;
      postMessage = (v: any) => {
        setTimeout(() => this.onmessage({ data: v }), 0);
      };
      close = vi.fn();
      constructor(public key: string) {}
    };
    const sync = new TabStateSync<string>('test');
    const cb = vi.fn();
    sync.subscribe(cb);
    sync.set('abc');
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('should not call unsubscribed callback', async () => {
    window.BroadcastChannel = class {
      onmessage: any;
      postMessage = (v: any) => {
        setTimeout(() => this.onmessage({ data: v }), 0);
      };
      close = vi.fn();
      constructor(public key: string) {}
    };
    const sync = new TabStateSync<string>('test');
    const cb = vi.fn();
    sync.subscribe(cb);
    sync.unsubscribe(cb);
    sync.set('abc');
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(cb).not.toHaveBeenCalled();
  });

  it('should call all subscribed callbacks', async () => {
    window.BroadcastChannel = class {
      onmessage: any;
      postMessage = (v: any) => {
        setTimeout(() => this.onmessage({ data: v }), 0);
      };
      close = vi.fn();
      constructor(public key: string) {}
    };
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
    window.BroadcastChannel = class {
      onmessage: any;
      postMessage = (v: any) => {
        setTimeout(() => this.onmessage({ data: v }), 0);
      };
      close = vi.fn();
      constructor(public key: string) {}
    };
    const sync = new TabStateSync<string>('test');
    const cb = vi.fn();
    sync.subscribe(cb);
    sync.destroy();
    sync.set('abc');
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(cb).not.toHaveBeenCalled();
  });
}); 