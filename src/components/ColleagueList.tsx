import { useState, useMemo } from 'react';
import type { Colleague, AppMode, SortMode } from '../types';
import { ColleagueCard } from './ColleagueCard';
import { v4 as uuidv4 } from 'uuid';
import styles from './ColleagueList.module.css';

interface ColleagueListProps {
  colleagues: Colleague[];
  activeColleagueId: string | null;
  mode: AppMode;
  pricePerWurst: number;
  sortMode: SortMode;
  onColleaguesChange: (colleagues: Colleague[]) => void;
  onActiveChange: (id: string | null) => void;
  onSortModeChange: (mode: SortMode) => void;
}

export function ColleagueList({
  colleagues,
  activeColleagueId,
  mode,
  pricePerWurst,
  sortMode,
  onColleaguesChange,
  onActiveChange,
  onSortModeChange,
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
    const trimmedName = newName.trim();
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

  const handleDecrement = (id: string) => {
    onColleaguesChange(
      colleagues.map((c) =>
        c.id === id ? { ...c, count: Math.max(0, c.count - 1) } : c
      )
    );
  };

  const handleReset = (id: string) => {
    onColleaguesChange(
      colleagues.map((c) => (c.id === id ? { ...c, count: 0 } : c))
    );
  };

  return (
    <div className={styles.container}>
      {/* Add new colleague */}
      <div className={styles.inputRow}>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Name eingeben..."
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

      {/* Sort toggle */}
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
              onSelect={() => onActiveChange(colleague.id)}
              onEdit={(name) => handleEdit(colleague.id, name)}
              onDelete={() => handleDelete(colleague.id)}
              onDecrement={() => handleDecrement(colleague.id)}
              onReset={() => handleReset(colleague.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
