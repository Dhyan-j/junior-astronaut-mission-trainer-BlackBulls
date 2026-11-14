import { useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const sevPath = '/models/Space Exploration Vehicle.glb';

interface LunarRoverProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

export function LunarRover({
  position = [9.5, 0, -1.5],
  rotation = [0, -Math.PI / 5, 0],
  scale = 1.0,
}: LunarRoverProps) {
  const { scene } = useGLTF(sevPath, '/draco/gltf/');

  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Preserve all original 4K PBR textures
        if (mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.needsUpdate = true;
        }
      }
    });
  }, [scene]);

  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  return (
    <group
      name="lunar-rover-sev"
      position={position}
      rotation={rotation}
      scale={[scale, scale, scale]}
    >
      <primitive object={clonedScene} />
    </group>
  );
}

useGLTF.preload(sevPath, '/draco/gltf/');
