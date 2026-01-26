import type { Toast } from '../types';
import styles from './ToastContainer.module.css';

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  const getToastClass = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return styles.toastSuccess;
      case 'error':
        return styles.toastError;
      case 'warning':
        return styles.toastWarning;
      default:
        return styles.toastInfo;
    }
  };

  const getIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      default:
        return 'ℹ';
    }
  };

  return (
    <div className={styles.container}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${styles.toast} ${getToastClass(toast.type)}`}
          onClick={() => onDismiss(toast.id)}
        >
          <span className={styles.message}>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
