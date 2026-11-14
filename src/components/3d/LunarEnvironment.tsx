import { useGLTF, Stars } from '@react-three/drei';

// Pre-configure local Draco decoding path
useGLTF.setDecoderPath('/draco/gltf/');

export function LunarEnvironment() {
  // Load moon_small.glb for celestial orbital backdrop
  const { scene: moonScene } = useGLTF('/models/moon_small.glb');

  return (
    <>
      {/* Deep space black void */}
      <color attach="background" args={['#010204']} />

      {/* Realistic unattenuated starfield */}
      <Stars
        radius={160}
        depth={60}
        count={4000}
        factor={3.5}
        saturation={0}
        fade={false}
        speed={0}
      />

      {/* Harsh, unfiltered directional solar illumination */}
      <directionalLight
        position={[60, 48, 38]}
        intensity={3.2}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={220}
        shadow-camera-left={-45}
        shadow-camera-right={45}
        shadow-camera-top={45}
        shadow-camera-bottom={-45}
        shadow-bias={-0.0004}
      />

      {/* Earthshine fill light (soft cool blue-grey) */}
      <ambientLight intensity={0.32} color="#182233" />

      {/* Subtle secondary bounce from illuminated lunar regolith */}
      <hemisphereLight
        color="#ffffff"
        groundColor="#1c1f24"
        intensity={0.18}
      />

      {/* Distant celestial orb in the black sky (moon_small.glb) */}
      <group position={[95, 75, -120]} scale={[4.5, 4.5, 4.5]}>
        <primitive object={moonScene} />
      </group>
    </>
  );
}

useGLTF.preload('/models/moon_small.glb');
