import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';

interface MarkerProps {
  position: [number, number, number];
  radius?: number;
  isCurrentObjective?: boolean;
  isPlayerInRange?: boolean;
  label?: string;
  color?: string;
}

export function InteractiveStationMarker({
  position,
  radius = 2.0,
  isCurrentObjective = true,
  isPlayerInRange = false,
  label,
  color,
}: MarkerProps) {
  const ringRef = useRef<THREE.Mesh>(null);
  const beaconRef = useRef<THREE.Group>(null);
  const verticalBeamRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * (isPlayerInRange ? 1.5 : 0.6);
    }
    if (beaconRef.current) {
      beaconRef.current.position.y =
        position[1] + 2.2 + Math.sin(state.clock.elapsedTime * 2.5) * 0.12;
      beaconRef.current.rotation.y += delta * 1.2;
    }
    if (verticalBeamRef.current) {
      const mat = verticalBeamRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = 0.25 + Math.sin(state.clock.elapsedTime * 3.0) * 0.1;
      }
    }
  });

  const markerColor =
    color ||
    (isPlayerInRange
      ? '#4ecdc4' // Bright cyan when ready to interact
      : isCurrentObjective
      ? '#e5a93c' // Amber for active objective
      : '#718096'); // Muted grey for completed/inactive

  return (
    <group position={position}>
      {/* 1. Ground Projection Target Ring */}
      <mesh
        ref={ringRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.04, 0]}
      >
        <ringGeometry args={[radius * 0.85, radius, 32]} />
        <meshBasicMaterial
          color={markerColor}
          transparent
          opacity={isPlayerInRange ? 0.85 : 0.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 2. Concentric Inner Pulse Ring */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.045, 0]}
      >
        <ringGeometry args={[radius * 0.35, radius * 0.42, 24]} />
        <meshBasicMaterial
          color={markerColor}
          transparent
          opacity={isPlayerInRange ? 0.9 : 0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 3. Skyward Vertical Beacon Beam */}
      <mesh
        ref={verticalBeamRef}
        position={[0, position[1] + 6.0, 0]}
      >
        <cylinderGeometry args={[0.06, 0.18, 12, 16]} />
        <meshBasicMaterial
          color={markerColor}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 4. Floating Animated 3D Waypoint Diamond */}
      <group ref={beaconRef} position={[0, position[1] + 2.2, 0]}>
        <mesh>
          <octahedronGeometry args={[0.22, 0]} />
          <meshBasicMaterial
            color={markerColor}
            wireframe
          />
        </mesh>
        <mesh scale={[0.5, 0.5, 0.5]}>
          <octahedronGeometry args={[0.22, 0]} />
          <meshBasicMaterial color={markerColor} />
        </mesh>
      </group>

      {/* 5. 3D Billboard Label for Clear Objective Identification */}
      {label && (
        <Billboard position={[0, position[1] + 2.8, 0]}>
          <Text
            fontSize={0.24}
            color={markerColor}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.03}
            outlineColor="#0b0f19"
          >
            {label.toUpperCase()}
          </Text>
        </Billboard>
      )}
    </group>
  );
}
