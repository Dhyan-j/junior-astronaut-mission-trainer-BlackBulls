import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { CAMERA_PRESETS } from '../../constants/mission';
import type { CameraTargetId } from '../../types/mission';

interface SceneControllerProps {
  activeTarget: CameraTargetId;
  resetSignal: number;
}

export function SceneController({ activeTarget, resetSignal }: SceneControllerProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();

  const isTransitioningRef = useRef(false);
  const targetPosRef = useRef(new THREE.Vector3(...CAMERA_PRESETS.overview.position));
  const targetLookRef = useRef(new THREE.Vector3(...CAMERA_PRESETS.overview.target));

  // Trigger camera transitions on target change or reset
  useEffect(() => {
    const preset = CAMERA_PRESETS[activeTarget] || CAMERA_PRESETS.overview;
    targetPosRef.current.set(...preset.position);
    targetLookRef.current.set(...preset.target);
    isTransitioningRef.current = true;
  }, [activeTarget, resetSignal]);

  useFrame((_, delta) => {
    if (!controlsRef.current) return;

    if (isTransitioningRef.current) {
      const lerpFactor = Math.min(1, delta * 3.8);

      camera.position.lerp(targetPosRef.current, lerpFactor);
      controlsRef.current.target.lerp(targetLookRef.current, lerpFactor);
      controlsRef.current.update();

      const distPos = camera.position.distanceTo(targetPosRef.current);
      const distTarget = controlsRef.current.target.distanceTo(targetLookRef.current);

      if (distPos < 0.08 && distTarget < 0.05) {
        camera.position.copy(targetPosRef.current);
        controlsRef.current.target.copy(targetLookRef.current);
        isTransitioningRef.current = false;
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.06}
      minDistance={1.8}
      maxDistance={150}
      maxPolarAngle={Math.PI / 2 - 0.02} // Prevent underground clipping
      screenSpacePanning
    />
  );
}
