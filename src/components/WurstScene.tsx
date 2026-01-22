import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import styles from './WurstScene.module.css';

interface WurstSceneProps {
  hasActiveColleague: boolean;
  activeColleagueName: string | null;
  wurstCount: number;
  brezelCount: number;
  onDipComplete: () => void;
  onBrezelComplete: () => void;
  onNoSelection: () => void;
}

// Weißwurst Component
function Weisswurst({ 
  isAnimating, 
  animationProgress,
  onClick 
}: { 
  isAnimating: boolean;
  animationProgress: number;
  onClick: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const wurstRef = useRef<THREE.Group>(null);

  // Single handler with stopPropagation to prevent multiple fires
  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    // CRITICAL: Stop event from bubbling to other meshes
    e.stopPropagation();
    onClick();
  }, [onClick]);

  useFrame(() => {
    if (!groupRef.current || !wurstRef.current) return;

    if (isAnimating) {
      const phase = animationProgress;
      
      // Positionen - Glas steht jetzt rechts bei x=1.3
      const startX = 1.9;    // Startposition weiter rechts außen
      const glasX = 1.3;     // Senfglas Position
      const startY = 0.4;    // Obere Position
      const dipY = -0.28;    // Eintauchtiefe - Spitze im Senf
      
      let x: number;
      let y: number;
      let tilt: number;      // Leichte Neigung beim Eintauchen
      
      if (phase < 0.25) {
        // Phase 1: Leicht anheben
        const t = phase / 0.25;
        const easeT = 1 - Math.pow(1 - t, 3);
        x = startX;
        y = startY + 0.12 * easeT;
        tilt = 0;
      } else if (phase < 0.5) {
        // Phase 2: Zum Glas schwingen und eintauchen
        const t = (phase - 0.25) / 0.25;
        const easeT = t * t; // ease-in für beschleunigung nach unten
        x = startX - (startX - glasX) * easeT;
        y = (startY + 0.12) - ((startY + 0.12) - dipY) * easeT;
        tilt = Math.sin(t * Math.PI * 0.5) * 0.15; // Leichte Neigung
      } else if (phase < 0.65) {
        // Phase 3: Im Senf - kleine Bewegung
        const t = (phase - 0.5) / 0.15;
        x = glasX;
        y = dipY + Math.sin(t * Math.PI) * 0.04;
        tilt = 0.15 - t * 0.15;
        // Squash effect
        const squash = 1 - Math.sin(t * Math.PI) * 0.1;
        wurstRef.current.scale.set(1, squash, 1);
      } else {
        // Phase 4: Zurück zur Ausgangsposition
        const t = (phase - 0.65) / 0.35;
        const easeT = 1 - Math.pow(1 - t, 2);
        x = glasX + (startX - glasX) * easeT;
        y = dipY + (startY - dipY) * easeT;
        tilt = 0;
        wurstRef.current.scale.set(1, 1, 1);
      }
      
      groupRef.current.position.x = x;
      groupRef.current.position.y = y;
      groupRef.current.rotation.z = tilt;
    } else {
      // Idle animation: gentle float - gleiche Position wie Animation-Start
      groupRef.current.position.x = 1.9;
      groupRef.current.position.y = 0.4 + Math.sin(Date.now() * 0.002) * 0.05;
      groupRef.current.position.z = 0;
      groupRef.current.rotation.z = 0;
      wurstRef.current.scale.set(1, 1, 1);
    }
  });

  return (
    <group ref={groupRef} position={[1.9, 0.4, 0]}>
      <group ref={wurstRef}>
        {/* Main sausage body - vertikal stehend mit realistischer Farbe */}
        <mesh castShadow receiveShadow raycast={() => null}>
          <capsuleGeometry args={[0.12, 0.6, 32, 32]} />
          <meshPhysicalMaterial 
            color="#e8ddd4"
            roughness={0.6}
            metalness={0}
            clearcoat={0.08}
            clearcoatRoughness={0.5}
            sheen={0.2}
            sheenColor="#ffffff"
          />
        </mesh>
        
        {/* Subsurface scattering effect - inneres Leuchten */}
        <mesh raycast={() => null}>
          <capsuleGeometry args={[0.118, 0.58, 32, 32]} />
          <meshStandardMaterial 
            color="#faf5f0"
            roughness={0.7}
            metalness={0}
            transparent
            opacity={0.25}
          />
        </mesh>

        {/* Wurst ends - oben und unten mit realistischen Verschlüssen */}
        <mesh position={[0, 0.38, 0]} castShadow receiveShadow raycast={() => null}>
          <sphereGeometry args={[0.12, 24, 24]} />
          <meshPhysicalMaterial 
            color="#d9cdc3"
            roughness={0.65}
            metalness={0}
            clearcoat={0.05}
          />
        </mesh>
        <mesh position={[0, -0.38, 0]} castShadow receiveShadow raycast={() => null}>
          <sphereGeometry args={[0.12, 24, 24]} />
          <meshPhysicalMaterial 
            color="#d9cdc3"
            roughness={0.65}
            metalness={0}
            clearcoat={0.05}
          />
        </mesh>

        {/* Subtle ring marks - Darmhaut-Detail */}
        {[0.25, 0.12, 0, -0.12, -0.25].map((yPos, i) => (
          <mesh key={i} position={[0, yPos, 0]} raycast={() => null}>
            <torusGeometry args={[0.121, 0.004, 8, 32]} />
            <meshStandardMaterial 
              color="#d5c8be"
              roughness={0.7}
              metalness={0}
            />
          </mesh>
        ))}

        {/* Click hitbox - vertikal */}
        <mesh 
          onPointerDown={handlePointerDown}
          visible={false}
        >
          <boxGeometry args={[0.4, 1.0, 0.4]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      </group>
    </group>
  );
}

