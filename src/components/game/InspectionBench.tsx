import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface InspectionBenchProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  isInspecting?: boolean;
}

export function InspectionBench({
  position = [3.2, 0, 1.8],
  rotation = [0, -0.4, 0],
}: InspectionBenchProps) {
  const scanLaserRef = useRef<THREE.Mesh>(null);
  const scanLightRef = useRef<THREE.PointLight>(null);

  // Animated optical inspection laser sweep
  useFrame((state) => {
    if (scanLaserRef.current) {
      const sweep = Math.sin(state.clock.elapsedTime * 2.5);
      scanLaserRef.current.position.x = -0.55 + sweep * 0.16;
      scanLaserRef.current.rotation.z = sweep * 0.2;
    }
    if (scanLightRef.current) {
      scanLightRef.current.intensity = 1.0 + Math.sin(state.clock.elapsedTime * 6) * 0.4;
    }
  });

  return (
    <group name="inspection-bench" position={position} rotation={rotation}>
      {/* Heavy Workbench Table */}
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.0, 0.84, 1.0]} />
        <meshStandardMaterial color="#2d3139" roughness={0.6} metalness={0.4} />
      </mesh>

      {/* Titanium Work Surface Top */}
      <mesh position={[0, 0.86, 0]} receiveShadow>
        <boxGeometry args={[2.05, 0.05, 1.05]} />
        <meshStandardMaterial color="#c0c5ce" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Helmet Testing Collar (Left side) */}
      <mesh position={[-0.55, 0.94, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.24, 0.12, 16]} />
        <meshStandardMaterial color="#d4af37" metalness={0.85} roughness={0.25} />
      </mesh>
      {/* Gold Solar Visor Test Mockup */}
      <mesh position={[-0.55, 1.08, 0]} castShadow>
        <sphereGeometry args={[0.18, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#e5a93c" metalness={0.9} roughness={0.15} />
      </mesh>

      {/* Optical Inspection Articulated Scanner Arm */}
      <group position={[-0.55, 0.88, -0.3]}>
        <mesh position={[0, 0.25, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.025, 0.5, 8]} />
          <meshStandardMaterial color="#718096" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.5, 0.15]} rotation={[0.6, 0, 0]} castShadow>
          <cylinderGeometry args={[0.015, 0.015, 0.35, 8]} />
          <meshStandardMaterial color="#718096" metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Laser Emitter Head */}
        <mesh position={[0, 0.62, 0.3]}>
          <coneGeometry args={[0.05, 0.08, 12]} />
          <meshStandardMaterial color="#319795" metalness={0.7} />
        </mesh>
      </group>

      {/* Visible Sweeping Inspection Laser Line */}
      <mesh ref={scanLaserRef} position={[-0.55, 1.08, 0]}>
        <planeGeometry args={[0.015, 0.36]} />
        <meshBasicMaterial color="#00f5d4" transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>
      <pointLight
        ref={scanLightRef}
        position={[-0.55, 1.15, 0]}
        color="#00f5d4"
        intensity={1.2}
        distance={1.5}
      />

      {/* Glove & Boot Pressure Test Fixtures (Right side) */}
      <mesh position={[0.55, 0.96, -0.15]} castShadow>
        <boxGeometry args={[0.16, 0.16, 0.28]} />
        <meshStandardMaterial color="#4a5568" roughness={0.5} metalness={0.5} />
      </mesh>
      <mesh position={[0.55, 0.96, 0.2]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.16, 12]} />
        <meshStandardMaterial color="#4a5568" roughness={0.5} metalness={0.5} />
      </mesh>
    </group>
  );
}
