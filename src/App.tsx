import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { AppState, Toast } from './types';
import { DEFAULT_PRICE, DEFAULT_BREZEL_PRICE, STORAGE_KEY } from './types';
import { useLocalStorageState } from './hooks/useLocalStorageState';
import { ColleagueList } from './components/ColleagueList';
import { Summary } from './components/Summary';
import { ModeToggle } from './components/ModeToggle';
import { PriceInput } from './components/PriceInput';
import { WurstScene } from './components/WurstScene';
import { ToastContainer } from './components/ToastContainer';
import BavarianBackground from './components/BavarianBackground';
import styles from './App.module.css';

const initialState: AppState = {
  colleagues: [],
  activeColleagueId: null,
  mode: 'invite',
  pricePerWurst: DEFAULT_PRICE,
  pricePerBrezel: DEFAULT_BREZEL_PRICE,
  sortMode: 'alphabetical',
};

function App() {
  const [state, setState] = useLocalStorageState<AppState>(STORAGE_KEY, initialState);
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

  const activeColleague = state.colleagues.find((c) => c.id === state.activeColleagueId);

  const handleDipComplete = useCallback(() => {
    if (!state.activeColleagueId) return;
    
    setState((prev) => ({
      ...prev,
      colleagues: prev.colleagues.map((c) =>
        c.id === prev.activeColleagueId ? { ...c, count: c.count + 1 } : c
      ),
    }));
    
    showToast(`+1 Wurst für ${activeColleague?.name}! 🥨`, 'success');
  }, [state.activeColleagueId, activeColleague?.name, setState, showToast]);

  const handleBrezelComplete = useCallback(() => {
    if (!state.activeColleagueId) return;
    
    setState((prev) => ({
      ...prev,
      colleagues: prev.colleagues.map((c) =>
        c.id === prev.activeColleagueId ? { ...c, brezelCount: (c.brezelCount || 0) + 1 } : c
      ),
    }));
    
    showToast(`+1 Brezel für ${activeColleague?.name}! 🥨`, 'success');
  }, [state.activeColleagueId, activeColleague?.name, setState, showToast]);

  const handleNoSelection = useCallback(() => {
    showToast('Erst einen Namen auswählen!', 'warning');
  }, [showToast]);

  const handleResetAll = useCallback(() => {
    setState((prev) => ({
      ...prev,
      colleagues: prev.colleagues.map((c) => ({ ...c, count: 0, brezelCount: 0 })),
    }));
    showToast('Alle Zähler zurückgesetzt', 'info');
  }, [setState, showToast]);

  return (
    <>
      <BavarianBackground />
      <div className={styles.container}>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerContent}>
            <div className={styles.logo}>
              <span>🥨</span>
            </div>
            
            <div className={styles.titleCenter}>
              <h1 className={styles.title}>Weißwurst Einstand</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.grid}>
          
          {/* Left Column */}
          <div className={styles.leftColumn}>
            {/* 3D Scene Card */}
            <div className={styles.sceneCard}>
              <div className={styles.sceneContainer}>
                <WurstScene 
                  hasActiveColleague={!!state.activeColleagueId}
                  activeColleagueName={activeColleague?.name ?? null}
                  wurstCount={activeColleague?.count ?? 0}
                  brezelCount={activeColleague?.brezelCount ?? 0}
                  onDipComplete={handleDipComplete}
                  onBrezelComplete={handleBrezelComplete}
                  onNoSelection={handleNoSelection}
                />
              </div>
            </div>

            {/* Mode and Price Controls Card */}
            <div className={styles.controlsCard}>
              <div className={styles.controlsInner}>
                <ModeToggle 
                  mode={state.mode}
                  onChange={(mode) => setState((prev) => ({ ...prev, mode }))}
                />
                {state.mode === 'split' && (
                  <>
                    <PriceInput 
                      price={state.pricePerWurst}
                      onChange={(pricePerWurst) => setState((prev) => ({ ...prev, pricePerWurst }))}
                      label="Preis pro Wurst"
                    />
                    <PriceInput 
                      price={state.pricePerBrezel || DEFAULT_BREZEL_PRICE}
                      onChange={(pricePerBrezel) => setState((prev) => ({ ...prev, pricePerBrezel }))}
                      label="Preis pro Brezel"
                    />
                  </>
                )}
              </div>
            </div>

            {/* Summary Card */}
            <Summary 
              colleagues={state.colleagues}
              mode={state.mode}
              pricePerWurst={state.pricePerWurst}
              pricePerBrezel={state.pricePerBrezel}
              onResetAll={handleResetAll}
            />
          </div>

          {/* Right Column */}
          <div className={styles.rightColumn}>
            <div className={styles.colleagueCard}>
              <div className={styles.colleagueHeader}>
                <h2 className={styles.colleagueTitle}>
                  <span>👥</span>
                  <span className="truncate">Kolleg:innen</span>
                </h2>
                <span className={styles.colleagueCount}>
                  {state.colleagues.length}
                </span>
              </div>
              
              <div className={styles.colleagueList}>
                <ColleagueList 
                  colleagues={state.colleagues}
                  activeColleagueId={state.activeColleagueId}
                  mode={state.mode}
                  pricePerWurst={state.pricePerWurst}
                  sortMode={state.sortMode}
                  onColleaguesChange={(colleagues) => setState((prev) => ({ ...prev, colleagues }))}
                  onActiveChange={(activeColleagueId) => setState((prev) => ({ ...prev, activeColleagueId }))}
                  onSortModeChange={(sortMode) => setState((prev) => ({ ...prev, sortMode }))}
                />
              </div>
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

export default App;
