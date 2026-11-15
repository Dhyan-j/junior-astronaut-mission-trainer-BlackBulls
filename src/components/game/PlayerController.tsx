import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SuitAvatar, type AvatarMotionState } from './SuitAvatar';
import { getTerrainHeight, resolveCollisions } from '../../utils/terrainHeight';
import type { CameraMode, GameEnvironment, PlayerInputState, SpacesuitId } from '../../types/game';

interface PlayerControllerProps {
  selectedSuit: SpacesuitId;
  plssInstalled: boolean;
  cameraMode: CameraMode;
  environment: GameEnvironment;
  isPaused: boolean;
  spawnPosition?: [number, number, number];
  isDrivingRover?: boolean;
  teleportTrigger?: number;
  onPositionChange: (pos: [number, number, number]) => void;
  onInteractPressed: () => void;
  onPausePressed: () => void;
  onToggleCameraMode: () => void;
}

export function PlayerController({
  selectedSuit,
  plssInstalled,
  cameraMode,
  environment = 'exterior',
  isPaused,
  isDrivingRover = false,
  spawnPosition,
  teleportTrigger = 0,
  onPositionChange,
  onInteractPressed,
  onPausePressed,
  onToggleCameraMode,
}: PlayerControllerProps) {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  // Position & Kinematics state
  const initialPos = spawnPosition || [-11.0, 0, -5.0];
  const posRef = useRef(new THREE.Vector3(initialPos[0], initialPos[1], initialPos[2]));
  const rotYRef = useRef(environment === 'interior' ? Math.PI : 0);
  const velocityYRef = useRef(0);
  const isGroundedRef = useRef(true);
  const currentSpeedRef = useRef(0);
  const lastReportedPos = useRef(new THREE.Vector3(initialPos[0], initialPos[1], initialPos[2]));

  // Handle environment teleport
  useEffect(() => {
    console.log('[PlayerController] useEffect teleport! spawnPosition:', spawnPosition, 'teleportTrigger:', teleportTrigger, 'environment:', environment);
    if (spawnPosition) {
      posRef.current.set(spawnPosition[0], spawnPosition[1], spawnPosition[2]);
      rotYRef.current = environment === 'interior' ? Math.PI : 0;
      lastReportedPos.current.copy(posRef.current);
      onPositionChange([posRef.current.x, posRef.current.y, posRef.current.z]);
      if (typeof window !== 'undefined') {
        (window as unknown as { __PLAYER_POS__?: { x: number; y: number; z: number } }).__PLAYER_POS__ = {
          x: posRef.current.x,
          y: posRef.current.y,
          z: posRef.current.z,
        };
      }
    }
  }, [teleportTrigger, environment, spawnPosition, onPositionChange]);

  // Motion state ref passed directly to SuitAvatar for animation in useFrame
  const motionStateRef = useRef<AvatarMotionState>({
    isMoving: false,
    isRunning: false,
    isGrounded: true,
  });

  // Keyboard input tracking
  const inputsRef = useRef<PlayerInputState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    run: false,
    jump: false,
    interact: false,
  });

  // Keep latest callbacks in refs to eliminate stale closure drop
  const onInteractRef = useRef(onInteractPressed);
  useEffect(() => {
    onInteractRef.current = onInteractPressed;
  }, [onInteractPressed]);

  const onPauseRef = useRef(onPausePressed);
  useEffect(() => {
    onPauseRef.current = onPausePressed;
  }, [onPausePressed]);

  const onToggleCameraRef = useRef(onToggleCameraMode);
  useEffect(() => {
    onToggleCameraRef.current = onToggleCameraMode;
  }, [onToggleCameraMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Pause
      if (e.code === 'Escape') {
        onPauseRef.current();
        return;
      }

      // Toggle First / Third Person Camera Mode via 'V'
      if (e.code === 'KeyV' && !e.repeat) {
        e.preventDefault();
        onToggleCameraRef.current();
        return;
      }

      // Prevent browser scrolling from game control keys
      const gameControlCodes = [
        'Space',
        'KeyW',
        'KeyS',
        'KeyA',
        'KeyD',
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'KeyE',
        'Enter',
      ];
      if (gameControlCodes.includes(e.code)) {
        e.preventDefault();
      }

      // Block movement input when paused
      if (isPaused) return;

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          inputsRef.current.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          inputsRef.current.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          inputsRef.current.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          inputsRef.current.right = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          inputsRef.current.run = true;
          break;
        case 'Space':
          if (isGroundedRef.current) {
            velocityYRef.current = 2.8; // Low-gravity lunar hop impulse
            isGroundedRef.current = false;
          }
          break;
        case 'KeyE':
        case 'Enter':
          if (!e.repeat) {
            onInteractRef.current();
          }
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          inputsRef.current.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          inputsRef.current.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          inputsRef.current.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          inputsRef.current.right = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          inputsRef.current.run = false;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPaused, onInteractPressed, onPausePressed, onToggleCameraMode]);

  // Temporary vectors to avoid garbage collection allocations
  const forwardVec = useRef(new THREE.Vector3());
  const rightVec = useRef(new THREE.Vector3());
  const moveDirVec = useRef(new THREE.Vector3());
  const upVec = useRef(new THREE.Vector3(0, 1, 0));

  // Frame update: movement kinematics, collisions, terrain following
  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Hide on-foot avatar and track vehicle location while driving
    if (isDrivingRover) {
      groupRef.current.visible = false;
      if (spawnPosition) {
        posRef.current.set(spawnPosition[0], spawnPosition[1], spawnPosition[2]);
        if (typeof window !== 'undefined') {
          (window as unknown as { __PLAYER_POS__?: { x: number; y: number; z: number } }).__PLAYER_POS__ = {
            x: posRef.current.x,
            y: posRef.current.y,
            z: posRef.current.z,
          };
        }
      }
      return;
    }
    groupRef.current.visible = true;

    // Zero out movement if paused
    if (isPaused) {
      currentSpeedRef.current = 0;
      inputsRef.current.forward = false;
      inputsRef.current.backward = false;
      inputsRef.current.left = false;
      inputsRef.current.right = false;
      inputsRef.current.run = false;
    }

    // 1. Calculate camera-relative movement axes (W=forward, S=backward, A=left, D=right relative to active camera)
    camera.getWorldDirection(forwardVec.current);
    forwardVec.current.y = 0;
    forwardVec.current.normalize();

    rightVec.current.crossVectors(forwardVec.current, upVec.current);
    rightVec.current.normalize();

    // 2. Build camera-relative movement direction
    moveDirVec.current.set(0, 0, 0);

    if (inputsRef.current.forward) moveDirVec.current.add(forwardVec.current);
    if (inputsRef.current.backward) moveDirVec.current.sub(forwardVec.current);
    if (inputsRef.current.right) moveDirVec.current.add(rightVec.current);
    if (inputsRef.current.left) moveDirVec.current.sub(rightVec.current);

    const hasInput = moveDirVec.current.lengthSq() > 0.0001 && !isPaused;

    if (hasInput) {
      moveDirVec.current.normalize();
    }

    // Clamp frame delta to prevent physics tunneling on lag spikes
    const safeDelta = Math.min(delta, 0.05);

    // Target movement speed
    const maxSpeed = inputsRef.current.run ? 4.8 : 2.5;
    const targetSpeed = hasInput ? maxSpeed : 0;

    // Smooth acceleration / deceleration
    currentSpeedRef.current = THREE.MathUtils.damp(
      currentSpeedRef.current,
      targetSpeed,
      12,
      safeDelta
    );

    // 3. Update character orientation
    if (cameraMode === 'first_person') {
      rotYRef.current = Math.atan2(forwardVec.current.x, forwardVec.current.z);
    } else if (hasInput) {
      const targetRotationY = Math.atan2(moveDirVec.current.x, moveDirVec.current.z);
      let diff = targetRotationY - rotYRef.current;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      rotYRef.current += diff * Math.min(1, safeDelta * 14);
    }

    // 4. Update horizontal position & resolve collisions with smooth wall sliding
    if (currentSpeedRef.current > 0.01) {
      const deltaDist = currentSpeedRef.current * safeDelta;

      // Axis-decoupled collision resolution for smooth wall sliding:
      // Test X movement first, retaining Z position
      const testX = posRef.current.x + moveDirVec.current.x * deltaDist;
      const resX = resolveCollisions(testX, posRef.current.z, 0.35, environment);

      // Test Z movement from the resolved X position
      const testZ = posRef.current.z + moveDirVec.current.z * deltaDist;
      const resFinal = resolveCollisions(resX.x, testZ, 0.35, environment);

      posRef.current.x = resFinal.x;
      posRef.current.z = resFinal.z;
    }

    // 5. Lunar terrain height & gravity simulation
    const groundHeight = getTerrainHeight(posRef.current.x, posRef.current.z, environment);

    if (!isGroundedRef.current) {
      const lunarGravity = 3.2; // floaty responsive lunar hop
      velocityYRef.current -= lunarGravity * safeDelta;
      posRef.current.y += velocityYRef.current * safeDelta;

      if (posRef.current.y <= groundHeight) {
        posRef.current.y = groundHeight;
        velocityYRef.current = 0;
        isGroundedRef.current = true;
      }
    } else {
      posRef.current.y = groundHeight;
    }

    // Update motion state ref for SuitAvatar useFrame
    motionStateRef.current.isMoving = currentSpeedRef.current > 0.2;
    motionStateRef.current.isRunning = inputsRef.current.run;
    motionStateRef.current.isGrounded = isGroundedRef.current;

    // 6. Apply position and rotation to the 3D group
    groupRef.current.position.copy(posRef.current);
    groupRef.current.rotation.y = rotYRef.current;

    // Report updated position only when changed by > 0.05m to prevent React 60fps re-render churn
    if (posRef.current.distanceToSquared(lastReportedPos.current) > 0.0025) {
      lastReportedPos.current.copy(posRef.current);
      onPositionChange([posRef.current.x, posRef.current.y, posRef.current.z]);
    }

    if (typeof window !== 'undefined') {
      (window as unknown as { __PLAYER_POS__?: { x: number; y: number; z: number } }).__PLAYER_POS__ = {
        x: posRef.current.x,
        y: posRef.current.y,
        z: posRef.current.z,
      };

      if (groupRef.current) {
        const box = new THREE.Box3().setFromObject(groupRef.current);
        (window as unknown as { __FLOOR_DEBUG__?: unknown }).__FLOOR_DEBUG__ = {
          playerPosY: posRef.current.y,
          groundHeight,
          avatarMinY: box.min.y,
          avatarMaxY: box.max.y,
          avatarHeight: box.max.y - box.min.y,
          footDeltaY: box.min.y - groundHeight,
          environment,
          isGrounded: isGroundedRef.current,
        };
      }
    }
  });

  return (
    <group ref={groupRef} name="playable-astronaut-controller">
      <SuitAvatar
        suitId={selectedSuit}
        showPLSS={plssInstalled}
        motionStateRef={motionStateRef}
        visible={cameraMode !== 'first_person'}
      />
    </group>
  );
}
