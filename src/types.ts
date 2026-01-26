export interface Colleague {
  id: string;
  name: string;
  count: number;
  brezelCount: number;
}

export type AppMode = 'invite' | 'split';

export type SortMode = 'alphabetical' | 'count';

export interface AppState {
  colleagues: Colleague[];
  activeColleagueId: string | null;
  mode: AppMode;
  pricePerWurst: number;
  pricePerBrezel: number;
  sortMode: SortMode;
  schemaVersion: number;
}

export interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

export const DEFAULT_PRICE = 2.0;
export const DEFAULT_BREZEL_PRICE = 1.0;

export const STORAGE_KEY = 'weisswurst-einstand';

/**
 * Schema version for localStorage migrations.
 * Increment when making breaking changes to AppState.
 */
export const SCHEMA_VERSION = 1;
