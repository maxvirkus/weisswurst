/**
 * Weisswurst Component
 * 
 * Realistische Weißwurst mit:
 * - TubeGeometry für gekrümmte Form
 * - Petersilienstücke
 * - Darmhaut-Ringe
 * - Dip-Animation zum Senfglas
 */

import { useRef, useMemo, useCallback } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';

interface WeisswurstProps {
  isAnimating: boolean;
  animationProgress: number;
  onClick: () => void;
  initAnimationProgress: number;
}

export function Weisswurst({ 
  isAnimating, 
  animationProgress,
  onClick,
  initAnimationProgress
}: WeisswurstProps) {
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
      // Wurst idle position: x=1.0, y=0.2, z=1.4
      const idleX = 1.0;
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
      // Interpolate X position during init (from 0.5 to 1.0)
      const initStartX = 0.5;
      const finalX = 1.0;
      groupRef.current.position.x = initStartX + (finalX - initStartX) * initAnimationProgress;
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
    const bits: { position: number[]; size: number; rotation: number[] }[] = [];
    const segmentsAlong = 12; // Anzahl Ringe entlang der Wurst
    const bitsPerRing = 6; // Petersilienstücke pro Ring
    
    for (let i = 0; i < segmentsAlong; i++) {
      // Gleichmäßige Position entlang der Kurve
      const t = 0.15 + (i / (segmentsAlong - 1)) * 0.7;
      const point = wurstCurve.getPoint(t);
      
      for (let j = 0; j < bitsPerRing; j++) {
        // Gleichmäßige Winkelverteilung um die Wurst - keine Spirale
        const angle = (j / bitsPerRing) * Math.PI * 2;
        const radius = 0.144; // Leicht über der Oberfläche (0.15 * 0.96)
        const offsetX = Math.cos(angle) * radius;
        const offsetZ = Math.sin(angle) * radius;
        
        bits.push({
          position: [point.x + offsetX, point.y, point.z + offsetZ],
          size: 0.006 + Math.random() * 0.002,
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

export default Weisswurst;
