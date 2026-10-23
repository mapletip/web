declare module 'vitest/browser' {
  interface BrowserCommands {
    emulateMedia(options: {
      forcedColors?: 'active' | 'none';
      colorScheme?: 'light' | 'dark';
      reducedMotion?: 'reduce' | 'no-preference';
    }): Promise<void>;
  }
}

export {};
