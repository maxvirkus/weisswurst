/**
 * WurstScene - Main 3D Scene Component (Refactored)
 * 
 * Orchestrates the 3D visualization with:
 * - Interactive Weisswurst + Pretzel with animations
 * - Mustard jar, plate with food, decorations
 * - Camera animations for init sequence
 * - WebGL detection with 2D fallback
 * 
 * @see src/components/scene/ for individual scene components
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';

// Scene sub-components
import {
  SceneLights,
  WoodTable,
  Sky,
  BeerBottle,
  Cutlery,
  Weisswurst,
  Pretzel,
  Senfglas,
  Teller,
} from './scene';

import styles from './WurstScene.module.css';

// ============================================================
// Types
// ============================================================

interface WurstSceneProps {
  hasActiveColleague: boolean;
  activeColleagueName?: string;
  wurstCount: number;
  brezelCount: number;
  onDipComplete: () => void;
  onBrezelComplete: () => void;
  onNoSelection: () => void;
  onBeerClick?: () => void;
}

interface SceneProps {
  hasActiveColleague: boolean;
  wurstCount: number;
  brezelCount: number;
  onDipComplete: () => void;
  onBrezelComplete: () => void;
  onNoSelection: () => void;
  onBeerClick?: () => void;
}

// ============================================================
// Animation Constants
// ============================================================

const ANIMATION_DURATIONS = {
  init: 1500,      // Init camera/object transition
  dip: 1200,       // Wurst dipping animation
  brezel: 800,     // Brezel spin animation
} as const;

// ============================================================
// Camera Animation Component
// ============================================================

function CameraAnimation({ progress }: { progress: number }) {
  const { camera } = useThree();
  
  useFrame(() => {
    if (progress === 0) {
      // Initial position - show both wurst and brezel centered
      camera.position.set(0, 1.8, 3.5);
      camera.lookAt(0, 0, 0.8);
    } else if (progress < 1) {
      // Smooth transition with ease-in-out cubic
      const t = progress;
      const easeT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      
      // Interpolate position
      const startPos = { x: 0, y: 1.8, z: 3.5 };
      const endPos = { x: 0, y: 1.5, z: 4 };
      
      camera.position.x = startPos.x + (endPos.x - startPos.x) * easeT;
      camera.position.y = startPos.y + (endPos.y - startPos.y) * easeT;
      camera.position.z = startPos.z + (endPos.z - startPos.z) * easeT;
      
      // Interpolate lookAt target
      const startLookAt = { x: 0, y: 0, z: 0.8 };
      const endLookAt = { x: 0, y: 0, z: 0 };
      
      camera.lookAt(
        startLookAt.x + (endLookAt.x - startLookAt.x) * easeT,
        startLookAt.y + (endLookAt.y - startLookAt.y) * easeT,
        startLookAt.z + (endLookAt.z - startLookAt.z) * easeT
      );
    } else {
      // Final position
      camera.position.set(0, 1.5, 4);
      camera.lookAt(0, 0, 0);
    }
  });
  
  return null;
}

// ============================================================
// Main Scene Component (inside Canvas)
// ============================================================

function Scene({ 
  hasActiveColleague, 
  wurstCount,
  brezelCount,
  onDipComplete, 
  onBrezelComplete,
  onNoSelection,
  onBeerClick
}: SceneProps) {
  // Animation state
  const [isAnimating, setIsAnimating] = useState(false);
  const [isBrezelAnimating, setIsBrezelAnimating] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [brezelAnimationProgress, setBrezelAnimationProgress] = useState(0);
  const [senfWave, setSenfWave] = useState(0);
  const [isInitMode, setIsInitMode] = useState(true);
  const [initAnimationProgress, setInitAnimationProgress] = useState(0);
  
  // Animation frame refs
  const animationRef = useRef<number | null>(null);
  const brezelAnimationRef = useRef<number | null>(null);
  const initAnimationRef = useRef<number | null>(null);
  
  // Lock refs to prevent multiple increments (survives StrictMode)
  const isDippingRef = useRef(false);
  const hasCalledCompleteRef = useRef(false);
  const isBrezelClickingRef = useRef(false);
  const hasCalledBrezelCompleteRef = useRef(false);

  // ============================================================
  // Dip Animation Logic
  // ============================================================
  
  const startDipAnimation = useCallback(() => {
    if (isDippingRef.current) return;
    
    isDippingRef.current = true;
    hasCalledCompleteRef.current = false;
    setIsAnimating(true);
    setAnimationProgress(0);
    
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / ANIMATION_DURATIONS.dip, 1);
      
      setAnimationProgress(progress);
      
      // Trigger senf wave during dip phase
      if (progress > 0.45 && progress < 0.75) {
        setSenfWave(1 - Math.abs(progress - 0.6) * 5);
      } else {
        setSenfWave(0);
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        if (!hasCalledCompleteRef.current) {
          hasCalledCompleteRef.current = true;
          onDipComplete();
        }
        
        setIsAnimating(false);
        setAnimationProgress(0);
        setSenfWave(0);
        isDippingRef.current = false;
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [onDipComplete]);

  // ============================================================
  // Brezel Animation Logic
  // ============================================================
  
  const startBrezelAnimation = useCallback(() => {
    if (isBrezelClickingRef.current) return;
    
    isBrezelClickingRef.current = true;
    hasCalledBrezelCompleteRef.current = false;
    setIsBrezelAnimating(true);
    setBrezelAnimationProgress(0);
    
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / ANIMATION_DURATIONS.brezel, 1);
      
      setBrezelAnimationProgress(progress);

      if (progress < 1) {
        brezelAnimationRef.current = requestAnimationFrame(animate);
      } else {
        if (!hasCalledBrezelCompleteRef.current) {
          hasCalledBrezelCompleteRef.current = true;
          onBrezelComplete();
        }
        
        setIsBrezelAnimating(false);
        setBrezelAnimationProgress(0);
        isBrezelClickingRef.current = false;
      }
    };

    brezelAnimationRef.current = requestAnimationFrame(animate);
  }, [onBrezelComplete]);

  // ============================================================
  // Init Animation Logic
  // ============================================================
  
  const startInitAnimation = useCallback((onComplete: () => void) => {
    setIsInitMode(false);
    const startTime = Date.now();
    
    const animateInit = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / ANIMATION_DURATIONS.init, 1);
      
      setInitAnimationProgress(progress);
      
      if (progress < 1) {
        initAnimationRef.current = requestAnimationFrame(animateInit);
      } else {
        setInitAnimationProgress(1);
        onComplete();
      }
    };
    
    initAnimationRef.current = requestAnimationFrame(animateInit);
  }, []);

  // ============================================================
  // Click Handlers
  // ============================================================

  const handleWurstClick = useCallback(() => {
    if (!hasActiveColleague) {
      onNoSelection();
      return;
    }
    
    // If in init mode, start init animation first, then dip
    if (isInitMode) {
      startInitAnimation(() => startDipAnimation());
      return;
    }
    
    // Normal click - just start dip if not already animating
    if (!isDippingRef.current && !isAnimating) {
      startDipAnimation();
    }
  }, [hasActiveColleague, isAnimating, isInitMode, onNoSelection, startDipAnimation, startInitAnimation]);

  const handleBrezelClick = useCallback(() => {
    if (!hasActiveColleague) {
      onNoSelection();
      return;
    }
    
    // If in init mode, start init animation first, then brezel
    if (isInitMode) {
      startInitAnimation(() => startBrezelAnimation());
      return;
    }
    
    // Normal click - just start brezel if not already animating
    if (!isBrezelClickingRef.current && !isBrezelAnimating) {
      startBrezelAnimation();
    }
  }, [hasActiveColleague, isBrezelAnimating, isInitMode, onNoSelection, startBrezelAnimation, startInitAnimation]);

  // ============================================================
  // Cleanup
  // ============================================================

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (brezelAnimationRef.current) cancelAnimationFrame(brezelAnimationRef.current);
      if (initAnimationRef.current) cancelAnimationFrame(initAnimationRef.current);
    };
  }, []);

  // ============================================================
  // Render
  // ============================================================

  return (
    <>
      {/* Camera animation during init */}
      <CameraAnimation progress={isInitMode ? 0 : initAnimationProgress} />
      
      {/* Lighting */}
      <SceneLights />
      
      {/* Interactive food items - always visible */}
      <Weisswurst 
        isAnimating={isAnimating}
        animationProgress={animationProgress}
        onClick={handleWurstClick}
        initAnimationProgress={initAnimationProgress}
      />
      <Pretzel 
        isAnimating={isBrezelAnimating}
        animationProgress={brezelAnimationProgress}
        onClick={handleBrezelClick}
        initAnimationProgress={initAnimationProgress}
      />
      
      {/* Scene objects that fly in after initialization */}
      {(!isInitMode || initAnimationProgress > 0) && (
        <group 
          position={[
            0, 
            isInitMode ? (1 - initAnimationProgress) * -3 : 0,
            0
          ]}
          scale={isInitMode ? 0.5 + (initAnimationProgress * 0.5) : 1}
        >
          <Senfglas senfWave={senfWave} />
          <Teller wurstCount={wurstCount} brezelCount={brezelCount} />
          <BeerBottle onClick={onBeerClick} />
          <Cutlery />
          <WoodTable />
        </group>
      )}
      
      {/* Sky and clouds - always visible */}
      <Sky />
      
      {/* Environment for reflections */}
      <Environment preset="apartment" environmentIntensity={0.6} />
    </>
  );
}

