import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getTerrainHeight, INTERIOR_BOX_OBSTACLES } from '../../utils/terrainHeight';
import type { CameraMode, GameEnvironment } from '../../types/game';

interface CameraControllerProps {
  mode: CameraMode;
  environment?: GameEnvironment;
  targetPosition: [number, number, number];
  isPaused: boolean;
  resetSignal?: number;
}

export function CameraController({
  mode,
  environment = 'exterior',
  targetPosition,
  isPaused,
  resetSignal = 0,
}: CameraControllerProps) {
  const { camera, gl } = useThree();

  // Third-person orbit parameters
  const thirdDistanceRef = useRef(4.8);
  const thirdYawRef = useRef(0.0);
  const thirdPitchRef = useRef(0.35);

  // First-person mouse-look parameters
  const firstYawRef = useRef(0.0);
  const firstPitchRef = useRef(0.0);

  // Inspection camera parameters
  const inspectDistanceRef = useRef(2.8);
  const inspectYawRef = useRef(0.0);
  const inspectPitchRef = useRef(0.2);

  const isDraggingRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });

  // Reset inspection camera on resetSignal
  useEffect(() => {
    inspectDistanceRef.current = 2.8;
    inspectYawRef.current = 0.0;
    inspectPitchRef.current = 0.2;
    thirdDistanceRef.current = 4.8;
  }, [resetSignal]);

  useEffect(() => {
    const dom = gl.domElement;

    const handleMouseDown = (e: MouseEvent) => {
      if (isPaused) return;
      if (e.button === 0 || e.button === 2) {
        isDraggingRef.current = true;
        prevMouseRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || isPaused) return;
      const dx = e.clientX - prevMouseRef.current.x;
      const dy = e.clientY - prevMouseRef.current.y;
      prevMouseRef.current = { x: e.clientX, y: e.clientY };

      const sensitivity = 0.0055;

      if (mode === 'third_person') {
        thirdYawRef.current -= dx * sensitivity;
        thirdPitchRef.current = Math.max(
          -0.12,
          Math.min(1.15, thirdPitchRef.current + dy * sensitivity)
        );
      } else if (mode === 'first_person') {
        firstYawRef.current -= dx * sensitivity;
        firstPitchRef.current = Math.max(
          -1.25,
          Math.min(1.25, firstPitchRef.current - dy * sensitivity)
        );
      } else if (mode === 'inspection') {
        inspectYawRef.current -= dx * sensitivity;
        inspectPitchRef.current = Math.max(
          -0.4,
          Math.min(0.9, inspectPitchRef.current + dy * sensitivity)
        );
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      if (isPaused) return;
      e.preventDefault();

      if (mode === 'third_person') {
        thirdDistanceRef.current = Math.max(
          1.8,
          Math.min(10.0, thirdDistanceRef.current + e.deltaY * 0.005)
        );
      } else if (mode === 'inspection') {
        inspectDistanceRef.current = Math.max(
          1.2,
          Math.min(5.5, inspectDistanceRef.current + e.deltaY * 0.004)
        );
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    dom.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    dom.addEventListener('wheel', handleWheel, { passive: false });
    dom.addEventListener('contextmenu', handleContextMenu);

    return () => {
      dom.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      dom.removeEventListener('wheel', handleWheel);
      dom.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [gl, isPaused, mode]);

  const targetVec = useRef(new THREE.Vector3());
  const idealPosVec = useRef(new THREE.Vector3());
  const currentActualPos = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    if (mode === 'first_person') {
      // 1. FIRST-PERSON MODE: Exactly aligned with helmet visor eye height
      const eyeHeight = targetPosition[1] + 1.62;
      camera.position.set(targetPosition[0], eyeHeight, targetPosition[2]);

      const yaw = firstYawRef.current;
      const pitch = firstPitchRef.current;

      const lookTarget = new THREE.Vector3(
        targetPosition[0] - Math.sin(yaw) * Math.cos(pitch) * 10,
        eyeHeight + Math.sin(pitch) * 10,
        targetPosition[2] - Math.cos(yaw) * Math.cos(pitch) * 10
      );

      camera.lookAt(lookTarget);
    } else if (mode === 'inspection') {
      // 2. INSPECTION MODE: Orbit focused on suit chest
      targetVec.current.set(
        targetPosition[0],
        targetPosition[1] + 1.1,
        targetPosition[2]
      );

      const dist = inspectDistanceRef.current;
      const yaw = inspectYawRef.current;
      const pitch = inspectPitchRef.current;

      const offsetX = Math.sin(yaw) * Math.cos(pitch) * dist;
      const offsetZ = Math.cos(yaw) * Math.cos(pitch) * dist;
      const offsetY = Math.sin(pitch) * dist;

      idealPosVec.current.set(
        targetVec.current.x + offsetX,
        targetVec.current.y + offsetY,
        targetVec.current.z + offsetZ
      );

      camera.position.copy(idealPosVec.current);
      camera.lookAt(targetVec.current);
    } else {
      // 3. THIRD-PERSON MODE: Smooth follow with wall collision avoidance
      targetVec.current.set(
        targetPosition[0],
        targetPosition[1] + 1.45, // Head/torso center
        targetPosition[2]
      );

      let maxDist = thirdDistanceRef.current;
      const yaw = thirdYawRef.current;
      const pitch = thirdPitchRef.current;

      // In interior environment: dynamic wall & obstacle avoidance ray-check
      if (environment === 'interior') {
        const dirX = Math.sin(yaw) * Math.cos(pitch);
        const dirY = Math.sin(pitch);
        const dirZ = Math.cos(yaw) * Math.cos(pitch);

        // Raymarch from head out to desired orbit distance
        const steps = 15;
        let safeDist = 1.6;

        for (let i = 1; i <= steps; i++) {
          const testDist = 1.4 + (i / steps) * (maxDist - 1.4);
          const tx = targetVec.current.x + dirX * testDist;
          const ty = targetVec.current.y + dirY * testDist;
          const tz = targetVec.current.z + dirZ * testDist;

          // Check against room perimeter envelope
          if (tx < -3.3 || tx > 3.3 || tz < -2.1 || tz > 3.9 || ty < 0.4 || ty > 2.5) {
            break;
          }

          // Check against interior box obstacles
          let hit = false;
          for (const box of INTERIOR_BOX_OBSTACLES) {
            if (
              tx >= box.minX - 0.25 &&
              tx <= box.maxX + 0.25 &&
              tz >= box.minZ - 0.25 &&
              tz <= box.maxZ + 0.25
            ) {
              hit = true;
              break;
            }
          }
          if (hit) break;

          safeDist = testDist;
        }

        maxDist = Math.max(1.4, safeDist - 0.15);
      }

      const offsetX = Math.sin(yaw) * Math.cos(pitch) * maxDist;
      const offsetZ = Math.cos(yaw) * Math.cos(pitch) * maxDist;
      const offsetY = Math.sin(pitch) * maxDist;

      let targetCamX = targetVec.current.x + offsetX;
      let targetCamY = targetVec.current.y + offsetY;
      let targetCamZ = targetVec.current.z + offsetZ;

      if (environment === 'interior') {
        // Enforce hard ceiling and floor limits in interior
        targetCamY = Math.max(0.5, Math.min(2.45, targetCamY));
        targetCamX = Math.max(-3.3, Math.min(3.3, targetCamX));
        targetCamZ = Math.max(-2.1, Math.min(3.9, targetCamZ));
      } else {
        // Exterior terrain height ground-clip avoidance
        const groundAtCam = getTerrainHeight(targetCamX, targetCamZ, 'exterior');
        const minCamHeight = groundAtCam + 0.45;
        if (targetCamY < minCamHeight) {
          targetCamY = minCamHeight;
        }
      }

      idealPosVec.current.set(targetCamX, targetCamY, targetCamZ);

      // Smooth camera interpolation
      currentActualPos.current.lerp(idealPosVec.current, Math.min(1, delta * 12));
      camera.position.copy(currentActualPos.current);
      camera.lookAt(targetVec.current);
    }
  });

  return null;
}
