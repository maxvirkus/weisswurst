/**
 * Wood Table Component
 * 
 * Prozeduraler Holztisch mit Canvas-basierter Textur.
 * Erstellt eine realistische Holzmaserung ohne externe Assets.
 */

import { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Generiert eine realistische Holztextur mit Canvas
 */
function createWoodTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  
  // Basis-Holzfarbe (helles Eichenholz)
  ctx.fillStyle = '#deb887';
  ctx.fillRect(0, 0, 512, 512);
  
  // Holzmaserung
  for (let i = 0; i < 80; i++) {
    const y = Math.random() * 512;
    const width = 1 + Math.random() * 3;
    const alpha = 0.1 + Math.random() * 0.2;
    
    ctx.strokeStyle = `rgba(139, 90, 43, ${alpha})`;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(0, y);
    
    // Wellenförmige Linien für natürliche Maserung
    for (let x = 0; x < 512; x += 20) {
      const yOffset = Math.sin(x * 0.02 + Math.random()) * 5;
      ctx.lineTo(x, y + yOffset);
    }
    ctx.stroke();
  }
  
  // Jahresringe (subtile Kreise)
  for (let i = 0; i < 5; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const radius = 50 + Math.random() * 100;
    
    ctx.strokeStyle = `rgba(139, 90, 43, 0.1)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  
  return texture;
}

export function WoodTable() {
  const woodTexture = useMemo(() => createWoodTexture(), []);
  
  return (
    <mesh 
      receiveShadow 
      position={[0, -0.901, 0]} 
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={[12, 12]} />
      <meshStandardMaterial 
        map={woodTexture}
        roughness={0.8}
        metalness={0.0}
      />
    </mesh>
  );
}

export default WoodTable;
