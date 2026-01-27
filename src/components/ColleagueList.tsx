import { useState, useMemo } from 'react';
import type { Colleague, AppMode, SortMode } from '../types';
import { ColleagueCard } from './ColleagueCard';
import { v4 as uuidv4 } from 'uuid';
import styles from './ColleagueList.module.css';

// Security constants
const MAX_NAME_LENGTH = 50;

interface ColleagueListProps {
  colleagues: Colleague[];
  activeColleagueId: string | null;
  mode: AppMode;
  pricePerWurst: number;
  pricePerBrezel: number;
  sortMode: SortMode;
  onColleaguesChange: (colleagues: Colleague[]) => void;
  onActiveChange: (id: string | null) => void;
  onSortModeChange: (mode: SortMode) => void;
  readOnly?: boolean;
  highlightId?: string;
  showJoinForm?: boolean;
  joinFormProps?: {
    inputValue: string;
    onInputChange: (value: string) => void;
    onJoin: () => void;
    isJoining: boolean;
  };
  onDecrementWurst?: (id: string) => void;
  onDecrementBrezel?: (id: string) => void;
  onReset?: (id: string) => void;
}

export function ColleagueList({
  colleagues,
  activeColleagueId,
  mode,
  pricePerWurst,
  pricePerBrezel,
  sortMode,
  onColleaguesChange,
  onActiveChange,
  onSortModeChange,
  readOnly = false,
  highlightId,
  showJoinForm = false,
  joinFormProps,
  onDecrementWurst,
  onDecrementBrezel,
  onReset,
}: ColleagueListProps) {
  const [newName, setNewName] = useState('');

  const sortedColleagues = useMemo(() => {
    const sorted = [...colleagues];
    if (sortMode === 'alphabetical') {
      sorted.sort((a, b) => a.name.localeCompare(b.name, 'de'));
    } else {
      sorted.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'de'));
    }
    return sorted;
  }, [colleagues, sortMode]);

  const handleAdd = () => {
    const trimmedName = newName.trim().slice(0, MAX_NAME_LENGTH);
    if (!trimmedName) return;

    const newColleague: Colleague = {
      id: uuidv4(),
      name: trimmedName,
      count: 0,
      brezelCount: 0,
    };

    onColleaguesChange([...colleagues, newColleague]);
    onActiveChange(newColleague.id);
    setNewName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  const handleEdit = (id: string, name: string) => {
    onColleaguesChange(
      colleagues.map((c) => (c.id === id ? { ...c, name } : c))
    );
  };

  const handleDelete = (id: string) => {
    onColleaguesChange(colleagues.filter((c) => c.id !== id));
    if (activeColleagueId === id) {
      onActiveChange(null);
    }
  };

  const handleDecrementWurst = (id: string) => {
    onColleaguesChange(
      colleagues.map((c) => {
        if (c.id === id) {
          const newCount = Math.max(0, c.count - 1);
          return { ...c, count: newCount };
        }
        return c;
      })
    );
  };

  const handleDecrementBrezel = (id: string) => {
    onColleaguesChange(
      colleagues.map((c) => {
        if (c.id === id) {
          const newBrezelCount = Math.max(0, (c.brezelCount || 0) - 1);
          return { ...c, brezelCount: newBrezelCount };
        }
        return c;
      })
    );
  };

  const handleReset = (id: string) => {
    onColleaguesChange(
      colleagues.map((c) => (c.id === id ? { ...c, count: 0, brezelCount: 0 } : c))
    );
  };

  return (
    <div className={styles.container}>
      {/* Join form for session participants */}
      {showJoinForm && joinFormProps && (
        <div className={styles.inputRow}>
          <input
            type="text"
            value={joinFormProps.inputValue}
            onChange={(e) => joinFormProps.onInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && joinFormProps.inputValue.trim()) {
                joinFormProps.onJoin();
              }
            }}
            placeholder="Dein Name"
            className={styles.input}
          />
          <button
            onClick={joinFormProps.onJoin}
            disabled={!joinFormProps.inputValue.trim() || joinFormProps.isJoining}
            className={styles.addButton}
            aria-label="Beitreten"
          >
            {joinFormProps.isJoining ? '...' : (
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* Add new colleague */}
      {!readOnly && !showJoinForm && (
        <div className={styles.inputRow}>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value.slice(0, MAX_NAME_LENGTH))}
            onKeyDown={handleKeyDown}
            placeholder="Name eingeben..."
            maxLength={MAX_NAME_LENGTH}
            autoComplete="off"
          className={styles.input}
        />
        <button
          onClick={handleAdd}
          disabled={!newName.trim()}
          className={styles.addButton}
          aria-label="Hinzufügen"
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      )}

      {/* Sort toggle */}
      {!readOnly && (
        <div className={styles.sortRow}>
          <span className={styles.personCount}>
            {colleagues.length} {colleagues.length === 1 ? 'Person' : 'Personen'}
          </span>
          <button
            onClick={() =>
              onSortModeChange(sortMode === 'alphabetical' ? 'count' : 'alphabetical')
            }
            className={styles.sortButton}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
            <span>{sortMode === 'alphabetical' ? 'A-Z' : 'Anzahl'}</span>
          </button>
        </div>
      )}

      {/* Colleague list */}
      <div className={styles.list}>
        {sortedColleagues.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyIcon}>🥨</p>
            <p className={styles.emptyTitle}>Noch keine Kollegen</p>
            <p className={styles.emptyText}>Füge jemanden hinzu und klick die Wurst!</p>
          </div>
        ) : (
          sortedColleagues.map((colleague) => (
            <ColleagueCard
              key={colleague.id}
              colleague={colleague}
              isActive={colleague.id === activeColleagueId}
              mode={mode}
              pricePerWurst={pricePerWurst}
              pricePerBrezel={pricePerBrezel}
              onSelect={() => onActiveChange(colleague.id)}
              onEdit={(name) => handleEdit(colleague.id, name)}
              onDelete={() => handleDelete(colleague.id)}
              onDecrementWurst={() => onDecrementWurst ? onDecrementWurst(colleague.id) : handleDecrementWurst(colleague.id)}
              onDecrementBrezel={() => onDecrementBrezel ? onDecrementBrezel(colleague.id) : handleDecrementBrezel(colleague.id)}
              onReset={() => onReset ? onReset(colleague.id) : handleReset(colleague.id)}
              readOnly={readOnly}
              highlighted={colleague.id === highlightId}
            />
          ))
        )}
      </div>
    </div>
  );
}
