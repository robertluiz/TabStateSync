import { createTabStateSync, TabStateSyncOptions } from '../src';

// Secure configuration example
const securityOptions: TabStateSyncOptions = {
  namespace: 'myapp', // Prevents key collisions
  enableEncryption: true, // Enables basic encryption
  encryptionKey: 'my-secret-key-12345', // Custom key (should be stronger in production)
  debug: true // Enables error logging during development
};

// Creates an instance with security options
const userPrefs = createTabStateSync('user-preferences', securityOptions);

// Define types for user preferences
interface UserPreferences {
  theme: 'light' | 'dark';
  fontSize: number;
  notifications: boolean;
}

// Default value
const defaultPrefs: UserPreferences = {
  theme: 'light',
  fontSize: 16,
  notifications: true
};

// Initialize with default value (if no current value exists)
let currentPrefs: UserPreferences | undefined;

// Listen for changes from other tabs
userPrefs.subscribe((newPrefs: UserPreferences) => {
  if (!newPrefs) return;
  
  // Always sanitize and validate received data
  if (validatePreferences(newPrefs)) {
    currentPrefs = newPrefs;
    applyPreferences(currentPrefs);
    console.log('Preferences updated from another tab:', currentPrefs);
  }
});

// Data validation
function validatePreferences(prefs: any): prefs is UserPreferences {
  // Basic validation to ensure the object has the expected structure
  return (
    prefs && 
    typeof prefs === 'object' &&
    (prefs.theme === 'light' || prefs.theme === 'dark') &&
    typeof prefs.fontSize === 'number' &&
    typeof prefs.notifications === 'boolean'
  );
}

// Apply preferences to the interface
function applyPreferences(prefs: UserPreferences) {
  document.body.setAttribute('data-theme', prefs.theme);
  document.body.style.fontSize = `${prefs.fontSize}px`;
  // ... other actions ...
}

// Function to update preferences
function updatePreferences(prefs: Partial<UserPreferences>) {
  currentPrefs = {
    ...currentPrefs || defaultPrefs,
    ...prefs
  };
  
  userPrefs.set(currentPrefs);
  applyPreferences(currentPrefs);
}

// When synchronization is no longer needed
function cleanup() {
  userPrefs.destroy();
}

// Export functions for global use in examples
(window as any).updatePreferences = updatePreferences;
(window as any).cleanup = cleanup; 