// Brezel Component - links in der Szene
function Brezel({ 
  isAnimating, 
  animationProgress,
  onClick 
}: { 
  isAnimating: boolean;
  animationProgress: number;
  onClick: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const brezelRef = useRef<THREE.Group>(null);

  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onClick();
  }, [onClick]);

  useFrame(() => {
    if (!groupRef.current || !brezelRef.current) return;

    if (isAnimating) {
      const phase = animationProgress;
      
      // Brezel bounce animation
      if (phase < 0.5) {
        const t = phase / 0.5;
        const bounce = Math.sin(t * Math.PI) * 0.3;
        groupRef.current.position.y = -0.1 + bounce;
        brezelRef.current.rotation.y = t * Math.PI * 2;
      } else {
        const t = (phase - 0.5) / 0.5;
        const easeT = 1 - Math.pow(1 - t, 2);
        groupRef.current.position.y = -0.1 + (0.3 - 0) * easeT;
        brezelRef.current.rotation.y = Math.PI * 2;
      }
    } else {
      // Idle animation: gentle rotation
      groupRef.current.position.y = -0.1 + Math.sin(Date.now() * 0.002) * 0.05;
      brezelRef.current.rotation.y = Date.now() * 0.0005;
    }
  });

  // Brezel geometry - Torus mit dickeren Armen
  return (
    <group ref={groupRef} position={[-1.5, -0.1, 0]}>
      <group ref={brezelRef} rotation={[0, 0, Math.PI / 4]}>
        {/* Hauptring */}
        <mesh castShadow receiveShadow raycast={() => null}>
          <torusGeometry args={[0.22, 0.06, 16, 32]} />
          <meshPhysicalMaterial 
            color="#8B6914"
            roughness={0.7}
            metalness={0}
            clearcoat={0.15}
            clearcoatRoughness={0.6}
          />
        </mesh>

        {/* Gekreuzte Arme - links */}
        <mesh position={[-0.06, 0.08, 0.02]} rotation={[0, 0, -0.6]} castShadow receiveShadow raycast={() => null}>
          <cylinderGeometry args={[0.055, 0.07, 0.28, 16]} />
          <meshPhysicalMaterial 
            color="#7A5C10"
            roughness={0.75}
            metalness={0}
            clearcoat={0.12}
          />
        </mesh>

        {/* Gekreuzte Arme - rechts */}
        <mesh position={[0.06, 0.08, 0.02]} rotation={[0, 0, 0.6]} castShadow receiveShadow raycast={() => null}>
          <cylinderGeometry args={[0.055, 0.07, 0.28, 16]} />
          <meshPhysicalMaterial 
            color="#7A5C10"
            roughness={0.75}
            metalness={0}
            clearcoat={0.12}
          />
        </mesh>

        {/* Salzkörner */}
        {[...Array(25)].map((_, i) => {
          const angle = (i / 25) * Math.PI * 2;
          const radius = 0.22;
          const offset = (i % 3) * 0.02;
          return (
            <mesh 
              key={`salt-${i}`}
              position={[
                Math.cos(angle) * radius + (Math.random() - 0.5) * 0.03,
                Math.sin(angle) * radius + (Math.random() - 0.5) * 0.03,
                0.06 + offset
              ]}
              raycast={() => null}
            >
              <sphereGeometry args={[0.008, 6, 6]} />
              <meshStandardMaterial 
                color="#f8f8f8"
                roughness={0.3}
                metalness={0}
              />
            </mesh>
          );
        })}

        {/* Click hitbox */}
        <mesh 
          onPointerDown={handlePointerDown}
          visible={false}
        >
          <boxGeometry args={[0.6, 0.6, 0.3]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      </group>
    </group>
  );
}

