import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  getTerrainHeight,
  INTERIOR_BOX_OBSTACLES,
  EXTERIOR_BOX_OBSTACLES,
} from '../../utils/terrainHeight';
import type { CameraMode, GameEnvironment } from '../../types/game';

interface CameraControllerProps {
  mode: CameraMode;
  environment?: GameEnvironment;
  targetPosition: [number, number, number];
  isPaused: boolean;
  isDrivingRover?: boolean;
  teleportTrigger?: number;
  resetSignal?: number;
}

export function CameraController({
  mode,
  environment = 'exterior',
  targetPosition,
  isPaused,
  isDrivingRover = false,
  teleportTrigger = 0,
  resetSignal = 0,
}: CameraControllerProps) {
  const { camera, gl } = useThree();

  // Third-person orbit parameters (Behind and slightly above astronaut)
  const thirdDistanceRef = useRef(3.8);
  const thirdYawRef = useRef(0.0);
  const thirdPitchRef = useRef(0.24);

  // First-person mouse-look parameters
  const firstYawRef = useRef(0.0);
  const firstPitchRef = useRef(0.0);

  // Inspection camera parameters
  const inspectDistanceRef = useRef(2.8);
  const inspectYawRef = useRef(0.0);
  const inspectPitchRef = useRef(0.2);

  const isDraggingRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });

  const [posX, posY, posZ] = targetPosition;

  // Reset and snap camera immediately on teleport, environment transition, or resetSignal
  useEffect(() => {
    inspectDistanceRef.current = 2.8;
    inspectYawRef.current = 0.0;
    inspectPitchRef.current = 0.2;
    thirdDistanceRef.current = 3.8;
    thirdYawRef.current = 0.0;
    thirdPitchRef.current = 0.24;

    // Immediately snap camera behind the player (looking North, -Z)
    const targetY = posY + 1.25;
    const initialDist = environment === 'interior' ? 1.6 : 3.8;
    const camY = environment === 'interior'
      ? Math.min(2.85, targetY + Math.sin(0.24) * initialDist)
      : targetY + Math.sin(0.24) * initialDist;
    const camZ = posZ + Math.cos(0.24) * initialDist;

    currentActualPos.current.set(posX, camY, camZ);
    camera.position.copy(currentActualPos.current);
    camera.lookAt(posX, targetY, posZ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teleportTrigger, environment, resetSignal, camera]);

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
          -0.05,
          Math.min(0.85, thirdPitchRef.current + dy * sensitivity)
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
          2.0,
          Math.min(5.5, thirdDistanceRef.current + e.deltaY * 0.004)
        );
      } else if (mode === 'inspection') {
        inspectDistanceRef.current = Math.max(
          1.4,
          Math.min(5.0, inspectDistanceRef.current + e.deltaY * 0.003)
        );
      }
    };

    dom.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    dom.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      dom.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      dom.removeEventListener('wheel', handleWheel);
    };
  }, [mode, isPaused, gl.domElement]);

  // Smoothed camera positions and orientations
  const currentActualPos = useRef(new THREE.Vector3());
  const idealPosVec = useRef(new THREE.Vector3());
  const targetVec = useRef(new THREE.Vector3());

  // Reusable raycasting vectors for camera wall collision avoidance
  const camRayDir = useRef(new THREE.Vector3());
  const camRay = useRef(new THREE.Ray());
  const hitPointVec = useRef(new THREE.Vector3());
  const tempBox3 = useRef(new THREE.Box3());

  useFrame((_, delta) => {
    if (mode === 'first_person') {
      // 1. FIRST-PERSON MODE: Helmet / Eye level view
      const eyeHeight = 1.76;
      targetVec.current.set(
        targetPosition[0],
        targetPosition[1] + eyeHeight,
        targetPosition[2]
      );

      const forwardOffset = 0.12;
      const lookDist = 10.0;
      const yaw = firstYawRef.current;
      const pitch = firstPitchRef.current;

      const fX = Math.sin(yaw) * Math.cos(pitch);
      const fY = Math.sin(pitch);
      const fZ = Math.cos(yaw) * Math.cos(pitch);

      idealPosVec.current.set(
        targetVec.current.x + Math.sin(yaw) * forwardOffset,
        targetVec.current.y,
        targetVec.current.z + Math.cos(yaw) * forwardOffset
      );

      camera.position.copy(idealPosVec.current);
      camera.lookAt(
        idealPosVec.current.x + fX * lookDist,
        idealPosVec.current.y + fY * lookDist,
        idealPosVec.current.z + fZ * lookDist
      );
    } else if (mode === 'inspection') {
      // 2. INSPECTION MODE: 360 Turntable Orbit
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
        Math.max(0.4, targetVec.current.y + offsetY),
        targetVec.current.z + offsetZ
      );

      camera.position.copy(idealPosVec.current);
      camera.lookAt(targetVec.current);
    } else {
      // 3. THIRD-PERSON MODE: Seamless follow camera (astronaut or lunar rover)
      // When driving rover, read the instantaneous rover position to eliminate 60fps frame lag
      let curTargetX = targetPosition[0];
      let curTargetY = targetPosition[1];
      let curTargetZ = targetPosition[2];

      if (isDrivingRover && typeof window !== 'undefined') {
        const activeRoverPos = (window as unknown as { __ACTIVE_ROVER_POS__?: [number, number, number] }).__ACTIVE_ROVER_POS__;
        if (activeRoverPos) {
          curTargetX = activeRoverPos[0];
          curTargetY = activeRoverPos[1];
          curTargetZ = activeRoverPos[2];
        }
      }

      const targetLookY = isDrivingRover ? 1.65 : 1.25;
      targetVec.current.set(
        curTargetX,
        curTargetY + targetLookY,
        curTargetZ
      );

      const maxDist = isDrivingRover ? 7.2 : thirdDistanceRef.current;
      const yaw = thirdYawRef.current;
      const pitch = isDrivingRover ? Math.max(0.22, thirdPitchRef.current) : thirdPitchRef.current;

      const fullOffsetX = Math.sin(yaw) * Math.cos(pitch) * maxDist;
      const fullOffsetY = Math.sin(pitch) * maxDist;
      const fullOffsetZ = Math.cos(yaw) * Math.cos(pitch) * maxDist;

      // Line of sight ray from astronaut / vehicle upper body toward desired camera position
      camRayDir.current.set(fullOffsetX, fullOffsetY, fullOffsetZ);
      const fullDist = camRayDir.current.length();
      camRayDir.current.normalize();
      camRay.current.set(targetVec.current, camRayDir.current);

      let allowedDist = fullDist;

      // Collision detection against obstacles and walls
      const boxes = environment === 'interior' ? INTERIOR_BOX_OBSTACLES : EXTERIOR_BOX_OBSTACLES;
      for (let i = 0; i < boxes.length; i++) {
        const b = boxes[i];
        tempBox3.current.min.set(
          b.minX - 0.25,
          environment === 'interior' ? 1.05 : -10.0,
          b.minZ - 0.25
        );
        tempBox3.current.max.set(
          b.maxX + 0.25,
          environment === 'interior' ? 4.5 : 20.0,
          b.maxZ + 0.25
        );

        if (camRay.current.intersectBox(tempBox3.current, hitPointVec.current)) {
          const hitDist = targetVec.current.distanceTo(hitPointVec.current);
          const safeDist = Math.max(1.15, hitDist - 0.25);
          if (safeDist < allowedDist) {
            allowedDist = safeDist;
          }
        }
      }

      // Compute camera position with wall collision distance
      let targetCamX = targetVec.current.x + Math.sin(yaw) * Math.cos(pitch) * allowedDist;
      let targetCamY = targetVec.current.y + Math.sin(pitch) * allowedDist;
      let targetCamZ = targetVec.current.z + Math.cos(yaw) * Math.cos(pitch) * allowedDist;

      if (environment === 'interior') {
        // Ceiling clearance: prevent camera clipping through corridor / room ceilings
        targetCamY = THREE.MathUtils.clamp(targetCamY, 1.45, 2.95);
        // Base perimeter clamp
        targetCamX = THREE.MathUtils.clamp(targetCamX, -13.5, 13.5);
        targetCamZ = THREE.MathUtils.clamp(targetCamZ, -17.5, 22.5);
      } else {
        // Exterior terrain height ground-clip avoidance
        const groundAtCam = getTerrainHeight(targetCamX, targetCamZ, 'exterior');
        const minCamHeight = groundAtCam + 0.55;
        if (targetCamY < minCamHeight) {
          targetCamY = minCamHeight;
        }
      }

      idealPosVec.current.set(targetCamX, targetCamY, targetCamZ);

      // Follow rate: tight responsive tracking when driving to eliminate terrain lag
      const followLerpRate = isDrivingRover ? 26.0 : 12.0;
      currentActualPos.current.lerp(idealPosVec.current, Math.min(1, delta * followLerpRate));
      camera.position.copy(currentActualPos.current);
      camera.lookAt(targetVec.current);
    }
  });

  return null;
}

