import { useState, useEffect, useCallback } from 'react';

export function useLocalStorageState<T>(
  key: string,
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>, () => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored) as T;
        // Merge mit initialValue um fehlende Felder zu ergänzen
        if (typeof parsed === 'object' && parsed !== null && typeof initialValue === 'object' && initialValue !== null) {
          return { ...initialValue, ...parsed };
        }
        return parsed;
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error);
    }
    return initialValue;
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
      setState(initialValue);
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }, [key, initialValue]);

  return [state, setState, clearStorage];
}
