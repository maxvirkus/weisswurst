/**
 * Session Page
 * 
 * Participant view for a shared Einstand session.
 * - Fetches session + entries from Supabase
 * - Realtime updates via subscription
 * - Add/update own entry
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import type { Toast } from '../types';
import { DEFAULT_BREZEL_PRICE } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { SessionPublic, Entry, EntryInsert } from '../lib/database.types';
import { WurstScene } from '../components/WurstScene';
import { SceneErrorBoundary } from '../components/SceneErrorBoundary';
import { ToastContainer } from '../components/ToastContainer';
import { Summary } from '../components/Summary';
import { ColleagueList } from '../components/ColleagueList';
import styles from '../App.module.css';
import pageStyles from './SessionPage.module.css';

// Security constants
const MAX_NAME_LENGTH = 50;

// Local storage key for participant identity
const getParticipantKey = (sessionId: string) => `weisswurst_participant_${sessionId}`;

interface ParticipantIdentity {
  entryId: string;
  displayName: string;
}

export function SessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  
  // Data state
  const [session, setSession] = useState<SessionPublic | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Participant state
  const [myIdentity, setMyIdentity] = useState<ParticipantIdentity | null>(null);
  const [inputName, setInputName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  
  // UI state
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

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

  // Load participant identity from localStorage
  useEffect(() => {
    if (!sessionId) return;
    const stored = localStorage.getItem(getParticipantKey(sessionId));
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Validate parsed data structure
        if (
          parsed &&
          typeof parsed.entryId === 'string' &&
          typeof parsed.displayName === 'string' &&
          parsed.displayName.length <= MAX_NAME_LENGTH
        ) {
          setMyIdentity(parsed);
        } else {
          localStorage.removeItem(getParticipantKey(sessionId));
        }
      } catch {
        localStorage.removeItem(getParticipantKey(sessionId));
      }
    }
  }, [sessionId]);

  // Fetch session and entries
  useEffect(() => {
    if (!sessionId || !isSupabaseConfigured) {
      setLoading(false);
      if (!isSupabaseConfigured) {
        setError('Supabase nicht konfiguriert');
      }
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch session
        const { data: sessionData, error: sessionError } = await supabase
          .from('einstand_sessions_public')
          .select('*')
          .eq('id', sessionId)
          .single();

        if (sessionError) {
          if (sessionError.code === 'PGRST116') {
            setError('Session nicht gefunden');
          } else {
            throw sessionError;
          }
          return;
        }

        // Type assertion - view data has nullable id but we know it exists after successful fetch
        if (sessionData?.id) {
          setSession(sessionData as SessionPublic);
        }

        // Fetch entries
        const { data: entriesData, error: entriesError } = await supabase
          .from('einstand_entries')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true });

        if (entriesError) throw entriesError;
        setEntries(entriesData || []);
        
        // Auto-select my entry if identity exists
        if (myIdentity) {
          setActiveEntryId(myIdentity.entryId);
        }
      } catch (err) {
        console.error('Error fetching session:', err);
        setError('Fehler beim Laden der Session');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sessionId, myIdentity]);

  // Realtime subscriptions
  useEffect(() => {
    if (!sessionId || !isSupabaseConfigured) return;

    // Subscribe to session changes
    const sessionChannel = supabase
      .channel(`session:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'einstand_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            // Re-fetch session to get public view (without admin_secret)
            supabase
              .from('einstand_sessions_public')
              .select('*')
              .eq('id', sessionId)
              .single()
              .then(({ data }) => {
                if (data?.id) {
                  setSession(data as SessionPublic);
                  if (data.status === 'CLOSED') {
                    showToast('Der Einstand wurde geschlossen', 'info');
                  }
                }
              });
          } else if (payload.eventType === 'DELETE') {
            setError('Der Einstand wurde gelöscht');
            setSession(null);
          }
        }
      )
      .subscribe();

    // Subscribe to entry changes
    const entriesChannel = supabase
      .channel(`entries:${sessionId}`)
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
      sessionChannel.unsubscribe();
      entriesChannel.unsubscribe();
    };
  }, [sessionId, showToast]);

  // Join session (create entry)
  const handleJoin = useCallback(async () => {
    const sanitizedName = inputName.trim().slice(0, MAX_NAME_LENGTH);
    if (!sessionId || !sanitizedName || isJoining) return;
    
    setIsJoining(true);
    try {
      const entry: EntryInsert = {
        session_id: sessionId,
        display_name: sanitizedName,
        wurst_count: 0,
        pretzel_count: 0,
      };

      const { data, error } = await supabase
        .from('einstand_entries')
        .insert(entry)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Keine Daten zurückbekommen');

      const identity: ParticipantIdentity = {
        entryId: data.id,
        displayName: data.display_name,
      };

      localStorage.setItem(getParticipantKey(sessionId), JSON.stringify(identity));
      setMyIdentity(identity);
      setActiveEntryId(data.id);
      showToast(`Willkommen, ${data.display_name}!`, 'success');
    } catch (err) {
      console.error('Error joining:', err);
      showToast('Fehler beim Beitreten', 'error');
    } finally {
      setIsJoining(false);
    }
  }, [sessionId, inputName, showToast]);

  // Increment wurst
  const handleDipComplete = useCallback(async () => {
    if (!activeEntryId) return;
    
    const entry = entries.find((e) => e.id === activeEntryId);
    if (!entry) return;

    const { error } = await supabase
      .from('einstand_entries')
      .update({ wurst_count: entry.wurst_count + 1 })
      .eq('id', activeEntryId);

    if (error) {
      showToast('Fehler: ' + error.message, 'error');
    } else {
      showToast(`+1 Wurst für ${entry.display_name}`, 'success');
    }
  }, [activeEntryId, entries, showToast]);

  // Increment pretzel
  const handleBrezelComplete = useCallback(async () => {
    if (!activeEntryId) return;
    
    const entry = entries.find((e) => e.id === activeEntryId);
    if (!entry) return;

    const { error } = await supabase
      .from('einstand_entries')
      .update({ pretzel_count: entry.pretzel_count + 1 })
      .eq('id', activeEntryId);

    if (error) {
      showToast('Fehler: ' + error.message, 'error');
    } else {
      showToast(`+1 Brezel für ${entry.display_name}`, 'success');
    }
  }, [activeEntryId, entries, showToast]);

  const handleNoSelection = useCallback(() => {
    showToast('Erst einen Namen auswählen!', 'warning');
  }, [showToast]);

  const handleBeerClick = useCallback(() => {
    showToast('Natürlich alkoholfrei', 'info');
  }, [showToast]);

  // Delete entry
  const handleDeleteEntry = useCallback(async (entryId: string) => {
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) return;

    const { error } = await supabase
      .from('einstand_entries')
      .delete()
      .eq('id', entryId);

    if (error) {
      showToast('Fehler beim Löschen: ' + error.message, 'error');
    } else {
      // Immediately update local state
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
      
      showToast(`${entry.display_name} entfernt`, 'success');
      if (activeEntryId === entryId) {
        setActiveEntryId(null);
      }
      // Clear identity if user deleted themselves
      if (myIdentity?.entryId === entryId) {
        localStorage.removeItem(getParticipantKey(sessionId!));
        setMyIdentity(null);
      }
    }
  }, [entries, activeEntryId, myIdentity, sessionId, showToast]);

  // Decrement wurst
  const handleDecrementWurst = useCallback(async (entryId: string) => {
    const entry = entries.find((e) => e.id === entryId);
    if (!entry || entry.wurst_count <= 0) return;

    const newCount = entry.wurst_count - 1;
    const { error } = await supabase
      .from('einstand_entries')
      .update({ wurst_count: newCount })
      .eq('id', entryId);

    if (error) {
      showToast('Fehler: ' + error.message, 'error');
    }
  }, [entries, showToast]);

  // Decrement brezel
  const handleDecrementBrezel = useCallback(async (entryId: string) => {
    const entry = entries.find((e) => e.id === entryId);
    if (!entry || entry.pretzel_count <= 0) return;

    const newCount = entry.pretzel_count - 1;
    const { error } = await supabase
      .from('einstand_entries')
      .update({ pretzel_count: newCount })
      .eq('id', entryId);

    if (error) {
      showToast('Fehler: ' + error.message, 'error');
    }
  }, [entries, showToast]);

  // Reset counts
  const handleReset = useCallback(async (entryId: string) => {
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) return;

    const { error } = await supabase
      .from('einstand_entries')
      .update({ wurst_count: 0, pretzel_count: 0 })
      .eq('id', entryId);

    if (error) {
      showToast('Fehler: ' + error.message, 'error');
    } else {
      showToast(`${entry.display_name} zurückgesetzt`, 'success');
    }
  }, [entries, showToast]);

  // Active entry for scene
  const activeEntry = entries.find((e) => e.id === activeEntryId);

  // Convert entries to colleagues format for Summary component
  const colleagues = useMemo(() => 
    entries.map(entry => ({
      id: entry.id,
      name: entry.display_name,
      count: entry.wurst_count,
      brezelCount: entry.pretzel_count,
    })),
    [entries]
  );

  // Loading state
  if (loading) {
    return (
      <div className={pageStyles.loadingContainer}>
        <div className={pageStyles.spinner} />
        <p>Lade Session...</p>
      </div>
    );
  }

  // Error state
  if (error || !session) {
    return (
      <div className={pageStyles.errorContainer}>
        <div className={pageStyles.errorCard}>
          <div className={pageStyles.errorIcon}>😢</div>
          <h1>{error || 'Session nicht gefunden'}</h1>
          <Link to="/" className={pageStyles.backLink}>
            ← Zurück zur Startseite
          </Link>
        </div>
      </div>
    );
  }

  // Closed session banner
  const isClosed = session.status === 'CLOSED';

  return (
    <>
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
              <h1 className={styles.title}>{session.title || 'Weißwurst Einstand'}</h1>
            </div>
          </div>
        </div>
      </header>

      {isClosed && (
        <div style={{
          background: '#fef2f2',
          borderBottom: '1px solid #fecaca',
          color: '#dc2626',
          textAlign: 'center',
          padding: '0.75rem',
          fontWeight: 500
        }}>
          🔒 Dieser Einstand ist geschlossen. Keine Änderungen mehr möglich.
        </div>
      )}

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.grid}>
          
          {/* Left Column */}
          <div className={styles.leftColumn}>
            {/* 3D Scene Card */}
            <div className={styles.sceneCard} data-scene-area>
              <div className={styles.sceneContainer}>
                <SceneErrorBoundary>
                  <WurstScene 
                    hasActiveColleague={!!activeEntryId && !isClosed}
                    activeColleagueName={activeEntry?.display_name}
                    wurstCount={activeEntry?.wurst_count ?? 0}
                    brezelCount={activeEntry?.pretzel_count ?? 0}
                    onDipComplete={isClosed ? () => {} : handleDipComplete}
                    onBrezelComplete={isClosed ? () => {} : handleBrezelComplete}
                    onNoSelection={handleNoSelection}
                    onBeerClick={handleBeerClick}
                  />
                </SceneErrorBoundary>
              </div>
            </div>

            {/* Summary Card */}
            <Summary 
              colleagues={colleagues}
              mode={session.mode === 'SPLIT' ? 'split' : 'invite'}
              pricePerWurst={session.price_wurst || 0}
              pricePerBrezel={session.price_pretzel || DEFAULT_BREZEL_PRICE}
            />
          </div>

          {/* Right Column */}
          <div className={styles.rightColumn} data-colleague-area onClick={(e) => e.stopPropagation()}>
            <div className={styles.colleagueCard}>
              <button 
                type="button"
                className={styles.colleagueHeader}
                onClick={() => setIsCollapsed(prev => !prev)}
              >
                <h2 className={styles.colleagueTitle}>
                  <span className="truncate">Teilnehmer</span>
                </h2>
                <div className={styles.colleagueHeaderRight}>
                  <span className={styles.colleagueCount}>
                    {entries.length}
                  </span>
                  <span className={`${styles.collapseIcon} ${isCollapsed ? styles.collapsed : ''}`}>
                    ▼
                  </span>
                </div>
              </button>
              
              {!isCollapsed && (
              <div className={styles.colleagueList}>
                <ColleagueList 
                  colleagues={colleagues}
                  activeColleagueId={activeEntryId}
                  mode={session.mode === 'SPLIT' ? 'split' : 'invite'}
                  pricePerWurst={session.price_wurst || 0}
                  pricePerBrezel={session.price_pretzel || DEFAULT_BREZEL_PRICE}
                  sortMode="alphabetical"
                  onColleaguesChange={(updatedColleagues) => {
                    // Detect deletion by comparing lengths
                    if (updatedColleagues.length < colleagues.length) {
                      const deletedColleague = colleagues.find(
                        c => !updatedColleagues.find(u => u.id === c.id)
                      );
                      if (deletedColleague) {
                        handleDeleteEntry(deletedColleague.id);
                      }
                    }
                  }}
                  onActiveChange={(id) => !isClosed && setActiveEntryId(id)}
                  onSortModeChange={() => {}}
                  readOnly={false}
                  highlightId={myIdentity?.entryId}
                  showJoinForm={!isClosed}
                  onDecrementWurst={handleDecrementWurst}
                  onDecrementBrezel={handleDecrementBrezel}
                  onReset={handleReset}
                  joinFormProps={{
                    inputValue: inputName,
                    onInputChange: setInputName,
                    onJoin: handleJoin,
                    isJoining: isJoining,
                  }}
                />
              </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p>Made with 🥨 in Bayern • Servus!</p>
        </div>
      </footer>
    </div>
    </>
  );
}
