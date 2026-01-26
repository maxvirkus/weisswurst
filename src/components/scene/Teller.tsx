/**
 * Teller (Plate) Component
 * 
 * Weißer Porzellanteller mit:
 * - Würsten (mit Senfkappe)
 * - Brezeln dahinter
 */

import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// ============================================================
// Einzelne Wurst auf dem Teller
// ============================================================

interface TellerWurstProps {
  index: number;
  total: number;
}

function TellerWurst({ index, total }: TellerWurstProps) {
  // Würste fächerförmig auf dem Teller anordnen
  const angleSpread = 0.45; 
  const angle = ((index - (total - 1) / 2) * angleSpread);
  const radius = 0.35;
  const xPos = Math.sin(angle) * radius;
  const zPos = Math.cos(angle) * 0.15 - 0.25;
  
  // Süßer Senf Farbe für die Spitze
  const senfColor = '#8B5A2B';
  
  // Curved path - gleiche Form wie die klickbare Wurst, nur skaliert
  const wurstCurve = useMemo(() => {
    const scale = 0.45;
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
        const ringAngle = Math.atan2(tangent.y, tangent.x) - Math.PI / 2;
        
        return (
          <mesh 
            key={i} 
            position={[point.x, point.y, point.z]} 
            rotation={[0, 0, ringAngle]}
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
      
      {/* Senf-Kappe am unteren Ende */}
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

// ============================================================
// Einzelne Brezel hinter dem Teller
// ============================================================

interface TellerBrezelProps {
  index: number;
  total: number;
}

function TellerBrezel({ index, total }: TellerBrezelProps) {
  const { scene } = useGLTF('/pretzel.glb');
  
  // Brezeln in einer Reihe hinter dem Teller
  const spacing = 0.5;
  const xPos = (index - (total - 1) / 2) * spacing;
  const zPos = 0.5;
  const yPos = 0.1;
  
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
    <group position={[xPos, yPos, zPos]}>
      <group rotation={[0, Math.PI, 0]}>
        <primitive object={clonedScene} scale={3.1} />
      </group>
    </group>
  );
}

// ============================================================
// Main Teller Component
// ============================================================

interface TellerProps {
  wurstCount: number;
  brezelCount: number;
}

export function Teller({ wurstCount, brezelCount }: TellerProps) {
  const { scene } = useGLTF('/plate.glb');
  
  // Maximal 6 Würste/Brezeln anzeigen
  const displayCount = Math.min(wurstCount, 6);
  const displayBrezelCount = Math.min(brezelCount, 6);
  
  // Tischoberkante ist bei y = -0.9
  const tableTop = -0.9;
  const tellerY = tableTop + 0.12;
  
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
            color: 0xffffff,
            map: oldMat.map,
            roughness: 0.22,
            metalness: 0,
            clearcoat: 0.2,
            clearcoatRoughness: 0.2
          });
        }
      }
    });
    return cloned;
  }, [scene]);
  
  return (
    <>
      {/* Teller GLB */}
      <group position={[0, tellerY, -1.3]} scale={3.0}>
        <primitive object={clonedScene} />
      </group>
      
      {/* Würste auf dem Teller */}
      <group position={[0, tellerY + 0.01, -1.4]} scale={1.5}>
        {[...Array(displayCount)].map((_, i) => (
          <TellerWurst key={i} index={i} total={displayCount} />
        ))}
      </group>
      
      {/* Brezeln hinter dem Teller */}
      <group position={[0, tellerY, -1.5]} scale={1.5}>
        {[...Array(displayBrezelCount)].map((_, i) => (
          <TellerBrezel key={`brezel-${i}`} index={i} total={displayBrezelCount} />
        ))}
      </group>
    </>
  );
}

// Preload
useGLTF.preload('/plate.glb');

export default Teller;
