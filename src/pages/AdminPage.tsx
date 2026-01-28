/**
 * Admin Page
 * 
 * Admin view for managing an Einstand session.
 * - Requires admin_secret in URL query param
 * - Close/Reopen session
 * - Delete session
 * - View all entries with costs
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import type { Toast } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Session, Entry } from '../lib/database.types';
import { ToastContainer } from '../components/ToastContainer';
import styles from './AdminPage.module.css';

export function AdminPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const adminSecret = searchParams.get('key');

  // Data state
  const [session, setSession] = useState<Session | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action state
  const [isClosing, setIsClosing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // UI state
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = uuidv4();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Validate admin secret and fetch data
  useEffect(() => {
    if (!sessionId || !isSupabaseConfigured) {
      setLoading(false);
      if (!isSupabaseConfigured) {
        setError('Supabase nicht konfiguriert');
      }
      return;
    }

    if (!adminSecret) {
      setError('Kein Admin-Schlüssel angegeben');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch session with admin_secret validation
        const { data: sessionData, error: sessionError } = await supabase
          .from('einstand_sessions')
          .select('*')
          .eq('id', sessionId)
          .eq('admin_secret', adminSecret)
          .is('deleted_at', null)
          .single();

        if (sessionError) {
          if (sessionError.code === 'PGRST116') {
            setError('Session nicht gefunden oder ungültiger Admin-Schlüssel');
          } else {
            throw sessionError;
          }
          return;
        }

        setSession(sessionData);

        // Fetch entries
        const { data: entriesData, error: entriesError } = await supabase
          .from('einstand_entries')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true });

        if (entriesError) throw entriesError;
        setEntries(entriesData || []);
      } catch (err) {
        console.error('Error fetching session:', err);
        setError('Fehler beim Laden der Session');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sessionId, adminSecret]);

  // Realtime subscriptions
  useEffect(() => {
    if (!sessionId || !isSupabaseConfigured || !session) return;

    const entriesChannel = supabase
      .channel(`admin-entries:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'einstand_entries',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newEntry = payload.new as Entry;
            setEntries((prev) => [...prev, newEntry]);
            showToast(`${newEntry.display_name} ist beigetreten`, 'info');
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Entry;
            setEntries((prev) =>
              prev.map((e) => (e.id === updated.id ? updated : e))
            );
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old as Entry;
            setEntries((prev) => prev.filter((e) => e.id !== deleted.id));
          }
        }
      )
      .subscribe();

    return () => {
      entriesChannel.unsubscribe();
    };
  }, [sessionId, session, showToast]);

  // Close session
  const handleClose = useCallback(async () => {
    if (!sessionId || !adminSecret) return;

    setIsClosing(true);
    try {
      const { error } = await supabase.rpc('close_session', {
        p_session_id: sessionId,
        p_admin_secret: adminSecret,
      });

      if (error) throw error;

      setSession((prev) => (prev ? { ...prev, status: 'CLOSED' } : null));
      showToast('Einstand geschlossen', 'success');
    } catch (err) {
      console.error('Error closing session:', err);
      showToast('Fehler beim Schließen', 'error');
    } finally {
      setIsClosing(false);
    }
  }, [sessionId, adminSecret, showToast]);

  // Reopen session
  const handleReopen = useCallback(async () => {
    if (!sessionId || !adminSecret) return;

    setIsClosing(true);
    try {
      const { error } = await supabase.rpc('reopen_session', {
        p_session_id: sessionId,
        p_admin_secret: adminSecret,
      });

      if (error) throw error;

      setSession((prev) => (prev ? { ...prev, status: 'OPEN' } : null));
      showToast('Einstand wieder geöffnet', 'success');
    } catch (err) {
      console.error('Error reopening session:', err);
      showToast('Fehler beim Öffnen', 'error');
    } finally {
      setIsClosing(false);
    }
  }, [sessionId, adminSecret, showToast]);

  // Delete session
  const handleDelete = useCallback(async () => {
    if (!sessionId || !adminSecret) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase.rpc('delete_session', {
        p_session_id: sessionId,
        p_admin_secret: adminSecret,
      });

      if (error) throw error;

      showToast('Einstand gelöscht', 'success');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      console.error('Error deleting session:', err);
      showToast('Fehler beim Löschen', 'error');
      setIsDeleting(false);
    }
  }, [sessionId, adminSecret, showToast, navigate]);

  // Totals
  const totals = useMemo(() => {
    const totalWurst = entries.reduce((sum, e) => sum + e.wurst_count, 0);
    const totalPretzel = entries.reduce((sum, e) => sum + e.pretzel_count, 0);
    const totalCost =
      session?.mode === 'SPLIT'
        ? totalWurst * (session.price_wurst || 0) +
          totalPretzel * (session.price_pretzel || 0)
        : 0;
    return { totalWurst, totalPretzel, totalCost };
  }, [entries, session]);

  // Links
  const participantLink = session
    ? `${window.location.origin}/s/${session.id}`
    : '';
  const adminLink = session
    ? `${window.location.origin}/a/${session.id}?key=${adminSecret}`
    : '';

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Link kopiert!', 'success');
    } catch {
      showToast('Kopieren fehlgeschlagen', 'error');
    }
  }, [showToast]);

  // Loading state
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Lade Admin-Bereich...</p>
      </div>
    );
  }

  // Error state
  if (error || !session) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorCard}>
          <h1>{error || 'Zugriff verweigert'}</h1>
          <p className={styles.errorHint}>
            Stelle sicher, dass du den korrekten Admin-Link verwendest.
          </p>
          <Link to="/" className={styles.backLink}>
            ← Zurück zur Startseite
          </Link>
        </div>
      </div>
    );
  }

  const isClosed = session.status === 'CLOSED';

  return (
    <div className={styles.container}>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerContent}>
            <Link to="/" className={styles.logo}>
              <span>🥨</span>
            </Link>
            <div className={styles.titleCenter}>
              <h1 className={styles.title}>Admin</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.adminGrid}>
          {/* Session Info Card */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              {session.title || 'Weißwurst Einstand'}
            </h2>
            <div className={styles.statusRow}>
              <span className={`${styles.statusBadge} ${isClosed ? styles.statusClosed : styles.statusOpen}`}>
                {isClosed ? 'Geschlossen' : 'Offen'}
              </span>
              <span className={styles.modeBadge}>
                {session.mode === 'INVITE' ? 'Einladung' : 'Splitten'}
              </span>
            </div>

            {session.mode === 'SPLIT' && (
              <div className={styles.priceInfo}>
                <span>Wurst: {session.price_wurst?.toFixed(2)} €</span>
                <span>Brezel: {session.price_pretzel?.toFixed(2)} €</span>
              </div>
            )}

            <div className={styles.linkSection}>
              <label className={styles.linkLabel}>Teilnehmer-Link:</label>
              <div className={styles.linkRow}>
                <code className={styles.linkCode}>{participantLink}</code>
                <button
                  onClick={() => copyToClipboard(participantLink)}
                  className={styles.copyButton}
                  aria-label="Kopieren"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className={styles.linkSection}>
              <label className={styles.linkLabel}>Admin-Link (nur für dich):</label>
              <div className={styles.linkRow}>
                <code className={styles.linkCode}>{adminLink}</code>
                <button
                  onClick={() => copyToClipboard(adminLink)}
                  className={styles.copyButton}
                  aria-label="Kopieren"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Actions Card */}
          <div className={styles.card}>
            <h3 className={styles.cardSubtitle}>Aktionen</h3>
            <div className={styles.actionsGrid}>
              {isClosed ? (
                <button
                  onClick={handleReopen}
                  disabled={isClosing}
                  className={styles.actionButton}
                >
                  {isClosing ? '...' : 'Wieder öffnen'}
                </button>
              ) : (
                <button
                  onClick={handleClose}
                  disabled={isClosing}
                  className={styles.actionButton}
                >
                  {isClosing ? '...' : 'Einstand schließen'}
                </button>
              )}

              <Link to={`/s/${session.id}`} className={styles.actionButtonLink}>
                Teilnehmer-Ansicht
              </Link>

              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className={styles.deleteButton}
                >
                  Einstand löschen
                </button>
              ) : (
                <div className={styles.deleteConfirm}>
                  <p>Wirklich löschen? Das kann nicht rückgängig gemacht werden.</p>
                  <div className={styles.deleteActions}>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className={styles.confirmDeleteButton}
                    >
                      {isDeleting ? '...' : 'Ja, löschen'}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className={styles.cancelDeleteButton}
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Summary Card */}
          <div className={styles.card}>
            <h3 className={styles.cardSubtitle}>Zusammenfassung</h3>
            <div className={styles.summaryStats}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Teilnehmer</span>
                <span className={styles.statValue}>{entries.length}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Würste</span>
                <span className={styles.statValue}>{totals.totalWurst}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Brezeln</span>
                <span className={styles.statValue}>{totals.totalPretzel}</span>
              </div>
              {session.mode === 'SPLIT' && (
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Gesamt</span>
                  <span className={styles.statValue}>
                    {totals.totalCost.toFixed(2)} €
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Entries Table */}
          <div className={styles.card}>
            <h3 className={styles.cardSubtitle}>Teilnehmer ({entries.length})</h3>
            {entries.length > 0 ? (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Würste</th>
                      <th>Brezeln</th>
                      {session.mode === 'SPLIT' && <th>Betrag</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr key={entry.id}>
                        <td>{entry.display_name}</td>
                        <td>{entry.wurst_count}</td>
                        <td>{entry.pretzel_count}</td>
                        {session.mode === 'SPLIT' && (
                          <td className={styles.costCell}>
                            {(
                              entry.wurst_count * (session.price_wurst || 0) +
                              entry.pretzel_count * (session.price_pretzel || 0)
                            ).toFixed(2)}{' '}
                            €
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  {session.mode === 'SPLIT' && (
                    <tfoot>
                      <tr>
                        <td><strong>Gesamt</strong></td>
                        <td><strong>{totals.totalWurst}</strong></td>
                        <td><strong>{totals.totalPretzel}</strong></td>
                        <td className={styles.costCell}>
                          <strong>{totals.totalCost.toFixed(2)} €</strong>
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            ) : (
              <p className={styles.emptyMessage}>Noch keine Teilnehmer</p>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p>Made in Bayern • Servus!</p>
        </div>
      </footer>
    </div>
  );
}