// Erstelle bauchige Senfglas-Geometrie mit LatheGeometry
// Händlmaier-Stil: Bauch → Schulter → deutlicher Hals → Schraubrand
function createSenfglasGeometry(isInner: boolean = false) {
  /*
    Proportionen für realistisches Senfglas:
    - Gesamthöhe: 0.80
    - Max. Radius (Bauch): 0.32
    - Hals-Radius: 0.24 (= 75% vom Bauch)
    - Höhe/Durchmesser-Verhältnis: 0.80 / 0.64 = 1.25:1
    
    Profilaufbau (von unten nach oben):
    1. Boden: gewölbt, dicke Kante (0.00 - 0.04)
    2. Unterer Körper: breiter werdend (0.04 - 0.20)
    3. Bauch: maximale Breite (0.20 - 0.40)
    4. Schulter: deutliche Verjüngung (0.40 - 0.55)
    5. Hals: zylindrisch, kurz (0.55 - 0.68)
    6. Schraubrand: umlaufender Ring (0.68 - 0.80)
  */
  
  const wallOffset = isInner ? 0.025 : 0; // Glasdicke
  const points: THREE.Vector2[] = [];
  
  // Helper: Radius mit optionaler Imperfektion
  const r = (radius: number, seed: number = 0) => {
    const imperfection = seed > 0 ? (1 + Math.sin(seed * 17.53) * 0.004) : 1;
    return Math.max(0, (radius - wallOffset) * imperfection);
  };

  // ===== 1. BODEN - gewölbt mit dicker Glaskante =====
  points.push(new THREE.Vector2(0, 0));                    // Zentrum
  points.push(new THREE.Vector2(r(0.08, 1), 0.008));       // Bodenwölbung innen
  points.push(new THREE.Vector2(r(0.16, 2), 0.012));       // Bodenwölbung mitte
  points.push(new THREE.Vector2(r(0.22, 3), 0.018));       // Bodenwölbung außen
  points.push(new THREE.Vector2(r(0.26, 4), 0.025));       // Bodenkante Start
  points.push(new THREE.Vector2(r(0.27, 5), 0.035));       // Bodenkante - dick
  
  // ===== 2. UNTERER KÖRPER - breiter werdend =====
  points.push(new THREE.Vector2(r(0.28, 6), 0.06));
  points.push(new THREE.Vector2(r(0.29, 7), 0.10));
  points.push(new THREE.Vector2(r(0.30, 8), 0.15));
  points.push(new THREE.Vector2(r(0.31, 9), 0.20));
  
  // ===== 3. BAUCH - maximale Breite bei 35-45% Höhe =====
  points.push(new THREE.Vector2(r(0.315, 10), 0.25));
  points.push(new THREE.Vector2(r(0.32, 11), 0.30));       // MAX BREITE
  points.push(new THREE.Vector2(r(0.32, 12), 0.35));       // MAX BREITE gehalten
  points.push(new THREE.Vector2(r(0.315, 13), 0.40));
  
  // ===== 4. SCHULTER - deutliche Verjüngung =====
  points.push(new THREE.Vector2(r(0.30, 14), 0.44));
  points.push(new THREE.Vector2(r(0.28, 15), 0.48));
  points.push(new THREE.Vector2(r(0.26, 16), 0.52));
  points.push(new THREE.Vector2(r(0.245, 17), 0.55));      // Schulter-Ende
  
  // ===== 5. HALS - zylindrisch, kurz =====
  points.push(new THREE.Vector2(r(0.24, 18), 0.58));       // Hals Start
  points.push(new THREE.Vector2(r(0.24, 19), 0.62));       // Hals Mitte
  points.push(new THREE.Vector2(r(0.24, 20), 0.66));       // Hals Ende
  
  // ===== 6. SCHRAUBRAND - nur für äußeres Mesh =====
  if (!isInner) {
    // Übergang zum Rand
    points.push(new THREE.Vector2(0.245, 0.67));           // Leichte Ausweitung
    // Schraubrand-Wulst
    points.push(new THREE.Vector2(0.27, 0.68));            // Rand außen - Start
    points.push(new THREE.Vector2(0.28, 0.70));            // Rand außen - Mitte
    points.push(new THREE.Vector2(0.28, 0.73));            // Rand außen - oben
    // Oberkante
    points.push(new THREE.Vector2(0.26, 0.75));            // Abschrägung
    points.push(new THREE.Vector2(0.23, 0.76));            // Innenkante oben
    points.push(new THREE.Vector2(0.20, 0.765));           // Öffnung Rand
  } else {
    // Inneres endet vor dem Schraubrand
    points.push(new THREE.Vector2(r(0.22), 0.70));         // Innenkante
  }
  
  return new THREE.LatheGeometry(points, 48); // 48 radiale Segmente
}

