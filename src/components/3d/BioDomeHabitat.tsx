import { useEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const biodomePath = '/models/low-poly_lunar_habitat.glb';

interface BioDomeProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  airlockDoorOpen?: boolean;
}

export function BioDomeHabitat({
  position = [-20, 0, -16],
  rotation = [0, -Math.PI / 6, 0],
  scale = 1.0,
  airlockDoorOpen = false,
}: BioDomeProps) {
  const { scene } = useGLTF(biodomePath);
  const outerDoorRef = useRef<THREE.Mesh>(null);
  const beaconLightRef = useRef<THREE.PointLight>(null);

  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
  }, [scene]);

  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  // Smoothly animate sliding blast door at the main dome entrance
  useFrame((state, delta) => {
    if (outerDoorRef.current) {
      const targetY = airlockDoorOpen ? 2.8 : 1.15;
      outerDoorRef.current.position.y = THREE.MathUtils.damp(
        outerDoorRef.current.position.y,
        targetY,
        8,
        delta
      );
    }
    if (beaconLightRef.current) {
      beaconLightRef.current.intensity =
        1.2 + Math.sin(state.clock.elapsedTime * 3.0) * 0.4;
    }
  });

  // Main entrance connector of the large dome faces world [-13.5, 0, -12.25]
  // In local dome coordinates (with position=[-20, 0, -16], rotation=[0, -Math.PI/6, 0]):
  // connector.003 is at local [4.0, 0, 4.4]
  return (
    <group
      name="biodome-research-outpost"
      position={position}
      rotation={rotation}
      scale={[scale, scale, scale]}
    >
      {/* 1. Large Geodesic Domed Habitat Geometry */}
      <primitive object={clonedScene} />

      {/* 2. Functional Entrance Airlock Assembly on Dome Connector.003 */}
      <group position={[4.0, 0, 4.4]} rotation={[0, Math.PI / 4, 0]}>
        {/* Entrance Portal Frame */}
        <mesh position={[-0.95, 1.25, 0]} castShadow>
          <boxGeometry args={[0.2, 2.4, 0.35]} />
          <meshStandardMaterial color="#353b47" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0.95, 1.25, 0]} castShadow>
          <boxGeometry args={[0.2, 2.4, 0.35]} />
          <meshStandardMaterial color="#353b47" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 2.35, 0]} castShadow>
          <boxGeometry args={[2.1, 0.2, 0.35]} />
          <meshStandardMaterial color="#353b47" metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Animated Sliding Blast Door */}
        <mesh ref={outerDoorRef} position={[0, 1.15, 0]} castShadow>
          <boxGeometry args={[1.7, 2.2, 0.08]} />
          <meshStandardMaterial color="#555c6d" metalness={0.85} roughness={0.25} />
        </mesh>

        {/* Outer Approach Ramp with Hazard Markings */}
        <mesh position={[0, 0.04, 1.0]} rotation={[0.08, 0, 0]} receiveShadow>
          <boxGeometry args={[1.8, 0.08, 1.8]} />
          <meshStandardMaterial color="#2d333e" roughness={0.7} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0.09, 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.6, 0.25]} />
          <meshStandardMaterial color="#e5a93c" roughness={0.4} />
        </mesh>

        {/* Airlock Status Beacon */}
        <pointLight
          ref={beaconLightRef}
          position={[0, 2.6, 0.3]}
          color={airlockDoorOpen ? '#38b000' : '#4ecdc4'}
          intensity={1.5}
          distance={8}
          decay={2}
        />

        {/* Wall-Mounted Airlock Cycling Console */}
        <group position={[1.15, 1.35, 0.15]} rotation={[0, -Math.PI / 4, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.32, 0.5, 0.14]} />
            <meshStandardMaterial color="#1f2937" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.14, 0.08]}>
            <circleGeometry args={[0.04, 16]} />
            <meshBasicMaterial color={airlockDoorOpen ? '#38b000' : '#4ecdc4'} />
          </mesh>
          <mesh position={[0, -0.06, 0.08]}>
            <planeGeometry args={[0.24, 0.16]} />
            <meshBasicMaterial color="#0b1b2b" />
          </mesh>
        </group>
      </group>
    </group>
  );
}

useGLTF.preload(biodomePath);
