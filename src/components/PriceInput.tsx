import { useState, useEffect } from 'react';
import styles from './PriceInput.module.css';

interface PriceInputProps {
  price: number;
  onChange: (price: number) => void;
  label?: string;
}

export function PriceInput({ price, onChange, label = 'Preis/Wurst' }: PriceInputProps) {
  const [inputValue, setInputValue] = useState((price || 0).toFixed(2).replace('.', ','));

  useEffect(() => {
    setInputValue((price || 0).toFixed(2).replace('.', ','));
  }, [price]);

  const handleBlur = () => {
    const normalized = inputValue.replace(',', '.');
    const parsed = parseFloat(normalized);
    if (!isNaN(parsed) && parsed >= 0) {
      onChange(Math.round(parsed * 100) / 100);
    } else {
      setInputValue(price.toFixed(2).replace('.', ','));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div className={styles.container}>
      <label className={styles.label}>{label}:</label>
      <div className={styles.inputWrapper}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={styles.input}
        />
        <span className={styles.suffix}>€</span>
      </div>
    </div>
  );
}
