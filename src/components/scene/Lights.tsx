/**
 * Scene Lighting Components
 * 
 * Enthält alle Lichtquellen für die 3D-Szene:
 * - Key Light (Haupt-Sonnenlicht mit Schatten)
 * - Fill Light (weiches Aufhelllicht)
 * - Rim Light (Kantenlicht für Tiefe)
 * - Ambient Light (Grundhelligkeit)
 */

export function SceneLights() {
  return (
    <>
      {/* Key light - Warmes Sonnenlicht von oben rechts */}
      <directionalLight
        castShadow
        position={[5, 10, 5]}
        intensity={2.0}
        color="#fff5e6"
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0001}
        shadow-normalBias={0.02}
        shadow-radius={4}
      />
      
      {/* Fill light - Weiches Licht von links */}
      <directionalLight
        position={[-3, 5, 2]}
        intensity={0.6}
        color="#e8f0ff"
      />
      
      {/* Rim/Back light - Für Tiefe und Trennung */}
      <directionalLight
        position={[0, 3, -5]}
        intensity={0.4}
        color="#fff8f0"
      />
      
      {/* Ambient - Sanfte Grundhelligkeit */}
      <ambientLight intensity={0.5} color="#f5f0e8" />
    </>
  );
}

export default SceneLights;
