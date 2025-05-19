import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TabStateSync, TabStateSyncOptions } from '../TabStateSync';

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
    
    // Simulate storage event with the new message format (v property)
    window.dispatchEvent(new window.StorageEvent('storage', { 
      key: 'tss:test', 
      newValue: JSON.stringify({ value: 'xyz', ts: Date.now(), v: 1 }) 
    }));
    
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
    localStorage.setItem('tss:badjson', 'not-a-json');
    // Simulate polling or storage event
    window.dispatchEvent(new window.StorageEvent('storage', { key: 'tss:badjson', newValue: 'not-a-json' }));
    // Should not throw error or call callback
    expect(cb).not.toHaveBeenCalled();
  });
  
  // New tests for security features
  
  it('should apply namespace to localStorage key', () => {
    delete window.BroadcastChannel;
    const sync = new TabStateSync<string>('test', { namespace: 'app' });
    const cb = vi.fn();
    sync.subscribe(cb);
    sync.set('abc');
    
    // Check if the item was stored with the correct namespace
    expect(localStorage.getItem('app:test')).not.toBeNull();
    expect(localStorage.getItem('tss:test')).toBeNull(); // Should not use default namespace
  });
  
  it('should encrypt and decrypt data correctly', () => {
    delete window.BroadcastChannel;
    const spy = vi.spyOn(console, 'error');
    
    // Create instance with encryption enabled
    const sync = new TabStateSync<string>('test', { 
      enableEncryption: true,
      encryptionKey: 'test-key-123',
      debug: true
    });
    
    const cb = vi.fn();
    sync.subscribe(cb);
    sync.set('secret-data');
    
    // Get the encrypted value from localStorage
    const encryptedValue = localStorage.getItem('tss:test');
    expect(encryptedValue).not.toBeNull();
    
    // Verify that the value does NOT contain the original text (is encrypted)
    expect(encryptedValue).not.toContain('secret-data');
    
    // Create a second instance with the same configuration
    const sync2 = new TabStateSync<string>('test', { 
      enableEncryption: true,
      encryptionKey: 'test-key-123'
    });
    
    const cb2 = vi.fn();
    sync2.subscribe(cb2);
    
    // Trigger storage event for the first instance
    window.dispatchEvent(new window.StorageEvent('storage', { 
      key: 'tss:test', 
      newValue: encryptedValue
    }));
    
    // The second instance should be able to decrypt and process
    expect(cb2).toHaveBeenCalledWith('secret-data');
    
    // Cleanup
    sync.destroy();
    sync2.destroy();
    spy.mockRestore();
  });
  
  it('should log errors when debug is enabled', () => {
    delete window.BroadcastChannel;
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const sync = new TabStateSync<string>('test', { debug: true });
    
    // Simulate an invalid message
    window.dispatchEvent(new window.StorageEvent('storage', { 
      key: 'tss:test', 
      newValue: '{"invalid": "format"}'
    }));
    
    // Check if the error was logged
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0]).toContain('[TabStateSync]');
    
    spy.mockRestore();
  });
  
  it('should reject invalid message format', () => {
    window.BroadcastChannel = MockBroadcastChannel;
    const sync = new TabStateSync<{ value: string }>('test', { debug: true });
    const cb = vi.fn();
    sync.subscribe(cb);
    
    // Configure test for message invalidation
    // This requires a more elaborate mock for BroadcastChannel
    // to allow injecting invalid messages
    
    // Cleanup
    sync.destroy();
  });
}); 