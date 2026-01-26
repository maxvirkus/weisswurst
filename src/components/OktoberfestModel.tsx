import { useGLTF } from '@react-three/drei';
import { useEffect } from 'react';

/**
 * Helper Component zum Analysieren der oktoberfest.glb Struktur
 * Zeigt alle verfügbaren Objekte in der Console
 */
export function OktoberfestModelAnalyzer() {
  const { scene } = useGLTF('/oktoberfest.glb');

  useEffect(() => {
    console.log('=== Oktoberfest GLB Struktur ===');
    console.log('Scene:', scene);
    
    scene.traverse((child) => {
      if (child.type === 'Mesh' || child.type === 'Group') {
        console.log(`${child.type}: "${child.name}"`, {
          position: child.position,
          scale: child.scale,
          rotation: child.rotation,
        });
      }
    });
  }, [scene]);

  return <primitive object={scene} />;
}

/**
 * Einzelne Objekte aus der GLB extrahieren
 */
interface OktoberfestObjectProps {
  objectName: string; // Name des Objekts in der GLB
  position?: [number, number, number];
  scale?: number | [number, number, number];
  rotation?: [number, number, number];
}

export function OktoberfestObject({ 
  objectName, 
  position = [0, 0, 0], 
  scale = 1,
  rotation = [0, 0, 0]
}: OktoberfestObjectProps) {
  const { scene } = useGLTF('/oktoberfest.glb');
  
  // Finde das Objekt by name
  const object = scene.getObjectByName(objectName);

  if (!object) {
    console.warn(`Objekt "${objectName}" nicht gefunden in oktoberfest.glb`);
    return null;
  }

  return (
    <primitive 
      object={object.clone()} 
      position={position}
      scale={scale}
      rotation={rotation}
    />
  );
}

// Preload für bessere Performance
useGLTF.preload('/oktoberfest.glb');
