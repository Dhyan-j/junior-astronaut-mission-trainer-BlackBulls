import { useEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SPACESUITS } from '../../constants/mission';
import type { SpacesuitId } from '../../types/game';

const z2Path = SPACESUITS.z2.modelPath;
const mark3Path = SPACESUITS.mark3.modelPath;
const emuPath = SPACESUITS.emu.modelPath;

interface SuitStationProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  selectedSuit: SpacesuitId;
  onSelectSuit?: (suitId: SpacesuitId) => void;
}

export function SuitSelectionStation({
  position = [-10.5, 0.06, -3.8],
  rotation = [0, 0, 0],
  selectedSuit,
  onSelectSuit,
}: SuitStationProps) {
  const { scene: z2Scene } = useGLTF(z2Path, '/draco/gltf/');
  const { scene: mark3Scene } = useGLTF(mark3Path, '/draco/gltf/');
  const { scene: emuScene } = useGLTF(emuPath, '/draco/gltf/');

  // Sanitize materials for display preview
  useEffect(() => {
    [z2Scene, mark3Scene, emuScene].forEach((s) => {
      s.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          const mats = Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material];
          mats.forEach((m) => {
            if ('transmission' in m) {
              (m as THREE.MeshPhysicalMaterial).transmission = 0;
            }
          });
        }
      });
    });
  }, [z2Scene, mark3Scene, emuScene]);

  // Cleanly clone previews so they are independent from the active player character
  const clonedZ2 = useMemo(() => z2Scene.clone(true), [z2Scene]);
  const clonedMark3 = useMemo(() => mark3Scene.clone(true), [mark3Scene]);
  const clonedEMU = useMemo(() => emuScene.clone(true), [emuScene]);

  // Pedestal preview animation refs
  const z2GroupRef = useRef<THREE.Group>(null);
  const mark3GroupRef = useRef<THREE.Group>(null);
  const emuGroupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    const rotSpeed = 0.5; // Gentle 3D inspection spin

    // Mark III
    if (mark3GroupRef.current) {
      const isSelected = selectedSuit === 'mark3';
      const targetY = isSelected ? 0.28 : 0.08;
      mark3GroupRef.current.position.y = THREE.MathUtils.damp(
        mark3GroupRef.current.position.y,
        targetY,
        6,
        delta
      );
      if (isSelected) {
        mark3GroupRef.current.rotation.y += delta * rotSpeed;
      } else {
        mark3GroupRef.current.rotation.y = THREE.MathUtils.damp(
          mark3GroupRef.current.rotation.y,
          0,
          4,
          delta
        );
      }
    }

    // Z-2
    if (z2GroupRef.current) {
      const isSelected = selectedSuit === 'z2';
      const targetY = isSelected ? 0.28 : 0.08;
      z2GroupRef.current.position.y = THREE.MathUtils.damp(
        z2GroupRef.current.position.y,
        targetY,
        6,
        delta
      );
      if (isSelected) {
        z2GroupRef.current.rotation.y += delta * rotSpeed;
      } else {
        z2GroupRef.current.rotation.y = THREE.MathUtils.damp(
          z2GroupRef.current.rotation.y,
          0,
          4,
          delta
        );
      }
    }

    // EMU
    if (emuGroupRef.current) {
      const isSelected = selectedSuit === 'emu';
      const targetY = isSelected ? 0.28 : 0.08;
      emuGroupRef.current.position.y = THREE.MathUtils.damp(
        emuGroupRef.current.position.y,
        targetY,
        6,
        delta
      );
      if (isSelected) {
        emuGroupRef.current.rotation.y += delta * rotSpeed;
      } else {
        emuGroupRef.current.rotation.y = THREE.MathUtils.damp(
          emuGroupRef.current.rotation.y,
          0,
          4,
          delta
        );
      }
    }
  });

  return (
    <group
      name="suit-selection-station"
      position={position}
      rotation={rotation}
    >
      {/* Heavy Regolith Service Platform */}
      <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
        <boxGeometry args={[5.2, 0.16, 2.4]} />
        <meshStandardMaterial color="#232731" roughness={0.7} metalness={0.4} />
      </mesh>

      {/* Yellow/Black Safety Border Edge */}
      <mesh position={[0, 0.17, 1.15]}>
        <boxGeometry args={[5.1, 0.02, 0.08]} />
        <meshStandardMaterial color="#e5a93c" roughness={0.5} metalness={0.2} />
      </mesh>

      {/* Central Interactive Console Terminal */}
      <group position={[0, 0.16, 0.85]}>
        <mesh position={[0, 0.45, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.12, 0.9, 8]} />
          <meshStandardMaterial color="#404552" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Terminal Screen Angled Toward Player */}
        <mesh position={[0, 0.95, 0]} rotation={[-0.45, 0, 0]} castShadow>
          <boxGeometry args={[0.7, 0.45, 0.06]} />
          <meshStandardMaterial color="#1a202c" metalness={0.5} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.95, 0.035]} rotation={[-0.45, 0, 0]}>
          <planeGeometry args={[0.62, 0.38]} />
          <meshBasicMaterial color="#0b385e" />
        </mesh>
      </group>

      {/* =============================================================== */}
      {/* Stand 1: Mark III Spacesuit Display (Left)                      */}
      {/* =============================================================== */}
      <group
        position={[-1.7, 0.16, -0.2]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectSuit?.('mark3');
        }}
      >
        {/* Pedestal Base */}
        <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.48, 0.54, 0.16, 24]} />
          <meshStandardMaterial color="#363c4a" metalness={0.6} roughness={0.4} />
        </mesh>
        {/* Selection Ring */}
        <mesh position={[0, 0.17, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.4, 0.47, 32]} />
          <meshBasicMaterial
            color={selectedSuit === 'mark3' ? '#38b000' : '#4a5568'}
          />
        </mesh>
        {/* Suit Preview Mesh */}
        <group ref={mark3GroupRef} position={[0, 0.08, 0]}>
          <primitive object={clonedMark3} scale={[0.98, 0.98, 0.98]} />
        </group>
      </group>

      {/* =============================================================== */}
      {/* Stand 2: Z-2 Prototype Spacesuit Display (Center)               */}
      {/* =============================================================== */}
      <group
        position={[0, 0.16, -0.2]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectSuit?.('z2');
        }}
      >
        <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.48, 0.54, 0.16, 24]} />
          <meshStandardMaterial color="#363c4a" metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.17, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.4, 0.47, 32]} />
          <meshBasicMaterial
            color={selectedSuit === 'z2' ? '#38b000' : '#4a5568'}
          />
        </mesh>
        <group ref={z2GroupRef} position={[0, 0.08, 0]}>
          <primitive object={clonedZ2} scale={[1.0, 1.0, 1.0]} />
        </group>
      </group>

      {/* =============================================================== */}
      {/* Stand 3: Extravehicular Mobility Unit Display (Right)           */}
      {/* =============================================================== */}
      <group
        position={[1.7, 0.16, -0.2]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectSuit?.('emu');
        }}
      >
        <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.48, 0.54, 0.16, 24]} />
          <meshStandardMaterial color="#363c4a" metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.17, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.4, 0.47, 32]} />
          <meshBasicMaterial
            color={selectedSuit === 'emu' ? '#38b000' : '#4a5568'}
          />
        </mesh>
        <group ref={emuGroupRef} position={[0, 0.08, 0]}>
          <primitive object={clonedEMU} scale={[1.0, 1.0, 1.0]} />
        </group>
      </group>
    </group>
  );
}

useGLTF.preload(z2Path, '/draco/gltf/');
useGLTF.preload(mark3Path, '/draco/gltf/');
useGLTF.preload(emuPath, '/draco/gltf/');

