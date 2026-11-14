import { useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Preload models
const part1Path = '/models/Habitat Demonstration Unit (part 1) (1).glb';
const part2Path = '/models/Habitat Demonstration Unit (part 2).glb';

interface HabitatUnitProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

export function HabitatUnit({
  position = [-4, 0, -2],
  rotation = [0, Math.PI / 4, 0],
  scale = 0.012,
}: HabitatUnitProps) {
  const { scene: part1Scene } = useGLTF(part1Path, '/draco/gltf/');
  const { scene: part2Scene } = useGLTF(part2Path, '/draco/gltf/');

  // Sanitize materials: Blender export added transmission=1.0 to solid wall materials
  useEffect(() => {
    [part1Scene, part2Scene].forEach((scene) => {
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;

          const materials = Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material];

          materials.forEach((mat) => {
            if ('transmission' in mat) {
              // Ensure opaque habitat composite panels are visible
              (mat as THREE.MeshPhysicalMaterial).transmission = 0;
            }
          });
        }
      });
    });
  }, [part1Scene, part2Scene]);

  // Clone scenes to avoid shared-state mutation
  const p1 = useMemo(() => part1Scene.clone(true), [part1Scene]);
  const p2 = useMemo(() => part2Scene.clone(true), [part2Scene]);

  return (
    <group
      name="habitat-demonstration-unit"
      position={position}
      rotation={rotation}
      scale={[scale, scale, scale]}
    >
      {/* Habitat Part 1: Airlock / Porch Vestibule */}
      <primitive object={p1} />

      {/* Habitat Part 2: Main Pressurized Living Module Core */}
      <primitive object={p2} />
    </group>
  );
}

useGLTF.preload(part1Path, '/draco/gltf/');
useGLTF.preload(part2Path, '/draco/gltf/');
