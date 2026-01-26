/**
 * Senfglas (Mustard Jar) Component
 * 
 * Realistisches bauchiges Senfglas im Händlmaier-Stil:
 * - LatheGeometry für die Glasform
 * - Süßer Senf (braun, nicht gelb!)
 * - Glaseffekt mit transmission
 * - Wellenanimation beim Dippen
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SenfglasProps {
  senfWave: number;
}

/**
 * Erstellt die bauchige Senfglas-Geometrie mit LatheGeometry
 * Händlmaier-Stil: Bauch → Schulter → deutlicher Hals → Schraubrand
 */
function createSenfglasGeometry(isInner: boolean = false): THREE.LatheGeometry {
  /*
    Proportionen für realistisches Senfglas:
    - Gesamthöhe: 0.80
    - Max. Radius (Bauch): 0.32
    - Hals-Radius: 0.24 (= 75% vom Bauch)
    - Höhe/Durchmesser-Verhältnis: 0.80 / 0.64 = 1.25:1
  */
  
  const wallOffset = isInner ? 0.025 : 0; // Glasdicke
  const points: THREE.Vector2[] = [];
  
  // Helper: Radius mit optionaler Imperfektion
  const r = (radius: number, seed: number = 0) => {
    const imperfection = seed > 0 ? (1 + Math.sin(seed * 17.53) * 0.004) : 1;
    return Math.max(0, (radius - wallOffset) * imperfection);
  };

  // ===== 1. BODEN - gewölbt mit dicker Glaskante =====
  points.push(new THREE.Vector2(0, 0));
  points.push(new THREE.Vector2(r(0.08, 1), 0.008));
  points.push(new THREE.Vector2(r(0.16, 2), 0.012));
  points.push(new THREE.Vector2(r(0.22, 3), 0.018));
  points.push(new THREE.Vector2(r(0.26, 4), 0.025));
  points.push(new THREE.Vector2(r(0.27, 5), 0.035));
  
  // ===== 2. UNTERER KÖRPER - breiter werdend =====
  points.push(new THREE.Vector2(r(0.28, 6), 0.06));
  points.push(new THREE.Vector2(r(0.29, 7), 0.10));
  points.push(new THREE.Vector2(r(0.30, 8), 0.15));
  points.push(new THREE.Vector2(r(0.31, 9), 0.20));
  
  // ===== 3. BAUCH - maximale Breite bei 35-45% Höhe =====
  points.push(new THREE.Vector2(r(0.315, 10), 0.25));
  points.push(new THREE.Vector2(r(0.32, 11), 0.30));
  points.push(new THREE.Vector2(r(0.32, 12), 0.35));
  points.push(new THREE.Vector2(r(0.315, 13), 0.40));
  
  // ===== 4. SCHULTER - deutliche Verjüngung =====
  points.push(new THREE.Vector2(r(0.30, 14), 0.44));
  points.push(new THREE.Vector2(r(0.28, 15), 0.48));
  points.push(new THREE.Vector2(r(0.26, 16), 0.52));
  points.push(new THREE.Vector2(r(0.245, 17), 0.55));
  
  // ===== 5. HALS - zylindrisch, kurz =====
  points.push(new THREE.Vector2(r(0.24, 18), 0.58));
  points.push(new THREE.Vector2(r(0.24, 19), 0.62));
  points.push(new THREE.Vector2(r(0.24, 20), 0.66));
  
  // ===== 6. SCHRAUBRAND - nur für äußeres Mesh =====
  if (!isInner) {
    points.push(new THREE.Vector2(0.245, 0.67));
    points.push(new THREE.Vector2(0.27, 0.68));
    points.push(new THREE.Vector2(0.28, 0.70));
    points.push(new THREE.Vector2(0.28, 0.73));
    points.push(new THREE.Vector2(0.26, 0.75));
    points.push(new THREE.Vector2(0.23, 0.76));
    points.push(new THREE.Vector2(0.20, 0.765));
  } else {
    points.push(new THREE.Vector2(r(0.22), 0.70));
  }
  
  return new THREE.LatheGeometry(points, 48);
}

/**
 * Erstellt die Senf-Geometrie passend zur Glasform
 */
function createSenfGeometry(fillLevel: number = 0.80): THREE.LatheGeometry {
  const points: THREE.Vector2[] = [];
  const maxHeight = 0.50 * fillLevel;
  
  points.push(new THREE.Vector2(0, 0.04));
  points.push(new THREE.Vector2(0.08, 0.045));
  points.push(new THREE.Vector2(0.15, 0.05));
  points.push(new THREE.Vector2(0.22, 0.06));
  points.push(new THREE.Vector2(0.26, 0.10));
  points.push(new THREE.Vector2(0.28, 0.18));
  points.push(new THREE.Vector2(0.29, 0.28));
  points.push(new THREE.Vector2(0.29, 0.34));
  points.push(new THREE.Vector2(0.28, 0.38));
  points.push(new THREE.Vector2(0.26, maxHeight - 0.02));
  points.push(new THREE.Vector2(0.22, maxHeight));
  points.push(new THREE.Vector2(0.15, maxHeight + 0.01));
  points.push(new THREE.Vector2(0.08, maxHeight + 0.015));
  points.push(new THREE.Vector2(0, maxHeight + 0.018));
  
  return new THREE.LatheGeometry(points, 48);
}

// Süßer Senf Farben - BRAUN (nicht gelb!)
const SENF_COLORS = {
  base: '#8B5A2B',      // Dunkelbraun (Saddle Brown)
  darker: '#6B4423',    // Noch dunkler für unten
  surface: '#9C6B30',   // Etwas heller für Oberfläche
} as const;

export function Senfglas({ senfWave }: SenfglasProps) {
  const senfRef = useRef<THREE.Mesh>(null);

  // Memoize geometries
  const glassOuterGeom = useMemo(() => createSenfglasGeometry(false), []);
  const glassInnerGeom = useMemo(() => createSenfglasGeometry(true), []);
  const senfGeom = useMemo(() => createSenfGeometry(0.85), []);

  useFrame(() => {
    if (senfRef.current && senfWave > 0) {
      senfRef.current.scale.y = 1 + Math.sin(Date.now() * 0.01) * 0.02 * senfWave;
    }
  });

  // Glas steht auf dem Boden - minimal erhöht für bessere Sichtbarkeit
  const glasY = -0.8;

  return (
    <group position={[1.9, glasY, 0.8]} scale={0.8}>
      {/* ===== GLAS AUSSEN - Bauchige Form ===== */}
      <mesh geometry={glassOuterGeom} castShadow>
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
      <mesh geometry={glassInnerGeom}>
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
          color={SENF_COLORS.base}
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
          color={SENF_COLORS.darker}
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
          color={SENF_COLORS.surface}
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

export default Senfglas;
