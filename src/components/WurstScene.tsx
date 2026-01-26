import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { Environment, useGLTF } from '@react-three/drei';
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
    e.stopPropagation();
    onClick();
  }, [onClick]);

  useFrame(() => {
    if (!groupRef.current || !wurstRef.current) return;

    if (isAnimating) {
      const phase = animationProgress;
      
      // Positionen - Glas steht bei x=1.9, y=-0.8, z=0.8
      // Wurst idle position: x=0.8, y=0.2, z=1.4
      const idleX = 0.8;
      const idleY = 0.2;
      const idleZ = 1.4;
      const glasX = 1.9;     // Senfglas Position
      const glasZ = 0.8;     // Gleiche Z wie Glas-Mitte
      const dipY = -0.15;    // Eintauchtiefe - höher damit nicht durch Glasboden
      
      let x: number;
      let y: number;
      let z: number;
      let tilt: number;      // Leichte Neigung beim Eintauchen
      
      if (phase < 0.2) {
        // Phase 1: Leicht anheben von idle position
        const t = phase / 0.2;
        const easeT = 1 - Math.pow(1 - t, 3); // ease-out
        x = idleX;
        y = idleY + 0.3 * easeT;
        z = idleZ;
        tilt = 0;
      } else if (phase < 0.5) {
        // Phase 2: Bogen zum Glas - natürliche Kurve in X und Z
        const t = (phase - 0.2) / 0.3;
        const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // ease-in-out
        
        // Bogen-Bewegung: erst nach oben, dann nach unten
        const arcHeight = 0.4;
        const arcT = Math.sin(t * Math.PI); // 0 -> 1 -> 0
        
        x = idleX + (glasX - idleX) * easeT;
        y = (idleY + 0.3) + arcHeight * arcT - ((idleY + 0.3) - dipY) * easeT;
        z = idleZ + (glasZ - idleZ) * easeT;
        tilt = Math.sin(t * Math.PI) * 0.2; // Leichte Neigung während Flug
      } else if (phase < 0.65) {
        // Phase 3: Im Senf - kleine Bewegung
        const t = (phase - 0.5) / 0.15;
        x = glasX;
        y = dipY + Math.sin(t * Math.PI) * 0.03;
        z = glasZ;
        tilt = 0.2 - t * 0.2;
        // Squash effect
        const squash = 1 - Math.sin(t * Math.PI) * 0.08;
        wurstRef.current.scale.set(1, squash, 1);
      } else {
        // Phase 4: Zurück zur Idle-Position mit Bogen
        const t = (phase - 0.65) / 0.35;
        const easeT = 1 - Math.pow(1 - t, 3); // ease-out
        
        // Bogen zurück
        const arcHeight = 0.3;
        const arcT = Math.sin(t * Math.PI);
        
        x = glasX + (idleX - glasX) * easeT;
        y = dipY + (idleY - dipY) * easeT + arcHeight * arcT;
        z = glasZ + (idleZ - glasZ) * easeT;
        tilt = 0;
        wurstRef.current.scale.set(1, 1, 1);
      }
      
      groupRef.current.position.x = x;
      groupRef.current.position.y = y;
      groupRef.current.position.z = z;
      groupRef.current.rotation.z = tilt;
    } else {
      // Idle animation: gentle float
      groupRef.current.position.x = 0.8;
      groupRef.current.position.y = 0.2 + Math.sin(Date.now() * 0.002) * 0.05;
      groupRef.current.position.z = 1.4;
      groupRef.current.rotation.z = 0;
      wurstRef.current.scale.set(1, 1, 1);
    }
  });

  // Curved path for realistic Weisswurst shape
  const wurstCurve = useMemo(() => {
    return new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, -0.45, 0),     // Start (unten) - länger
      new THREE.Vector3(0.1, 0, 0),       // Control point (leichte Krümmung)
      new THREE.Vector3(0, 0.45, 0)       // End (oben) - länger
    );
  }, []);

  const tubeGeometry = useMemo(() => {
    return new THREE.TubeGeometry(wurstCurve, 64, 0.15, 32, false);
  }, [wurstCurve]);
  
  // Endpunkte der Kurve für seamless caps
  const startPoint = useMemo(() => wurstCurve.getPoint(0), [wurstCurve]);
  const endPoint = useMemo(() => wurstCurve.getPoint(1), [wurstCurve]);
  
  // Gemeinsames Material für seamless Übergänge
  const wurstMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: "#e8ddd4",
    roughness: 0.3,
    metalness: 0.1,
    clearcoat: 0.35,
    clearcoatRoughness: 0.2,
    sheen: 0.5,
    sheenColor: new THREE.Color("#ffffff"),
    reflectivity: 0.6
  }), []);

  // Petersilienstücke - gleichmäßig verteilt entlang der Wurst
  const parsleyBits = useMemo(() => {
    const bits = [];
    const segmentsAlong = 12; // Anzahl Ringe entlang der Wurst
    const bitsPerRing = 6; // Petersilienstücke pro Ring
    
    for (let i = 0; i < segmentsAlong; i++) {
      // Gleichmäßige Position entlang der Kurve
      const t = 0.15 + (i / (segmentsAlong - 1)) * 0.7;
      const point = wurstCurve.getPoint(t);
      
      for (let j = 0; j < bitsPerRing; j++) {
        // Gleichmäßige Winkelverteilung um die Wurst - keine Spirale
        const angle = (j / bitsPerRing) * Math.PI * 2; // Gerade vertikale Linien
        const radius = 0.144; // Leicht über der Oberfläche (0.15 * 0.96)
        const offsetX = Math.cos(angle) * radius;
        const offsetZ = Math.sin(angle) * radius;
        
        bits.push({
          position: [point.x + offsetX, point.y, point.z + offsetZ],
          size: 0.006 + Math.random() * 0.002, // Kleine, gleichmäßige Stücke
          rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]
        });
      }
    }
    return bits;
  }, [wurstCurve]);

  return (
    <group ref={groupRef} position={[1.2, 0.2, 0.7]}>
      <group ref={wurstRef}>
        {/* Click hitbox - große, einfache Box für zuverlässiges Clicking */}
        <mesh 
          onPointerDown={handlePointerDown}
          visible={false}
        >
          <boxGeometry args={[0.45, 1.1, 0.45]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>

        {/* Main sausage body - gekrümmt mit TubeGeometry */}
        <mesh 
          geometry={tubeGeometry} 
          material={wurstMaterial} 
          castShadow 
          receiveShadow 
          raycast={() => null}
        />
        
        {/* Subsurface scattering effect - inneres Leuchten */}
        <mesh geometry={tubeGeometry} raycast={() => null}>
          <meshStandardMaterial 
            color="#faf5f0"
            roughness={0.7}
            metalness={0}
            transparent
            opacity={0.2}
          />
        </mesh>

        {/* Wurst ends - nahtlos an Kurvenenden */}
        <mesh 
          position={[endPoint.x, endPoint.y, endPoint.z]} 
          material={wurstMaterial}
          castShadow 
          receiveShadow 
          raycast={() => null}
        >
          <sphereGeometry args={[0.15, 32, 32]} />
        </mesh>
        <mesh 
          position={[startPoint.x, startPoint.y, startPoint.z]} 
          material={wurstMaterial}
          castShadow 
          receiveShadow 
          raycast={() => null}
        >
          <sphereGeometry args={[0.15, 32, 32]} />
        </mesh>

        {/* Subtle ring marks - Darmhaut-Detail - entlang der Kurve */}
        {[0.2, 0.35, 0.5, 0.65, 0.8].map((t, i) => {
          const point = wurstCurve.getPoint(t);
          const tangent = wurstCurve.getTangent(t);
          const angle = Math.atan2(tangent.y, tangent.x) - Math.PI / 2;
          
          return (
            <mesh 
              key={i} 
              position={[point.x, point.y, point.z]} 
              rotation={[0, 0, angle]}
              raycast={() => null}
            >
              <torusGeometry args={[0.151, 0.005, 8, 32]} />
              <meshStandardMaterial 
                color="#d5c8be"
                roughness={0.7}
                metalness={0}
              />
            </mesh>
          );
        })}

        {/* Petersilienstücke - grüne Kräutersprenkel */}
        {parsleyBits.map((bit, i) => (
          <mesh 
            key={`parsley-${i}`}
            position={bit.position as [number, number, number]}
            rotation={bit.rotation as [number, number, number]}
            raycast={() => null}
            castShadow
          >
            <boxGeometry args={[bit.size, bit.size * 1.5, bit.size * 0.8]} />
            <meshStandardMaterial 
              color="#2d4a35"
              roughness={0.7}
              metalness={0}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// Brezel Component - links in der Szene
// Neue Brezel aus GLB
function BrezelGLB({ 
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
  const { scene } = useGLTF('/pretzel.glb');

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

  // Clone scene und konvertiere Materials
  const clonedScene = useMemo(() => {
    const cloned = scene.clone();
    cloned.traverse((child) => {
      if (child.type === 'Mesh') {
        // @ts-ignore
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        // Disable raycast on brezel meshes so they don't block other objects
        // @ts-ignore
        mesh.raycast = () => null;
        // @ts-ignore
        if (mesh.material?.type === 'MeshBasicMaterial') {
          // @ts-ignore
          const oldMat = mesh.material;
          mesh.material = new THREE.MeshStandardMaterial({
            // @ts-ignore
            color: oldMat.color,
            // @ts-ignore
            map: oldMat.map,
            roughness: 0.7,
            metalness: 0
          });
        }
      }
    });
    return cloned;
  }, [scene]);

  return (
    <group ref={groupRef} position={[-1.1, -0.1, 1.2]}>
      <group ref={brezelRef} rotation={[Math.PI / 2, 0, 0]} scale={8.0}>
        <primitive object={clonedScene} />
      </group>
      
      {/* Click hitbox - außerhalb der scale group */}
      <mesh 
        onPointerDown={handlePointerDown}
        visible={false}
      >
        <boxGeometry args={[0.6, 0.6, 0.3]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
}

// Preload GLB
useGLTF.preload('/pretzel.glb');

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
  const glasY = -0.8;

  // Süßer Senf Farben - BRAUN (nicht gelb!)
  // Süßer Senf ist dunkelbraun mit Honigtönen
  const senfBaseColor = '#8B5A2B';        // Dunkelbraun (Saddle Brown)
  const senfDarkerColor = '#6B4423';      // Noch dunkler für unten
  const senfSurfaceColor = '#9C6B30';     // Etwas heller für Oberfläche

  return (
    <group position={[1.9, glasY, 0.8]} scale={0.8}>
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
          color="#f0f8ff"
          transparent
          opacity={0.15}
          roughness={0.05}  
          metalness={0.02}
          transmission={0.85}
          thickness={0.8}
          ior={1.52}
          envMapIntensity={1.0}
          clearcoat={0.3}
          clearcoatRoughness={0.1}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* ===== GLAS INNEN - Für Glasdicke-Effekt ===== */}
      <mesh ref={glassInnerRef} geometry={glassInnerGeom}>
        <meshPhysicalMaterial 
          color="#f0f8ff"
          transparent
          opacity={0.08}
          roughness={0.05}
          metalness={0}
          transmission={0.9}
          thickness={0.3}
          ior={1.52}
          side={THREE.BackSide}
        />
      </mesh>

      {/* ===== GLASBODEN - Gewölbt, dicke Kante ===== */}
      <mesh position={[0, 0.02, 0]} rotation={[Math.PI, 0, 0]}>
        <circleGeometry args={[0.25, 32]} />
        <meshPhysicalMaterial 
          color="#f0f8ff"
          transparent
          opacity={0.12}
          roughness={0.05}
          transmission={0.88}
          thickness={0.1}
          ior={1.52}
          clearcoat={0.2}
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
  const zPos = Math.cos(angle) * 0.15 - 0.25; // Nach vorne verschoben
  
  // Süßer Senf Farbe für die Spitze
  const senfColor = '#8B5A2B';
  
  // Curved path - gleiche Form wie die klickbare Wurst, nur skaliert
  const wurstCurve = useMemo(() => {
    const scale = 0.45; // Skalierung für Teller-Wurst
    return new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, -0.35 * scale, 0),
      new THREE.Vector3(0.08 * scale, 0, 0),
      new THREE.Vector3(0, 0.35 * scale, 0)
    );
  }, []);

  const tubeGeometry = useMemo(() => {
    return new THREE.TubeGeometry(wurstCurve, 64, 0.065, 32, false);
  }, [wurstCurve]);
  
  const startPoint = useMemo(() => wurstCurve.getPoint(0), [wurstCurve]);
  const endPoint = useMemo(() => wurstCurve.getPoint(1), [wurstCurve]);
  
  const wurstMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: "#e8ddd4",
    roughness: 0.6,
    metalness: 0,
    clearcoat: 0.08,
    clearcoatRoughness: 0.5,
    sheen: 0.2,
    sheenColor: new THREE.Color("#ffffff")
  }), []);
  
  return (
    <group 
      position={[xPos, 0.06, zPos]} 
      rotation={[-Math.PI / 2, angle * 0.8, 0]}
    >
      {/* Wurst Körper - gekrümmt */}
      <mesh geometry={tubeGeometry} material={wurstMaterial} castShadow receiveShadow />
      
      {/* Subsurface scattering */}
      <mesh geometry={tubeGeometry}>
        <meshStandardMaterial 
          color="#faf5f0"
          roughness={0.7}
          metalness={0}
          transparent
          opacity={0.2}
        />
      </mesh>

      {/* Wurst Enden - seamless */}
      <mesh 
        position={[endPoint.x, endPoint.y, endPoint.z]} 
        material={wurstMaterial}
        castShadow 
        receiveShadow
      >
        <sphereGeometry args={[0.065, 32, 32]} />
      </mesh>
      <mesh 
        position={[startPoint.x, startPoint.y, startPoint.z]} 
        material={wurstMaterial}
        castShadow 
        receiveShadow
      >
        <sphereGeometry args={[0.065, 32, 32]} />
      </mesh>

      {/* Ring marks entlang der Kurve */}
      {[0.2, 0.35, 0.5, 0.65, 0.8].map((t, i) => {
        const point = wurstCurve.getPoint(t);
        const tangent = wurstCurve.getTangent(t);
        const angle = Math.atan2(tangent.y, tangent.x) - Math.PI / 2;
        
        return (
          <mesh 
            key={i} 
            position={[point.x, point.y, point.z]} 
            rotation={[0, 0, angle]}
          >
            <torusGeometry args={[0.066, 0.002, 8, 32]} />
            <meshStandardMaterial 
              color="#d5c8be"
              roughness={0.7}
              metalness={0}
            />
          </mesh>
        );
      })}
      
      {/* Senf-Kappe am unteren Ende - Ring + Spitze wie vorher */}
      <mesh position={[startPoint.x, startPoint.y - 0.045, startPoint.z]}>
        <cylinderGeometry args={[0.068, 0.063, 0.07, 16]} />
        <meshStandardMaterial 
          color={senfColor}
          roughness={0.7}
          metalness={0}
        />
      </mesh>
      <mesh position={[startPoint.x, startPoint.y - 0.08, startPoint.z]}>
        <sphereGeometry args={[0.068, 16, 16]} />
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
// Einzelne Brezel hinter dem Teller - GLB Version
function TellerBrezel({ index, total }: { index: number; total: number }) {
  const { scene } = useGLTF('/pretzel.glb');
  
  // Brezeln in einer Reihe hinter dem Teller anordnen - größerer Spacing wegen größerer Brezeln
  const spacing = 0.5;
  const xPos = (index - (total - 1) / 2) * spacing;
  const zPos = 0.5; // Hinter dem Teller
  const yPos = 0.1; // Höher wegen größerer Brezel
  
  // Clone scene und konvertiere Materials
  const clonedScene = useMemo(() => {
    const cloned = scene.clone();
    cloned.traverse((child) => {
      if (child.type === 'Mesh') {
        // @ts-expect-error - THREE types
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        // @ts-expect-error - THREE types
        if (mesh.material?.type === 'MeshBasicMaterial') {
          // @ts-expect-error - THREE types
          const oldMat = mesh.material;
          mesh.material = new THREE.MeshStandardMaterial({
            // @ts-expect-error - THREE types
            color: oldMat.color,
            // @ts-expect-error - THREE types
            map: oldMat.map,
            roughness: 0.7,
            metalness: 0
          });
        }
      }
    });
    return cloned;
  }, [scene]);
  
  return (
    <group position={[xPos, yPos, zPos]}>
      <group rotation={[0, Math.PI, 0]}>
        <primitive object={clonedScene} scale={3.1} />
      </group>
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
    <group position={[0, tellerY, -1.3]} scale={1.5}>
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
        <meshStandardMaterial 
          color={woodBase}
          roughness={0.8}
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
              <meshStandardMaterial 
                color={colorVariant}
                roughness={0.8}
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
          <meshStandardMaterial 
            color={fugenColor}
            roughness={0.9}
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
  const [isInitMode, setIsInitMode] = useState(true);
  const [initAnimationProgress, setInitAnimationProgress] = useState(0);
  const animationRef = useRef<number | null>(null);
  const brezelAnimationRef = useRef<number | null>(null);
  const initAnimationRef = useRef<number | null>(null);
  
  // CRITICAL: useRef lock to prevent multiple increments
  const isDippingRef = useRef(false);
  const hasCalledCompleteRef = useRef(false);
  const isBrezelClickingRef = useRef(false);
  const hasCalledBrezelCompleteRef = useRef(false);

  // Camera animation component
  function CameraAnimation({ progress }: { progress: number }) {
    const { camera } = useThree();
    
    useFrame(() => {
      if (progress === 0) {
        // Initial position - show both wurst and brezel centered
        camera.position.set(0, 1.8, 3.5);
        camera.lookAt(0, 0, 0.8);
      } else if (progress < 1) {
        // Smooth transition
        const t = progress;
        const easeT = 1 - Math.pow(1 - t, 3); // ease-out cubic
        
        // Interpolate position
        const startPos = { x: 0, y: 1.8, z: 3.5 };
        const endPos = { x: 0, y: 1.5, z: 4 };
        
        camera.position.x = startPos.x + (endPos.x - startPos.x) * easeT;
        camera.position.y = startPos.y + (endPos.y - startPos.y) * easeT;
        camera.position.z = startPos.z + (endPos.z - startPos.z) * easeT;
        
        // Interpolate lookAt target
        const startLookAt = { x: 0, y: 0, z: 0.8 };
        const endLookAt = { x: 0, y: 0, z: 0 };
        
        const lookAtX = startLookAt.x + (endLookAt.x - startLookAt.x) * easeT;
        const lookAtY = startLookAt.y + (endLookAt.y - startLookAt.y) * easeT;
        const lookAtZ = startLookAt.z + (endLookAt.z - startLookAt.z) * easeT;
        
        camera.lookAt(lookAtX, lookAtY, lookAtZ);
      } else {
        // Final position
        camera.position.set(0, 1.5, 4);
        camera.lookAt(0, 0, 0);
      }
    });
    
    return null;
  }

  const handleClick = useCallback(() => {
    // If in init mode, check if we have active colleague first
    if (isInitMode) {
      if (!hasActiveColleague) {
        onNoSelection();
        return;
      }
      
      // Start init animation, then automatically trigger dip animation
      setIsInitMode(false);
      const startTime = Date.now();
      const duration = 1500; // 1.5 seconds for scene transition
      
      const animateInit = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        setInitAnimationProgress(progress);
        
        if (progress < 1) {
          initAnimationRef.current = requestAnimationFrame(animateInit);
        } else {
          setInitAnimationProgress(1);
          // After init animation completes, trigger the dip animation
          setTimeout(() => {
            if (!isDippingRef.current) {
              isDippingRef.current = true;
              hasCalledCompleteRef.current = false;
              setIsAnimating(true);
              setAnimationProgress(0);
              
              const dipStartTime = Date.now();
              const dipDuration = 1200;
              
              const animateDip = () => {
                const elapsed = Date.now() - dipStartTime;
                const progress = Math.min(elapsed / dipDuration, 1);
                
                setAnimationProgress(progress);
                
                if (progress > 0.45 && progress < 0.75) {
                  setSenfWave(1 - Math.abs(progress - 0.6) * 5);
                } else {
                  setSenfWave(0);
                }

                if (progress < 1) {
                  animationRef.current = requestAnimationFrame(animateDip);
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
              
              animationRef.current = requestAnimationFrame(animateDip);
            }
          }, 100);
        }
      };
      
      initAnimationRef.current = requestAnimationFrame(animateInit);
      return;
    }
    
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
  }, [hasActiveColleague, isAnimating, onDipComplete, onNoSelection, isInitMode]);

  const handleBrezelClick = useCallback(() => {
    // If in init mode, check if we have active colleague first
    if (isInitMode) {
      if (!hasActiveColleague) {
        onNoSelection();
        return;
      }
      
      // Start init animation, then automatically trigger brezel animation
      setIsInitMode(false);
      const startTime = Date.now();
      const duration = 1500; // 1.5 seconds for scene transition
      
      const animateInit = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        setInitAnimationProgress(progress);
        
        if (progress < 1) {
          initAnimationRef.current = requestAnimationFrame(animateInit);
        } else {
          setInitAnimationProgress(1);
          // After init animation completes, trigger the brezel animation
          setTimeout(() => {
            if (!isBrezelClickingRef.current) {
              isBrezelClickingRef.current = true;
              hasCalledBrezelCompleteRef.current = false;
              setIsBrezelAnimating(true);
              setBrezelAnimationProgress(0);
              
              const brezelStartTime = Date.now();
              const brezelDuration = 800;

              const animateBrezel = () => {
                const elapsed = Date.now() - brezelStartTime;
                const progress = Math.min(elapsed / brezelDuration, 1);
                
                setBrezelAnimationProgress(progress);

                if (progress < 1) {
                  brezelAnimationRef.current = requestAnimationFrame(animateBrezel);
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

              brezelAnimationRef.current = requestAnimationFrame(animateBrezel);
            }
          }, 100);
        }
      };
      
      initAnimationRef.current = requestAnimationFrame(animateInit);
      return;
    }
    
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
  }, [hasActiveColleague, isBrezelAnimating, onBrezelComplete, onNoSelection, isInitMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (brezelAnimationRef.current) {
        cancelAnimationFrame(brezelAnimationRef.current);
      }
      if (initAnimationRef.current) {
        cancelAnimationFrame(initAnimationRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Camera animation during init */}
      <CameraAnimation progress={isInitMode ? 0 : initAnimationProgress} />
      
      {/* Ambient für Grundhelligkeit */}
      <ambientLight intensity={0.9} />
      
      {/* Key Light */}
      <directionalLight 
        position={[3, 8, 4]} 
        intensity={1.5} 
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
      
      {/* Fill Light */}
      <directionalLight 
        position={[-4, 5, -2]} 
        intensity={0.7} 
        color="#ffeedd"
      />
      
      <Weisswurst 
        isAnimating={isAnimating}
        animationProgress={animationProgress}
        onClick={handleClick}
      />
      <BrezelGLB 
        isAnimating={isBrezelAnimating}
        animationProgress={brezelAnimationProgress}
        onClick={handleBrezelClick}
      />
      
      {/* Objects that appear after initialization with fly-in animation */}
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
          <WoodTable />
        </group>
      )}
      
      {/* Sky and clouds - always visible */}
      <mesh>
        <sphereGeometry args={[50, 32, 32]} />
        <meshStandardMaterial 
          color="#87CEEB"
          roughness={0.9}
          metalness={0.0}
          side={THREE.BackSide}
        />
      </mesh>
      
      {/* Wolken als separate Spheres */}
      {[
        { pos: [15, 20, -30], scale: [8, 3, 5] },
        { pos: [-20, 18, -25], scale: [10, 4, 6] },
        { pos: [10, 25, -35], scale: [6, 2, 4] },
        { pos: [-15, 22, -28], scale: [7, 3, 4] },
        { pos: [25, 19, -32], scale: [9, 3, 5] },
        { pos: [-8, 24, -30], scale: [5, 2, 3] }
      ].map((cloud, i) => (
        <mesh key={`cloud-${i}`} position={cloud.pos as [number, number, number]} scale={cloud.scale as [number, number, number]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial 
            color="#ffffff"
            roughness={0.95}
            metalness={0.0}
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}
      
      <Environment preset="apartment" environmentIntensity={0.6} />
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
          <span>Klick die Wurst für <strong>{activeColleagueName}</strong>!</span>
        ) : (
          <span>Erst Person auswählen</span>
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
          <span>Klick die Wurst oder Brezel für <strong>{activeColleagueName}</strong>!</span>
        ) : (
          <span>Erst Person auswählen</span>
        )}
      </div>
    </div>
  );
}
