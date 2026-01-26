/**
 * Scene Props Components
 * 
 * Dekorative Elemente für die Szene:
 * - BeerBottle: Bierflasche mit Easter-Egg
 * - Cutlery: Besteck (Gabel/Messer)
 * - Sky: Himmel mit Wolken
 */

import { useState, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// ============================================================
// Beer Bottle Component
// ============================================================

interface BeerBottleProps {
  onClick?: () => void;
}

export function BeerBottle({ onClick }: BeerBottleProps) {
  const { scene } = useGLTF('/german_beer_bottle_with_crown_cap.glb');
  const [hovered, setHovered] = useState(false);
  
  // Clone scene und konvertiere Materials
  const clonedScene = useMemo(() => {
    const cloned = scene.clone();
    cloned.traverse((child) => {
      if (child.type === 'Mesh') {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (mesh.material && !Array.isArray(mesh.material) && mesh.material.type === 'MeshBasicMaterial') {
          const oldMat = mesh.material as THREE.MeshBasicMaterial;
          mesh.material = new THREE.MeshPhysicalMaterial({
            color: oldMat.color,
            map: oldMat.map,
            roughness: 0.15,
            metalness: 0.4,
            clearcoat: 0.6,
            clearcoatRoughness: 0.1,
            reflectivity: 0.8,
            transparent: false,
            opacity: 1.0
          });
        }
      }
    });
    return cloned;
  }, [scene]);
  
  return (
    <group 
      position={[1.3, -0.85, -2.0]} 
      rotation={[0, -0.4, 0]} 
      scale={hovered ? 5.1 : 5.0}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <primitive object={clonedScene} />
    </group>
  );
}

// Preload
useGLTF.preload('/german_beer_bottle_with_crown_cap.glb');

// ============================================================
// Cutlery Component
// ============================================================

export function Cutlery() {
  const { scene } = useGLTF('/metal_cutlery.glb');
  
  // Clone für Besteck rechts
  const cutlery = useMemo(() => {
    const cloned = scene.clone();
    cloned.traverse((child) => {
      if (child.type === 'Mesh') {
        const mesh = child as THREE.Mesh;
        const meshName = mesh.name.toLowerCase();
        
        // Löffel verstecken
        if (meshName.includes('spoon') || meshName.includes('löffel') || meshName.includes('loeffel')) {
          mesh.visible = false;
        } else {
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.visible = true;
          
          mesh.material = new THREE.MeshPhysicalMaterial({
            color: '#C0C0C0',
            roughness: 0.2,
            metalness: 0.9,
            clearcoat: 0.3,
            reflectivity: 0.9
          });
        }
      }
    });
    return cloned;
  }, [scene]);
  
  return (
    <>
      {/* Besteck rechts vom Teller - größer */}
      <group position={[1.3, -0.83, -1.0]} rotation={[Math.PI / 2, Math.PI, Math.PI]} scale={3.0}>
        <primitive object={cutlery} />
      </group>
    </>
  );
}

// Preload
useGLTF.preload('/metal_cutlery.glb');

// ============================================================
// Sky & Clouds Component
// ============================================================

const CLOUD_POSITIONS = [
  { pos: [15, 20, -30] as [number, number, number], scale: [8, 3, 5] as [number, number, number] },
  { pos: [-20, 18, -25] as [number, number, number], scale: [10, 4, 6] as [number, number, number] },
  { pos: [10, 25, -35] as [number, number, number], scale: [6, 2, 4] as [number, number, number] },
  { pos: [-15, 22, -28] as [number, number, number], scale: [7, 3, 4] as [number, number, number] },
  { pos: [25, 19, -32] as [number, number, number], scale: [9, 3, 5] as [number, number, number] },
  { pos: [-8, 24, -30] as [number, number, number], scale: [5, 2, 3] as [number, number, number] }
];

export function Sky() {
  return (
    <>
      {/* Sky Sphere */}
      <mesh>
        <sphereGeometry args={[50, 32, 32]} />
        <meshStandardMaterial 
          color="#87CEEB"
          roughness={0.9}
          metalness={0.0}
          side={THREE.BackSide}
        />
      </mesh>
      
      {/* Clouds */}
      {CLOUD_POSITIONS.map((cloud, i) => (
        <mesh 
          key={`cloud-${i}`} 
          position={cloud.pos} 
          scale={cloud.scale}
        >
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
    </>
  );
}

export default { BeerBottle, Cutlery, Sky };