// ============================================================
// 2D Fallback Component (no WebGL)
// ============================================================

function FallbackWurst({ 
  hasActiveColleague, 
  activeColleagueName,
  onDipComplete, 
  onNoSelection 
}: Omit<WurstSceneProps, 'wurstCount' | 'brezelCount' | 'onBrezelComplete' | 'onBeerClick'>) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [position, setPosition] = useState({ y: 0, rotation: 0 });
  
  const isDippingRef = useRef(false);
  const hasCalledCompleteRef = useRef(false);

  const handleClick = useCallback(() => {
    if (isDippingRef.current || isAnimating) return;
    
    if (!hasActiveColleague) {
      onNoSelection();
      return;
    }

    isDippingRef.current = true;
    hasCalledCompleteRef.current = false;
    setIsAnimating(true);
    
    let frame = 0;
    const animate = () => {
      frame++;
      const progress = frame / 60;
      
      if (progress < 0.5) {
        setPosition({ y: progress * 40, rotation: progress * 20 });
      } else if (progress < 1) {
        setPosition({ y: 40 - (progress - 0.5) * 80, rotation: 20 - (progress - 0.5) * 40 });
      } else {
        if (!hasCalledCompleteRef.current) {
          hasCalledCompleteRef.current = true;
          onDipComplete();
        }
        setIsAnimating(false);
        setPosition({ y: 0, rotation: 0 });
        isDippingRef.current = false;
        return;
      }
      
      requestAnimationFrame(animate);
    };
    
    requestAnimationFrame(animate);
  }, [hasActiveColleague, isAnimating, onDipComplete, onNoSelection]);

  return (
    <div className={styles.fallback}>
      <button
        onClick={handleClick}
        disabled={isAnimating}
        className={styles.wurst}
        style={{
          transform: `translateY(${position.y}px) rotate(${position.rotation}deg)`,
          transition: isAnimating ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        🌭
      </button>
      
      <div className={styles.senf}>🫙</div>
      
      <div className={styles.hint}>
        {hasActiveColleague ? (
          <span>Klick die Wurst für <strong>{activeColleagueName}</strong>!</span>
        ) : (
          <span>Erst Person auswählen</span>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Main Export Component
// ============================================================

export function WurstScene({ 
  hasActiveColleague, 
  activeColleagueName,
  wurstCount,
  brezelCount,
  onDipComplete,
  onBrezelComplete,
  onNoSelection,
  onBeerClick
}: WurstSceneProps) {
  const [webGLSupported, setWebGLSupported] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      setWebGLSupported(!!gl);
    } catch {
      setWebGLSupported(false);
    }
  }, []);

  // Loading state
  if (webGLSupported === null) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingText}>Lädt...</div>
      </div>
    );
  }

  // 2D Fallback
  if (!webGLSupported) {
    return (
      <FallbackWurst
        hasActiveColleague={hasActiveColleague}
        activeColleagueName={activeColleagueName}
        onDipComplete={onDipComplete}
        onNoSelection={onNoSelection}
      />
    );
  }

  // 3D Scene
  return (
    <div className={styles.container}>
      <Canvas
        shadows="soft"
        camera={{ 
          position: [0, 1.5, 4], 
          fov: typeof window !== 'undefined' && window.innerWidth < 640 ? 50 : 40 
        }}
        gl={{ 
          antialias: true,
          powerPreference: 'high-performance',
          failIfMajorPerformanceCaveat: false,
        }}
        dpr={typeof window !== 'undefined' && window.innerWidth < 640 ? [1, 1.5] : [1, 2]}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color('#E8F0F7'));
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        <Scene 
          hasActiveColleague={hasActiveColleague}
          wurstCount={wurstCount}
          brezelCount={brezelCount}
          onDipComplete={onDipComplete}
          onBrezelComplete={onBrezelComplete}
          onNoSelection={onNoSelection}
          onBeerClick={onBeerClick}
        />
      </Canvas>
      
      {/* Overlay hint */}
      <div className={styles.hint}>
        {hasActiveColleague ? (
          <span>Klick die Wurst oder Brezel für <strong>{activeColleagueName}</strong>!</span>
        ) : (
          <span>Erst Person auswählen</span>
        )}
      </div>
    </div>
  );
}

export default WurstScene;
