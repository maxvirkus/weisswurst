import { useState, useEffect, useCallback } from 'react';
import { SCHEMA_VERSION, type AppState, type Colleague } from '../types';

/**
 * Migrates old data to the current schema version.
 * Add migration steps here when incrementing SCHEMA_VERSION.
 */
function migrateData<T extends AppState>(data: Partial<T>, currentVersion: number): T {
  let migrated = { ...data } as T;
  const storedVersion = data.schemaVersion ?? 0;
  
  // No migration needed if already at current version
  if (storedVersion >= currentVersion) {
    return migrated;
  }
  
  // Migration from v0 (no version) to v1
  if (storedVersion < 1) {
    // Ensure brezelCount exists on all colleagues
    if (migrated.colleagues) {
      migrated.colleagues = migrated.colleagues.map((c: Partial<Colleague>) => ({
        ...c,
        brezelCount: c.brezelCount ?? 0,
      })) as Colleague[];
    }
    
    // Ensure pricePerBrezel exists
    migrated.pricePerBrezel = migrated.pricePerBrezel ?? 1.0;
    
    // Ensure sortMode exists
    migrated.sortMode = migrated.sortMode ?? 'alphabetical';
  }
  
  // Add future migrations here:
  // if (storedVersion < 2) { ... }
  
  // Update schema version
  migrated.schemaVersion = currentVersion;
  
  return migrated;
}

export function useLocalStorageState<T extends AppState>(
  key: string,
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>, () => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<T>;
        
        // Run migrations
        const migrated = migrateData(parsed, SCHEMA_VERSION);
        
        // Merge with initialValue to fill in any missing fields
        return { ...initialValue, ...migrated };
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error);
    }
    return { ...initialValue, schemaVersion: SCHEMA_VERSION };
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }, [key, state]);

  const clearStorage = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setState({ ...initialValue, schemaVersion: SCHEMA_VERSION });
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }, [key, initialValue]);

  return [state, setState, clearStorage];
}
