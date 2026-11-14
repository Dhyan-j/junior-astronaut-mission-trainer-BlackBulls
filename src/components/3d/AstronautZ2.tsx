import { useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const z2Path = '/models/Z2 Spacesuit.glb';

interface AstronautProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

export function AstronautZ2({
  position = [2.5, 0, 3.8],
  rotation = [0, -Math.PI / 3, 0],
  scale = 1.0,
}: AstronautProps) {
  const { scene } = useGLTF(z2Path, '/draco/gltf/');

  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Preserve all original 4K PBR textures (BaseColor, Normal, Specular)
        if (mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.roughness = 0.5;
          mat.needsUpdate = true;
        }
      }
    });
  }, [scene]);

  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  return (
    <group
      name="astronaut-z2-spacesuit"
      position={position}
      rotation={rotation}
      scale={[scale, scale, scale]}
    >
      <primitive object={clonedScene} />
    </group>
  );
}

useGLTF.preload(z2Path, '/draco/gltf/');
