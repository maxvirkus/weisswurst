/**
 * Scene Error Boundary
 * 
 * Fängt Fehler in der 3D-Szene ab und zeigt ein Fallback-UI.
 * Verhindert, dass Fehler in Three.js/WebGL die gesamte App crashen.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class SceneErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('3D Scene Error:', error);
    console.error('Error Info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback or default
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          minHeight: '300px',
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          color: '#495057',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍺</div>
          <h3 style={{ margin: '0 0 0.5rem', color: '#212529' }}>
            Hoppla! Da ist was schiefgelaufen.
          </h3>
          <p style={{ margin: '0 0 1rem', fontSize: '0.9rem' }}>
            Die 3D-Szene konnte nicht geladen werden.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.9rem',
              backgroundColor: '#0066cc',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Seite neu laden
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SceneErrorBoundary;