// Erstelle Senf-Geometrie die zur neuen Glasform passt
function createSenfGeometry(fillLevel: number = 0.80) {
  const points: THREE.Vector2[] = [];
  // Senf füllt bis knapp unter die Schulter (bei ~0.50)
  const maxHeight = 0.50 * fillLevel;
  
  // Senf folgt der Innenform des Glases (mit Offset für Glasdicke)
  points.push(new THREE.Vector2(0, 0.04));                 // Zentrum
  points.push(new THREE.Vector2(0.08, 0.045));
  points.push(new THREE.Vector2(0.15, 0.05));
  points.push(new THREE.Vector2(0.22, 0.06));
  
  // Folgt dem Bauch (etwas kleiner als Glas-Innenradius)
  points.push(new THREE.Vector2(0.26, 0.10));
  points.push(new THREE.Vector2(0.28, 0.18));
  points.push(new THREE.Vector2(0.29, 0.28));
  points.push(new THREE.Vector2(0.29, 0.34));
  points.push(new THREE.Vector2(0.28, 0.38));
  
  // Oberfläche - leicht gewölbt
  points.push(new THREE.Vector2(0.26, maxHeight - 0.02));
  points.push(new THREE.Vector2(0.22, maxHeight));
  points.push(new THREE.Vector2(0.15, maxHeight + 0.01));
  points.push(new THREE.Vector2(0.08, maxHeight + 0.015));
  points.push(new THREE.Vector2(0, maxHeight + 0.018));    // Leichte Wölbung oben
  
  return new THREE.LatheGeometry(points, 48);
}

// Senfglas Component - Realistisches bauchiges Glas
function Senfglas({ senfWave }: { senfWave: number }) {
  const senfRef = useRef<THREE.Mesh>(null);
  const glassOuterRef = useRef<THREE.Mesh>(null);
  const glassInnerRef = useRef<THREE.Mesh>(null);

  // Memoize geometries
  const glassOuterGeom = React.useMemo(() => createSenfglasGeometry(false), []);
  const glassInnerGeom = React.useMemo(() => createSenfglasGeometry(true), []);
  const senfGeom = React.useMemo(() => createSenfGeometry(0.85), []);

  useFrame(() => {
    if (senfRef.current && senfWave > 0) {
      senfRef.current.scale.y = 1 + Math.sin(Date.now() * 0.01) * 0.02 * senfWave;
    }
  });

  // Glas steht auf dem Boden - minimal erhöht für bessere Sichtbarkeit
  const glasY = -0.89;

  // Süßer Senf Farben - BRAUN (nicht gelb!)
  // Süßer Senf ist dunkelbraun mit Honigtönen
  const senfBaseColor = '#8B5A2B';        // Dunkelbraun (Saddle Brown)
  const senfDarkerColor = '#6B4423';      // Noch dunkler für unten
  const senfSurfaceColor = '#9C6B30';     // Etwas heller für Oberfläche

  return (
    <group position={[1.3, glasY, 0]}>
      {/* ===== GLAS AUSSEN - Bauchige Form ===== */}
      {/* 
        LatheGeometry erstellt die realistische Senfglas-Silhouette:
        - Gewölbter Boden
        - Bauchiger Körper (max. Breite bei ~40% Höhe)
        - Verjüngung zum Hals
        - Schraubrand-Detail oben
        
        MeshPhysicalMaterial mit transmission für Glaseffekt
      */}
      <mesh ref={glassOuterRef} geometry={glassOuterGeom} castShadow>
        <meshPhysicalMaterial 
          color="#ffffff"
          transparent
          opacity={0.02}
          roughness={0.02}  
          metalness={0}
          transmission={0.99}
          thickness={0.5}
          ior={1.52}
          envMapIntensity={0.2}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* ===== GLAS INNEN - Für Glasdicke-Effekt ===== */}
      <mesh ref={glassInnerRef} geometry={glassInnerGeom}>
        <meshPhysicalMaterial 
          color="#ffffff"
          transparent
          opacity={0.01}
          roughness={0.02}
          metalness={0}
          transmission={0.995}
          thickness={0.2}
          ior={1.52}
          side={THREE.BackSide}
        />
      </mesh>

      {/* ===== GLASBODEN - Gewölbt, dicke Kante ===== */}
      <mesh position={[0, 0.02, 0]} rotation={[Math.PI, 0, 0]}>
        <circleGeometry args={[0.25, 32]} />
        <meshPhysicalMaterial 
          color="#ffffff"
          transparent
          opacity={0.02}
          roughness={0.02}
          transmission={0.98}
          thickness={0.05}
          ior={1.52}
        />
      </mesh>

      {/* ===== SÜSSER SENF ===== */}
      <mesh ref={senfRef} geometry={senfGeom} castShadow>
        <meshPhysicalMaterial 
          color={senfBaseColor}
          roughness={0.35}
          metalness={0}
          clearcoat={0.15}
          clearcoatRoughness={0.4}
        />
      </mesh>

      {/* Senf untere Schicht - volumetrischer Gradient */}
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.26, 0.22, 0.12, 32]} />
        <meshStandardMaterial 
          color={senfDarkerColor}
          roughness={0.45}
          metalness={0}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* ===== SENF OBERFLÄCHE ===== */}
      <mesh position={[0, 0.42, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.25, 32]} />
        <meshPhysicalMaterial 
          color={senfSurfaceColor}
          roughness={0.25}
          metalness={0}
          clearcoat={0.2}
          clearcoatRoughness={0.3}
        />
      </mesh>

      {/* ===== SCHRAUBRAND DETAIL ===== */}
      {/* Rillen am Schraubrand - 36 feine Rillen für realistisches Gewinde */}
      {[...Array(36)].map((_, i) => {
        const angle = (i / 36) * Math.PI * 2;
        return (
          <mesh 
            key={`thread-${i}`}
            position={[
              Math.cos(angle) * 0.275,
              0.705,
              Math.sin(angle) * 0.275
            ]}
            rotation={[0, -angle, 0]}
          >
            <boxGeometry args={[0.006, 0.04, 0.012]} />
            <meshStandardMaterial 
              color="#c8c8c8"
              roughness={0.25}
              metalness={0.75}
            />
          </mesh>
        );
      })}

      {/* Schraubrand-Ring - HORIZONTAL liegend */}
      <mesh position={[0, 0.705, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.275, 0.022, 12, 48]} />
        <meshPhysicalMaterial 
          color="#e5eaea"
          transparent
          opacity={0.35}
          roughness={0.08}
          transmission={0.75}
          ior={1.48}
        />
      </mesh>

      {/* Oberer Glasrand / Öffnung */}
      <mesh position={[0, 0.76, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.215, 0.012, 8, 32]} />
        <meshPhysicalMaterial 
          color="#e8f0f0"
          transparent
          opacity={0.45}
          roughness={0.06}
          transmission={0.7}
          ior={1.48}
        />
      </mesh>
    </group>
  );
}

