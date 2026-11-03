import type { UserConfig } from 'vite';

export interface LibOptions {
  entry?: string[];
  formats?: ('es' | 'cjs')[];
  cssFileName?: string;
}

export function lib(options?: LibOptions): UserConfig;
