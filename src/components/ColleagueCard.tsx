import { useState } from 'react';
import type { Colleague, AppMode } from '../types';
import { formatEuro } from '../utils/format';
import styles from './ColleagueCard.module.css';

interface ColleagueCardProps {
  colleague: Colleague;
  isActive: boolean;
  mode: AppMode;
  pricePerWurst: number;
  pricePerBrezel: number;
  onSelect: () => void;
  onEdit: (name: string) => void;
  onDelete: () => void;
  onDecrementWurst: () => void;
  onDecrementBrezel: () => void;
  onReset: () => void;
}

export function ColleagueCard({
  colleague,
  isActive,
  mode,
  pricePerWurst,
  pricePerBrezel,
  onSelect,
  onEdit,
  onDelete,
  onDecrementWurst,
  onDecrementBrezel,
  onReset,
}: ColleagueCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(colleague.name);

  const handleSave = () => {
    if (editName.trim()) {
      onEdit(editName.trim());
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditName(colleague.name);
      setIsEditing(false);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`"${colleague.name}" wirklich löschen?`)) {
      onDelete();
    }
  };

  const totalPrice = (colleague.count * pricePerWurst) + ((colleague.brezelCount || 0) * pricePerBrezel);

  return (
    <div
      className={`${styles.card} ${isActive ? styles.cardActive : ''}`}
      onClick={(e) => {
        // Nur wenn nicht auf Button oder Input geklickt wurde
        const target = e.target as HTMLElement;
        if (!target.closest('button') && !target.closest('input') && !isEditing) {
          onSelect();
        }
      }}
    >
      <div className={styles.content}>
        <div className={styles.info}>
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              className={styles.nameInput}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <h3 
              className={styles.name}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
                setEditName(colleague.name);
              }}
              title="Doppelklick zum Bearbeiten"
            >
              {colleague.name}
            </h3>
          )}

          <div className={styles.stats}>
            <span className={styles.count}>{colleague.count}</span>
            <span className={styles.label}>
              {colleague.count === 1 ? 'Wurst' : 'Würste'}
            </span>
            <span className={styles.separator}>•</span>
            <span className={styles.count}>{colleague.brezelCount || 0}</span>
            <span className={styles.label}>
              {(colleague.brezelCount || 0) === 1 ? 'Brezel' : 'Brezeln'}
            </span>
            {mode === 'split' && colleague.count > 0 && (
              <span className={styles.price}>({formatEuro(totalPrice)})</span>
            )}
          </div>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            onClick={(e) => handleDelete(e)}
            className={`${styles.iconButton} ${styles.iconButtonDanger}`}
            title="Löschen"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          {isActive && (colleague.count > 0 || (colleague.brezelCount || 0) > 0) && (
            <div className={styles.actionRow}>
              {colleague.count > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDecrementWurst();
                  }}
                  className={`${styles.smallButton} ${styles.decrementButton}`}
                  title="Wurst entfernen"
                >
                  - 🌭
                </button>
              )}
              {(colleague.brezelCount || 0) > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDecrementBrezel();
                  }}
                  className={`${styles.smallButton} ${styles.decrementButton}`}
                  title="Brezel entfernen"
                >
                  - 🥨
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onReset();
                }}
                className={`${styles.smallButton} ${styles.resetButton}`}
                title="Auf 0 setzen"
              >
                ↺
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