// Einzelne Wurst auf dem Teller (mit Senf an der Spitze)
function TellerWurst({ index, total }: { index: number; total: number }) {
  // Würste fächerförmig auf dem Teller anordnen - FÜR GRÖSSEREN TELLER
  const angleSpread = 0.45; 
  const angle = ((index - (total - 1) / 2) * angleSpread);
  const radius = 0.35; // Größerer Radius für größeren Teller
  const xPos = Math.sin(angle) * radius;
  const zPos = Math.cos(angle) * 0.15 - 0.08;
  
  // Süßer Senf Farbe für die Spitze
  const senfColor = '#8B5A2B';
  
  return (
    <group 
      position={[xPos, 0.06, zPos]} 
      rotation={[-Math.PI / 2, angle * 0.8, 0]} // Flach auf dem Teller liegend
    >
      {/* Wurst Körper */}
      <mesh castShadow receiveShadow>
        <capsuleGeometry args={[0.05, 0.30, 16, 16]} />
        <meshPhysicalMaterial 
          color="#e8ddd4"
          roughness={0.6}
          metalness={0}
          clearcoat={0.08}
          clearcoatRoughness={0.5}
          sheen={0.2}
          sheenColor="#ffffff"
        />
      </mesh>
      
      {/* Wurst Ende oben (ohne Senf) */}
      <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshPhysicalMaterial 
          color="#d9cdc3"
          roughness={0.65}
          metalness={0}
          clearcoat={0.05}
        />
      </mesh>
      
      {/* Senf-Kappe an der Spitze - KOMPLETT bedeckt */}
      {/* Basis-Senf um die Spitze */}
      <mesh position={[0, -0.15, 0]}>
        <cylinderGeometry args={[0.055, 0.05, 0.08, 12]} />
        <meshStandardMaterial 
          color={senfColor}
          roughness={0.7}
          metalness={0}
        />
      </mesh>
      {/* Senf-Kuppe am Ende */}
      <mesh position={[0, -0.19, 0]}>
        <sphereGeometry args={[0.055, 12, 12]} />
        <meshStandardMaterial 
          color={senfColor}
          roughness={0.7}
          metalness={0}
        />
      </mesh>
    </group>
  );
}

