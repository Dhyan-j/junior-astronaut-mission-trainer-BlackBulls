import { useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const biodomePath = '/models/low-poly_lunar_habitat.glb';

interface BioDomeProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

export function BioDomeHabitat({
  position = [-20, 0, -16],
  rotation = [0, -Math.PI / 6, 0],
  scale = 1.0,
}: BioDomeProps) {
  const { scene } = useGLTF(biodomePath);

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

  return (
    <group
      name="biodome-research-outpost"
      position={position}
      rotation={rotation}
      scale={[scale, scale, scale]}
    >
      <primitive object={clonedScene} />
    </group>
  );
}

useGLTF.preload(biodomePath);

