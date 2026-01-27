/**
 * Landing Page
 * 
 * Entry point for the app:
 * - Create new shared Einstand session
 * - Link to offline mode
 */

import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { SessionMode } from '../lib/database.types';
import type { Toast } from '../types';
import { PriceInput } from '../components/PriceInput';
import { ToastContainer } from '../components/ToastContainer';
import styles from '../App.module.css';
import landingStyles from './LandingPage.module.css';

interface CreateSessionResult {
  sessionId: string;
  adminSecret: string;
  participantLink: string;
  adminLink: string;
}

// Security constants
const MAX_TITLE_LENGTH = 100;

export function LandingPage() {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateSessionResult | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Form state
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState<SessionMode>('INVITE');
  const [priceWurst, setPriceWurst] = useState(2.00);
  const [pricePretzel, setPricePretzel] = useState(1.00);

  const createSession = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setError('Supabase nicht konfiguriert. Nutze den Offline-Modus.');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // Generate admin secret client-side for immediate use
      const adminSecret = crypto.randomUUID().replace(/-/g, '');
      
      const { data, error: insertError } = await supabase
        .from('einstand_sessions')
        .insert({
          title: title.trim().slice(0, MAX_TITLE_LENGTH) || null,
          mode,
          price_wurst: mode === 'SPLIT' ? priceWurst : null,
          price_pretzel: mode === 'SPLIT' ? pricePretzel : null,
          admin_secret: adminSecret,
        })
        .select('id')
        .single();

      if (insertError) throw insertError;
      if (!data) throw new Error('Keine Session-ID erhalten');

      const baseUrl = window.location.origin;
      const participantLink = `${baseUrl}/s/${data.id}`;
      const adminLink = `${baseUrl}/a/${data.id}?key=${adminSecret}`;

      setResult({
        sessionId: data.id,
        adminSecret,
        participantLink,
        adminLink,
      });
    } catch (err) {
      console.error('Error creating session:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Erstellen');
    } finally {
      setIsCreating(false);
    }
  }, [title, mode, priceWurst, pricePretzel]);

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('In Zwischenablage kopiert', 'success');
    } catch {
      showToast('Kopieren fehlgeschlagen', 'error');
    }
  }, [showToast]);

  const shareViaEmail = useCallback(() => {
    if (!result) return;
    
    const subject = encodeURIComponent(
      title ? `Weißwurst Einstand: ${title}` : 'Weißwurst Einstand'
    );
    const body = encodeURIComponent(
      `Servus!\n\nHier ist der Link zum Einstand:\n${result.participantLink}\n\nProst! 🍺🥨`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  }, [result, title]);

  // Show success screen with links
  if (result) {
    return (
      <div className={landingStyles.pageContainer}>
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <div className={styles.headerContent}>
              <Link to="/" className={styles.logo}>
                <span>🥨</span>
              </Link>
              <div className={styles.titleCenter}>
                <h1 className={styles.title}>Weißwurst Einstand</h1>
              </div>
            </div>
          </div>
        </header>

        <main className={landingStyles.mainCentered}>
          <div className={landingStyles.card}>
            <div className={landingStyles.logo}>🥨</div>
            <h2 className={landingStyles.title}>Einstand erstellt!</h2>
            
            <div className={landingStyles.linkSection}>
              <h3 className={landingStyles.linkTitle}>Teilnehmer-Link</h3>
              <p className={landingStyles.linkDescription}>Teile diesen Link mit deinen Kolleg:innen:</p>
              <div className={landingStyles.linkBox}>
                <input 
                  type="text" 
                  readOnly 
                  value={result.participantLink} 
                  className={landingStyles.linkInput}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button 
                  onClick={() => copyToClipboard(result.participantLink)}
                  className={landingStyles.copyButton}
                  title="Kopieren"
                >
                  📋
                </button>
              </div>
            </div>

            <div className={landingStyles.linkSection}>
              <h3 className={landingStyles.linkTitle}>Admin-Link</h3>
              <p className={landingStyles.linkDescription}>
                <strong>Nur für dich!</strong> Damit kannst du den Einstand verwalten.
              </p>
              <div className={landingStyles.linkBox}>
                <input 
                  type="text" 
                  readOnly 
                  value={result.adminLink} 
                  className={landingStyles.linkInput}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button 
                  onClick={() => copyToClipboard(result.adminLink)}
                  className={landingStyles.copyButton}
                  title="Kopieren"
                >
                  📋
                </button>
              </div>
            </div>

            <div className={landingStyles.actions}>
              <button onClick={shareViaEmail} className={landingStyles.shareButton}>
                Per E-Mail teilen
              </button>
              <button 
                onClick={() => navigate(`/s/${result.sessionId}`)}
                className={landingStyles.primaryButton}
              >
                Zum Einstand
              </button>
            </div>
          </div>
        </main>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  // Create form
  return (
    <div className={landingStyles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerContent}>
            <Link to="/" className={styles.logo}>
              <span>🥨</span>
            </Link>
            <div className={styles.titleCenter}>
              <h1 className={styles.title}>Weißwurst Einstand</h1>
            </div>
          </div>
        </div>
      </header>

      <main className={landingStyles.mainCentered}>
        <div className={landingStyles.card}>
          <div className={landingStyles.logo}>🥨</div>
          <p className={landingStyles.subtitle}>
            Erstelle einen geteilten Einstand für dein Team
          </p>

          {error && (
            <div className={landingStyles.error}>
              {error}
            </div>
          )}

          <div className={landingStyles.form}>
            <div className={landingStyles.field}>
              <label htmlFor="title" className={landingStyles.label}>
                Titel
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE_LENGTH))}
                placeholder="Mein Einstand"
                className={landingStyles.input}
                maxLength={MAX_TITLE_LENGTH}
                autoComplete="off"
                required
              />
            </div>

            <div className={landingStyles.field}>
              <label className={landingStyles.label}>Kosten</label>
              <div className={landingStyles.modeToggle}>
                <button
                  type="button"
                  onClick={() => setMode('INVITE')}
                  className={`${landingStyles.modeButton} ${mode === 'INVITE' ? landingStyles.modeActive : ''}`}
                >
                  Ich lade ein
                </button>
                <button
                  type="button"
                  onClick={() => setMode('SPLIT')}
                  className={`${landingStyles.modeButton} ${mode === 'SPLIT' ? landingStyles.modeActive : ''}`}
                >
                  Wir teilen die Kosten
                </button>
              </div>
              <p className={landingStyles.modeHint}>
                {mode === 'INVITE' 
                  ? 'Du lädst ein – keine Preise nötig'
                  : 'Kosten werden aufgeteilt – Preise angeben'}
              </p>
            </div>

            {mode === 'SPLIT' && (
              <div className={landingStyles.priceFields}>
                <PriceInput 
                  price={priceWurst}
                  onChange={setPriceWurst}
                  label="Preis pro Wurst"
                />
                <PriceInput 
                  price={pricePretzel}
                  onChange={setPricePretzel}
                  label="Preis pro Brezel"
                />
              </div>
            )}

            <button
              onClick={createSession}
              disabled={isCreating || !isSupabaseConfigured || !title.trim()}
              className={landingStyles.primaryButton}
            >
              {isCreating ? 'Wird erstellt...' : 'Einstand erstellen'}
            </button>
          </div>

          {!isSupabaseConfigured && (
            <p className={landingStyles.warning}>
              Supabase nicht konfiguriert. Online-Modus nicht verfügbar.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
