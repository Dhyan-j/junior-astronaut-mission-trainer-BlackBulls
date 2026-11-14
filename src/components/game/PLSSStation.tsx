import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ProceduralPLSSModel } from './ProceduralPLSSModel';

interface PLSSStationProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  isPLSSInstalledOnPlayer?: boolean;
}

export function PLSSStation({
  position = [-3.0, 0, 3.5],
  rotation = [0, 0.35, 0],
  isPLSSInstalledOnPlayer = false,
}: PLSSStationProps) {
  const gantryBeaconLightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (gantryBeaconLightRef.current) {
      gantryBeaconLightRef.current.intensity =
        0.8 + Math.sin(state.clock.elapsedTime * 3) * 0.3;
    }
  });

  return (
    <group name="plss-equipment-station" position={position} rotation={rotation}>
      {/* Base Staging Platform */}
      <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 0.16, 2.0]} />
        <meshStandardMaterial color="#272a33" roughness={0.7} metalness={0.3} />
      </mesh>

      {/* Yellow/Black hazard border */}
      <mesh position={[0, 0.17, 0.95]}>
        <boxGeometry args={[2.3, 0.02, 0.06]} />
        <meshStandardMaterial color="#e5a93c" roughness={0.4} />
      </mesh>

      {/* Servicing Gantry Arch */}
      <mesh position={[-0.95, 1.1, -0.4]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 2.2, 12]} />
        <meshStandardMaterial color="#718096" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0.95, 1.1, -0.4]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 2.2, 12]} />
        <meshStandardMaterial color="#718096" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 2.18, -0.4]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 1.94, 12]} />
        <meshStandardMaterial color="#718096" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Overhead Servicing Hoist Winch */}
      <mesh position={[0, 2.05, -0.4]} castShadow>
        <boxGeometry args={[0.3, 0.18, 0.22]} />
        <meshStandardMaterial color="#d69e2e" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Servicing Rig Resting Stand */}
      <mesh position={[0, 0.52, -0.15]} castShadow>
        <boxGeometry args={[0.7, 0.9, 0.45]} />
        <meshStandardMaterial color="#374151" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Visible PLSS Unit on Servicing Stand (fades/hides when equipped on player, or shows secondary unit) */}
      <group position={[0, 1.05, -0.15]}>
        <ProceduralPLSSModel position={[0, 0, 0]} rotation={[0, 0, 0]} scale={1.0} />
      </group>

      {/* Status Beacon on Top of Gantry */}
      <mesh position={[0, 2.26, -0.4]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshBasicMaterial color={isPLSSInstalledOnPlayer ? '#38b000' : '#4299e1'} />
      </mesh>
      <pointLight
        ref={gantryBeaconLightRef}
        position={[0, 2.3, -0.4]}
        color={isPLSSInstalledOnPlayer ? '#38b000' : '#4299e1'}
        intensity={1.0}
        distance={2.5}
      />

      {/* Life Support Umbilical Lines */}
      <mesh position={[0.42, 0.55, 0.2]} rotation={[0.4, 0, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.9, 8]} />
        <meshStandardMaterial color="#e53e3e" roughness={0.6} /> {/* Red O2 Line */}
      </mesh>
      <mesh position={[-0.42, 0.55, 0.2]} rotation={[0.4, 0, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.9, 8]} />
        <meshStandardMaterial color="#3182ce" roughness={0.6} /> {/* Blue Coolant Line */}
      </mesh>

      {/* Local Diagnostic Touchpad */}
      <mesh position={[0.75, 0.85, 0.5]} rotation={[-0.5, -0.2, 0]} castShadow>
        <boxGeometry args={[0.35, 0.25, 0.04]} />
        <meshStandardMaterial color="#1a202c" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0.75, 0.85, 0.52]} rotation={[-0.5, -0.2, 0]}>
        <planeGeometry args={[0.31, 0.21]} />
        <meshBasicMaterial color="#0c3247" />
      </mesh>
    </group>
  );
}