// Einzelne Brezel hinter dem Teller
function TellerBrezel({ index, total }: { index: number; total: number }) {
  // Brezeln in einer Reihe hinter dem Teller anordnen
  const spacing = 0.25;
  const xPos = (index - (total - 1) / 2) * spacing;
  const zPos = 0.5; // Hinter dem Teller
  const yPos = 0.04;
  
  return (
    <group position={[xPos, yPos, zPos]} rotation={[Math.PI / 2, 0, Math.PI / 4]}>
      {/* Hauptring */}
      <mesh castShadow receiveShadow>
        <torusGeometry args={[0.08, 0.022, 12, 24]} />
        <meshPhysicalMaterial 
          color="#8B6914"
          roughness={0.7}
          metalness={0}
          clearcoat={0.15}
          clearcoatRoughness={0.6}
        />
      </mesh>

      {/* Gekreuzte Arme - links */}
      <mesh position={[-0.04, 0.05, 0.01]} rotation={[0, 0, -0.8]} castShadow receiveShadow>
        <cylinderGeometry args={[0.02, 0.025, 0.13, 12]} />
        <meshPhysicalMaterial 
          color="#7A5C10"
          roughness={0.75}
          metalness={0}
          clearcoat={0.12}
        />
      </mesh>

      {/* Gekreuzte Arme - rechts */}
      <mesh position={[0.04, 0.05, 0.01]} rotation={[0, 0, 0.8]} castShadow receiveShadow>
        <cylinderGeometry args={[0.02, 0.025, 0.13, 12]} />
        <meshPhysicalMaterial 
          color="#7A5C10"
          roughness={0.75}
          metalness={0}
          clearcoat={0.12}
        />
      </mesh>

      {/* Salzkörner */}
      {[...Array(12)].map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const radius = 0.08;
        return (
          <mesh 
            key={`salt-${i}`}
            position={[
              Math.cos(angle) * radius,
              Math.sin(angle) * radius,
              0.022
            ]}
          >
            <sphereGeometry args={[0.003, 4, 4]} />
            <meshStandardMaterial 
              color="#f8f8f8"
              roughness={0.3}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// Realistische Teller-Geometrie mit LatheGeometry
function createTellerGeometry(): THREE.LatheGeometry {
  // Profilkurve für einen flachen Keramikteller
  // SKALIERT: 1.8x größer für bessere Proportionen
  const scale = 1.8;
  const points: THREE.Vector2[] = [];
  
  // Bodenmitte (leicht konkav nach innen gewölbt) - Start bei kleinem Radius statt 0
  points.push(new THREE.Vector2(0.03 * scale, 0.002));     
  points.push(new THREE.Vector2(0.05 * scale, 0.001));     
  points.push(new THREE.Vector2(0.12 * scale, 0));          
  points.push(new THREE.Vector2(0.20 * scale, 0.001));     
  
  // Übergang zum Rand (sanfte Kurve nach oben)
  points.push(new THREE.Vector2(0.28 * scale, 0.003));     
  points.push(new THREE.Vector2(0.33 * scale, 0.008));     
  points.push(new THREE.Vector2(0.36 * scale, 0.015));     
  
  // Erhöhter Rand (Lip) - typisch für Weißwurstteller
  points.push(new THREE.Vector2(0.38 * scale, 0.025));     
  points.push(new THREE.Vector2(0.39 * scale, 0.032));     
  points.push(new THREE.Vector2(0.395 * scale, 0.036));    
  
  // Außenkante (leicht abgerundet)
  points.push(new THREE.Vector2(0.40 * scale, 0.034));     
  points.push(new THREE.Vector2(0.40 * scale, 0.028));     
  
  // Unterseite
  points.push(new THREE.Vector2(0.38 * scale, 0.020));     
  points.push(new THREE.Vector2(0.35 * scale, 0.008));     
  points.push(new THREE.Vector2(0.30 * scale, 0.003));     
  
  // Standring (typisch für Keramikteller)
  points.push(new THREE.Vector2(0.25 * scale, 0.002));     
  points.push(new THREE.Vector2(0.25 * scale, 0));          
  points.push(new THREE.Vector2(0.20 * scale, 0));          
  points.push(new THREE.Vector2(0.20 * scale, 0.001));     
  points.push(new THREE.Vector2(0.05 * scale, 0.001));     
  
  const geometry = new THREE.LatheGeometry(points, 64);
  geometry.computeVertexNormals();
  
  return geometry;
}

// Teller mit Würsten und Brezeln
function Teller({ wurstCount, brezelCount }: { wurstCount: number; brezelCount: number }) {
  // Maximal 6 Würste auf dem Teller anzeigen
  const displayCount = Math.min(wurstCount, 6);
  // Maximal 6 Brezeln hinter dem Teller anzeigen
  const displayBrezelCount = Math.min(brezelCount, 6);
  
  // Tischoberkante ist bei y = -0.9
  // Teller sitzt etwas höher auf dem Tisch
  const tableTop = -0.9;
  const tellerY = tableTop + 0.02; // Höher positioniert
  
  // Keramik-Material (einmal definieren)
  const ceramicColor = '#F5F5F5';  // Warmes Off-White
  
  // Memoized Geometrie
  const tellerGeom = React.useMemo(() => createTellerGeometry(), []);
  
  return (
    <group position={[0, tellerY, 0.2]}>
      {/* Hauptteller - LatheGeometry für realistische Form */}
      <mesh 
        geometry={tellerGeom}
        receiveShadow 
        castShadow
      >
        <meshPhysicalMaterial 
          color={ceramicColor}
          roughness={0.22}
          metalness={0}
          clearcoat={0.2}
          clearcoatRoughness={0.2}
          envMapIntensity={0.5}
        />
      </mesh>
      
      {/* Boden-Füllung um schwarzes Loch in der Mitte zu vermeiden */}
      <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.05 * 1.8, 32]} />
        <meshPhysicalMaterial 
          color={ceramicColor}
          roughness={0.22}
          metalness={0}
          clearcoat={0.2}
          clearcoatRoughness={0.2}
        />
      </mesh>
      
      {/* Würste auf dem Teller - höher positioniert */}
      <group position={[0, 0.01, 0]}>
        {[...Array(displayCount)].map((_, i) => (
          <TellerWurst key={i} index={i} total={displayCount} />
        ))}
      </group>
      
      {/* Brezeln hinter dem Teller */}
      {[...Array(displayBrezelCount)].map((_, i) => (
        <TellerBrezel key={`brezel-${i}`} index={i} total={displayBrezelCount} />
      ))}
      
      {/* Anzeige wenn mehr als 6 */}
      {wurstCount > 6 && (
        <mesh position={[0.30, 0.08, 0.30]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color="#d4a017" />
        </mesh>
      )}
    </group>
  );
}

// Holztisch mit realistischer Dielenoptik
function WoodTable() {
  // Holzfarben - EINHEITLICH HELL
  const woodBase = '#C4A574';      // Helles Holz
  const woodDark = '#B89860';      // Nur leicht dunkler für Maserung
  const fugenColor = '#8B7355';    // Hellere Fugen
  
  // Dielenbreite
  const dielenBreite = 0.8;
  const dielenAnzahl = 15;  // 15 * 0.8 = 12, deckt volle Breite ab
  const startX = -(dielenAnzahl / 2) * dielenBreite + dielenBreite / 2;
  
  return (
    <group>
      {/* Basis-Tischplatte */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.901, 0]}>
        <planeGeometry args={[12, 12]} />
        <meshBasicMaterial 
          color={woodBase}
        />
      </mesh>
      
      {/* Einzelne Holzdielen */}
      {[...Array(dielenAnzahl)].map((_, i) => {
        const xPos = startX + i * dielenBreite;
        // Alle Dielen gleiche helle Farbe
        const colorVariant = woodBase;
        
        return (
          <group key={`diele-${i}`}>
            {/* Diele selbst */}
            <mesh 
              rotation={[-Math.PI / 2, 0, 0]} 
              position={[xPos, -0.899, 0]}
            >
              <planeGeometry args={[dielenBreite - 0.02, 12]} />
              <meshBasicMaterial 
                color={colorVariant}
              />
            </mesh>
            
            {/* Maserungslinien auf jeder Diele */}
            {[0.15, 0.35, 0.55].map((offset, j) => (
              <mesh 
                key={`maserung-${i}-${j}`}
                rotation={[-Math.PI / 2, 0, 0]} 
                position={[xPos - dielenBreite/2 + offset * dielenBreite + (j * 0.05), -0.8985, 0]}
              >
                <planeGeometry args={[0.015 + (j % 2) * 0.01, 12]} />
                <meshStandardMaterial 
                  color={woodDark}
                  roughness={0.9}
                  transparent
                  opacity={0.25 + (j % 3) * 0.1}
                />
              </mesh>
            ))}
          </group>
        );
      })}
      
      {/* Fugen zwischen den Dielen */}
      {[...Array(dielenAnzahl - 1)].map((_, i) => (
        <mesh 
          key={`fuge-${i}`}
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[startX + (i + 0.5) * dielenBreite, -0.898, 0]}
        >
          <planeGeometry args={[0.025, 12]} />
          <meshBasicMaterial 
            color={fugenColor}
          />
        </mesh>
      ))}
    </group>
  );
}

// Main Scene
function Scene({ 
  hasActiveColleague, 
  wurstCount,
  brezelCount,
  onDipComplete, 
  onBrezelComplete,
  onNoSelection 
}: { 
  hasActiveColleague: boolean;
  wurstCount: number;
  brezelCount: number;
  onDipComplete: () => void;
  onBrezelComplete: () => void;
  onNoSelection: () => void;
}) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isBrezelAnimating, setIsBrezelAnimating] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [brezelAnimationProgress, setBrezelAnimationProgress] = useState(0);
  const [senfWave, setSenfWave] = useState(0);
  const animationRef = useRef<number | null>(null);
  const brezelAnimationRef = useRef<number | null>(null);
  
  // CRITICAL: useRef lock to prevent multiple increments
  const isDippingRef = useRef(false);
  const hasCalledCompleteRef = useRef(false);
  const isBrezelClickingRef = useRef(false);
  const hasCalledBrezelCompleteRef = useRef(false);

  const handleClick = useCallback(() => {
    // Double-check with ref (survives re-renders and StrictMode)
    if (isDippingRef.current || isAnimating) {
      return;
    }

    if (!hasActiveColleague) {
      onNoSelection();
      return;
    }

    // Set lock BEFORE anything else
    isDippingRef.current = true;
    hasCalledCompleteRef.current = false;
    
    setIsAnimating(true);
    setAnimationProgress(0);
    
    const startTime = Date.now();
    const duration = 1200; // 1.2 seconds

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
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
        // Animation complete - call onDipComplete EXACTLY ONCE
        if (!hasCalledCompleteRef.current) {
          hasCalledCompleteRef.current = true;
          onDipComplete();
        }
        
        setIsAnimating(false);
        setAnimationProgress(0);
        setSenfWave(0);
        
        // Release lock AFTER everything is done
        isDippingRef.current = false;
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [hasActiveColleague, isAnimating, onDipComplete, onNoSelection]);

  const handleBrezelClick = useCallback(() => {
    if (isBrezelClickingRef.current || isBrezelAnimating) {
      return;
    }

    if (!hasActiveColleague) {
      onNoSelection();
      return;
    }

    isBrezelClickingRef.current = true;
    hasCalledBrezelCompleteRef.current = false;
    
    setIsBrezelAnimating(true);
    setBrezelAnimationProgress(0);
    
    const startTime = Date.now();
    const duration = 800; // 0.8 seconds for brezel animation

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
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
  }, [hasActiveColleague, isBrezelAnimating, onBrezelComplete, onNoSelection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (brezelAnimationRef.current) {
        cancelAnimationFrame(brezelAnimationRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Ambient für Grundhelligkeit */}
      <ambientLight intensity={0.65} />
      
      {/* Key Light - Hauptlicht von schräg oben vorne */}
      <directionalLight 
        position={[3, 8, 4]} 
        intensity={1.2} 
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-bias={-0.0001}
      />
      
      {/* Fill Light - weicheres Licht von der Gegenseite */}
      <directionalLight 
        position={[-4, 5, -2]} 
        intensity={0.4} 
        color="#ffeedd"
      />
      
      {/* Rim Light - für Kantenbetannung */}
      <pointLight position={[0, 2, -4]} intensity={0.25} color="#ffffff" />
      
      <Weisswurst 
        isAnimating={isAnimating}
        animationProgress={animationProgress}
        onClick={handleClick}
      />
      <Brezel 
        isAnimating={isBrezelAnimating}
        animationProgress={brezelAnimationProgress}
        onClick={handleBrezelClick}
      />
      <Senfglas senfWave={senfWave} />
      <Teller wurstCount={wurstCount} brezelCount={brezelCount} />
      <WoodTable />
      
      <Environment preset="apartment" environmentIntensity={0.8} />
    </>
  );
}

// Fallback 2D component when WebGL is not available
function FallbackWurst({ 
  hasActiveColleague, 
  activeColleagueName,
  onDipComplete, 
  onNoSelection 
}: WurstSceneProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [position, setPosition] = useState({ y: 0, rotation: 0 });
  
  // Lock ref to prevent double-calls
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
    
    // Simple CSS animation
    let frame = 0;
    const animate = () => {
      frame++;
      const progress = frame / 60;
      
      if (progress < 0.5) {
        setPosition({ y: progress * 40, rotation: progress * 20 });
      } else if (progress < 1) {
        setPosition({ y: 40 - (progress - 0.5) * 80, rotation: 20 - (progress - 0.5) * 40 });
      } else {
        // Complete - call EXACTLY once
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
      {/* Wurst */}
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
      
      {/* Senf */}
      <div className={styles.senf}>🫙</div>
      
      {/* Hint */}
      <div className={styles.hint}>
        {hasActiveColleague ? (
          <span>🥨 Klick die Wurst für <strong>{activeColleagueName}</strong>!</span>
        ) : (
          <span>👆 Erst Person auswählen</span>
        )}
      </div>
    </div>
  );
}

export function WurstScene({ 
  hasActiveColleague, 
  activeColleagueName,
  wurstCount,
  brezelCount,
  onDipComplete,
  onBrezelComplete,
  onNoSelection 
}: WurstSceneProps) {
  const [webGLSupported, setWebGLSupported] = useState<boolean | null>(null);

  useEffect(() => {
    // Check WebGL support
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      setWebGLSupported(!!gl);
    } catch {
      setWebGLSupported(false);
    }
  }, []);

  // Show loading while checking
  if (webGLSupported === null) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingText}>Lädt...</div>
      </div>
    );
  }

  // Fallback for no WebGL
  if (!webGLSupported) {
    return (
      <FallbackWurst
        hasActiveColleague={hasActiveColleague}
        activeColleagueName={activeColleagueName}
        wurstCount={wurstCount}
        brezelCount={brezelCount}
        onDipComplete={onDipComplete}
        onBrezelComplete={onBrezelComplete}
        onNoSelection={onNoSelection}
      />
    );
  }

  return (
    <div className={styles.container}>
      <Canvas
        shadows="soft"
        camera={{ position: [0, 1.5, 4], fov: 40 }}
        gl={{ 
          antialias: true,
          powerPreference: 'high-performance',
          failIfMajorPerformanceCaveat: false,
        }}
        dpr={[1, 2]}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color('#e5e7eb'));
          // Soft shadows aktivieren
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
        />
      </Canvas>
      
      {/* Overlay hint */}
      <div className={styles.hint}>
        {hasActiveColleague ? (
          <span>🥨 Klick die Wurst oder 🥨 Brezel für <strong>{activeColleagueName}</strong>!</span>
        ) : (
          <span>👆 Erst Person auswählen</span>
        )}
      </div>
    </div>
  );
}
