import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getTerrainHeight } from '../../utils/terrainHeight';

interface ThirdPersonCameraProps {
  targetPosition: [number, number, number];
  isPaused: boolean;
  onCameraYawChange?: (yaw: number) => void;
}

export function ThirdPersonCamera({
  targetPosition,
  isPaused,
  onCameraYawChange,
}: ThirdPersonCameraProps) {
  const { camera, gl } = useThree();

  // Spherical camera orbit state
  const distanceRef = useRef(4.8);
  const yawRef = useRef(0.0); // Horizontal angle
  const pitchRef = useRef(0.35); // Vertical angle (elevation)

  const isDraggingRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });

  // Mouse drag & scroll handlers for third-person orbit
  useEffect(() => {
    const dom = gl.domElement;

    const handleMouseDown = (e: MouseEvent) => {
      if (isPaused) return;
      // Orbit with Left Click (button 0) or Right Click (button 2)
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
      yawRef.current -= dx * sensitivity;
      pitchRef.current = Math.max(
        -0.15,
        Math.min(1.15, pitchRef.current + dy * sensitivity)
      );

      if (onCameraYawChange) {
        onCameraYawChange(yawRef.current);
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      if (isPaused) return;
      e.preventDefault();
      distanceRef.current = Math.max(
        2.2,
        Math.min(11.0, distanceRef.current + e.deltaY * 0.005)
      );
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault(); // Prevent context menu during camera pan/orbit
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
  }, [gl, isPaused, onCameraYawChange]);

  const targetVec = useRef(new THREE.Vector3());
  const idealPosVec = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    // Focus target at astronaut chest level
    targetVec.current.set(
      targetPosition[0],
      targetPosition[1] + 1.35,
      targetPosition[2]
    );

    const dist = distanceRef.current;
    const yaw = yawRef.current;
    const pitch = pitchRef.current;

    const offsetX = Math.sin(yaw) * Math.cos(pitch) * dist;
    const offsetZ = Math.cos(yaw) * Math.cos(pitch) * dist;
    const offsetY = Math.sin(pitch) * dist;

    let targetCamX = targetVec.current.x + offsetX;
    let targetCamY = targetVec.current.y + offsetY;
    let targetCamZ = targetVec.current.z + offsetZ;

    // Ground collision prevention: keep camera strictly above the lunar terrain
    const groundH = getTerrainHeight(targetCamX, targetCamZ);
    const minCamHeight = groundH + 0.65;
    if (targetCamY < minCamHeight) {
      targetCamY = minCamHeight;
    }

    idealPosVec.current.set(targetCamX, targetCamY, targetCamZ);

    // Smooth camera damping
    const lerpFactor = Math.min(1, delta * 8.5);
    camera.position.lerp(idealPosVec.current, lerpFactor);
    camera.lookAt(targetVec.current);
  });

  return null;
}

