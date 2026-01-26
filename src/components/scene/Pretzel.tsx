/**
 * Pretzel (Brezel) Component
 * 
 * GLB-basierte Brezel mit:
 * - Klick-Animation (360° Rotation + Bounce)
 * - Idle-Float-Animation
 * - Init-Animation (Einflug von links)
 */

import { useRef, useMemo, useCallback } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface PretzelProps {
  isAnimating: boolean;
  animationProgress: number;
  onClick: () => void;
  initAnimationProgress: number;
}

export function Pretzel({ 
  isAnimating, 
  animationProgress,
  onClick,
  initAnimationProgress
}: PretzelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const brezelRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/pretzel.glb');
  
  // Store initial rotation to return to after animation
  const initialRotationY = Math.PI - 0.3;

  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onClick();
  }, [onClick]);

  useFrame(() => {
    if (!groupRef.current || !brezelRef.current) return;

    if (isAnimating) {
      const phase = animationProgress;
      
      // Smooth easing for entire animation
      const easeInOut = phase < 0.5 
        ? 2 * phase * phase 
        : 1 - Math.pow(-2 * phase + 2, 2) / 2;
      
      // Rotation: counter-clockwise (negative direction), full 360°
      brezelRef.current.rotation.y = initialRotationY - easeInOut * Math.PI * 2;
      
      // Smooth bounce: up and down in one fluid motion
      const bounce = Math.sin(phase * Math.PI) * 0.3;
      groupRef.current.position.y = -0.1 + bounce;
    } else {
      // Idle animation: gentle bounce (same as Wurst)
      // Interpolate X position during init (from -0.5 to -1.3)
      const initStartX = -0.5;
      const finalX = -1.3;
      groupRef.current.position.x = initStartX + (finalX - initStartX) * initAnimationProgress;
      groupRef.current.position.y = -0.1 + Math.sin(Date.now() * 0.002) * 0.05;
      groupRef.current.position.z = 1.2;
      // Reset rotation to initial value
      brezelRef.current.rotation.y = initialRotationY;
    }
  });

  // Clone scene und konvertiere Materials
  const clonedScene = useMemo(() => {
    const cloned = scene.clone();
    cloned.traverse((child) => {
      if (child.type === 'Mesh') {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        // Disable raycast on brezel meshes so they don't block other objects
        mesh.raycast = () => null;
        
        if (mesh.material && 'type' in mesh.material && mesh.material.type === 'MeshBasicMaterial') {
          const oldMat = mesh.material as THREE.MeshBasicMaterial;
          mesh.material = new THREE.MeshStandardMaterial({
            color: oldMat.color,
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
    <group ref={groupRef} position={[-1.3, -0.1, 1.2]}>
      <group ref={brezelRef} rotation={[Math.PI / 2, Math.PI - 0.3, 0]} scale={8.0}>
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

// Preload GLB für schnelleres Laden
useGLTF.preload('/pretzel.glb');

export default Pretzel;
