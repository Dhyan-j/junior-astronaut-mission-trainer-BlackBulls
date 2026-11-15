import { useEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  getTerrainHeight,
  LUNAR_CYLINDER_OBSTACLES,
  EXTERIOR_BOX_OBSTACLES,
} from '../../utils/terrainHeight';
import type { RoverTelemetry } from '../../types/game';

const sevPath = '/models/Space Exploration Vehicle.glb';

interface LunarRoverProps {
  isDriving?: boolean;
  isPaused?: boolean;
  onEnterRover?: () => void;
  onExitRover?: (exitPosition: [number, number, number]) => void;
  onRoverPositionChange?: (position: [number, number, number]) => void;
  onTelemetryChange?: (telemetry: RoverTelemetry) => void;
}

export function LunarRover({
  isDriving = false,
  isPaused = false,
  onExitRover,
  onRoverPositionChange,
  onTelemetryChange,
}: LunarRoverProps) {
  const { scene } = useGLTF(sevPath, '/draco/gltf/');

  // Main rover group container
  const roverGroupRef = useRef<THREE.Group>(null);

  // Wheel meshes for 6-wheel independent rotation and Ackermann steering
  const wheelRefs = useRef<(THREE.Group | null)[]>([]);

  // Kinematic state
  const posRef = useRef(new THREE.Vector3(2.5, 0, 4.0));
  const yawRef = useRef(Math.PI * 0.4); // Facing East-Southeast towards exploration crater fields
  const pitchRef = useRef(0);
  const rollRef = useRef(0);
  const speedRef = useRef(0);
  const steeringRef = useRef(0);
  const wheelAngleRef = useRef(0);
  const distanceRef = useRef(0);
  const batteryRef = useRef(100.0);
  const isBrakingRef = useRef(false);
  const lastTelemetryTimeRef = useRef(0);

  // User input state
  const inputsRef = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    boost: false,
    brake: false,
  });

  // Sanitize MMSEV materials & shadow settings
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.roughness = Math.max(0.35, mat.roughness);
          mat.metalness = Math.min(0.85, mat.metalness);
          mat.needsUpdate = true;
        }
      }
    });
  }, [scene]);

  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  // Keyboard listener for vehicle driving inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPaused) return;

      // Exit rover key: immediately brake to stop and disembark
      if (isDriving && (e.code === 'KeyE' || e.key === 'e' || e.key === 'E')) {
        speedRef.current = 0;
        onRoverPositionChange?.([posRef.current.x, posRef.current.y, posRef.current.z]);
        // Calculate safe disembark position to the left of the vehicle
        const exitOffset = new THREE.Vector3(
          -2.4 * Math.cos(yawRef.current),
          0,
          2.4 * Math.sin(yawRef.current)
        );
        const exitX = posRef.current.x + exitOffset.x;
        const exitZ = posRef.current.z + exitOffset.z;
        const exitY = getTerrainHeight(exitX, exitZ, 'exterior');
        onExitRover?.([exitX, exitY, exitZ]);
        return;
      }

      if (!isDriving) return;

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
          inputsRef.current.boost = true;
          break;
        case 'Space':
          inputsRef.current.brake = true;
          e.preventDefault();
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
          inputsRef.current.boost = false;
          break;
        case 'Space':
          inputsRef.current.brake = false;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isDriving, isPaused, onExitRover, onRoverPositionChange]);

  // Frame update: driving simulation, 4-point terrain suspension, collisions
  useFrame((_, delta) => {
    if (!roverGroupRef.current) return;
    const safeDelta = Math.min(delta, 0.05);

    if (isDriving && !isPaused) {
      // 1. Acceleration, Braking & Steering Kinematics
      const maxForward = inputsRef.current.boost ? 12.0 : 7.2;
      const maxReverse = -3.2;

      let targetSpeed = 0;
      if (inputsRef.current.forward) {
        targetSpeed = maxForward;
      } else if (inputsRef.current.backward) {
        targetSpeed = maxReverse;
      }

      // Active braking with Space or counter-pedal
      const isBraking =
        inputsRef.current.brake ||
        (speedRef.current > 0.5 && inputsRef.current.backward) ||
        (speedRef.current < -0.5 && inputsRef.current.forward);
      isBrakingRef.current = isBraking;

      const accelRate = isBraking ? 12.0 : inputsRef.current.forward ? (inputsRef.current.boost ? 6.5 : 4.5) : 3.0;
      const decelRate = 1.8; // Lunar regolith rolling resistance

      if (isBraking) {
        speedRef.current = THREE.MathUtils.damp(speedRef.current, 0, accelRate, safeDelta);
      } else if (targetSpeed !== 0) {
        speedRef.current = THREE.MathUtils.damp(speedRef.current, targetSpeed, accelRate, safeDelta);
      } else {
        speedRef.current = THREE.MathUtils.damp(speedRef.current, 0, decelRate, safeDelta);
      }

      // Steering angle damping (max ~32 degrees = 0.56 rad)
      let targetSteer = 0;
      if (inputsRef.current.left) targetSteer += 0.54;
      if (inputsRef.current.right) targetSteer -= 0.54;
      steeringRef.current = THREE.MathUtils.damp(steeringRef.current, targetSteer, 9.0, safeDelta);

      // Heading rotation rate derived from Ackermann steering
      const wheelbase = 2.5; // distance between front and rear axles
      if (Math.abs(speedRef.current) > 0.05) {
        const angularVelocity = (speedRef.current / wheelbase) * Math.sin(steeringRef.current);
        yawRef.current += angularVelocity * safeDelta;
      }

      // 2. Linear displacement along vehicle forward heading
      const forwardDist = speedRef.current * safeDelta;
      let newX = posRef.current.x + Math.sin(yawRef.current) * forwardDist;
      let newZ = posRef.current.z + Math.cos(yawRef.current) * forwardDist;

      // 3. Collision Resolution with Boulders, Solar Arrays and Habitat Walls
      const roverRadius = 1.85;

      // Cylinder obstacles (Boulders, Solar Arrays)
      for (const obs of LUNAR_CYLINDER_OBSTACLES) {
        // Skip self if registered
        if (obs.name.includes('Lunar Rover')) continue;

        const dx = newX - obs.x;
        const dz = newZ - obs.z;
        const minDist = obs.radius + roverRadius;
        const dist = Math.hypot(dx, dz);

        if (dist < minDist && dist > 0.001) {
          const push = (minDist - dist) / dist;
          newX += dx * push;
          newZ += dz * push;
          speedRef.current *= 0.45; // absorb impact energy
        }
      }

      // Box obstacles (Habitat Demonstration Unit)
      for (const box of EXTERIOR_BOX_OBSTACLES) {
        const minX = box.minX - roverRadius;
        const maxX = box.maxX + roverRadius;
        const minZ = box.minZ - roverRadius;
        const maxZ = box.maxZ + roverRadius;

        if (newX >= minX && newX <= maxX && newZ >= minZ && newZ <= maxZ) {
          const pushL = minX - newX;
          const pushR = maxX - newX;
          const pushT = minZ - newZ;
          const pushB = maxZ - newZ;

          const minXPush = Math.abs(pushL) < Math.abs(pushR) ? pushL : pushR;
          const minZPush = Math.abs(pushT) < Math.abs(pushB) ? pushT : pushB;

          if (Math.abs(minXPush) < Math.abs(minZPush)) {
            newX += minXPush;
          } else {
            newZ += minZPush;
          }
          speedRef.current *= 0.3;
        }
      }

      posRef.current.x = newX;
      posRef.current.z = newZ;

      // Accumulate wheel rotation and odometer distance
      const wheelRadius = 0.42;
      wheelAngleRef.current += forwardDist / wheelRadius;
      distanceRef.current += Math.abs(forwardDist);
      batteryRef.current = Math.max(5.0, 100.0 - distanceRef.current * 0.008);
    }

    // 4. Multi-Point Suspension & Terrain Slope Following
    // Sample terrain elevation at front, rear, left and right axle centers
    const cosY = Math.cos(yawRef.current);
    const sinY = Math.sin(yawRef.current);

    const halfLength = 1.25;
    const halfWidth = 1.35;

    const frontX = posRef.current.x + sinY * halfLength;
    const frontZ = posRef.current.z + cosY * halfLength;
    const rearX = posRef.current.x - sinY * halfLength;
    const rearZ = posRef.current.z - cosY * halfLength;

    const leftX = posRef.current.x - cosY * halfWidth;
    const leftZ = posRef.current.z + sinY * halfWidth;
    const rightX = posRef.current.x + cosY * halfWidth;
    const rightZ = posRef.current.z - sinY * halfWidth;

    const hF = getTerrainHeight(frontX, frontZ, 'exterior');
    const hR = getTerrainHeight(rearX, rearZ, 'exterior');
    const hL = getTerrainHeight(leftX, leftZ, 'exterior');
    const hRt = getTerrainHeight(rightX, rightZ, 'exterior');

    const targetPitch = Math.atan2(hF - hR, halfLength * 2);
    const targetRoll = Math.atan2(hRt - hL, halfWidth * 2);
    const targetY = (hF + hR + hL + hRt) * 0.25;

    pitchRef.current = THREE.MathUtils.damp(pitchRef.current, targetPitch, 10.0, safeDelta);
    rollRef.current = THREE.MathUtils.damp(rollRef.current, targetRoll, 10.0, safeDelta);
    posRef.current.y = THREE.MathUtils.damp(posRef.current.y, targetY, 14.0, safeDelta);

    // 5. Update 3D Group Transform
    roverGroupRef.current.position.set(posRef.current.x, posRef.current.y, posRef.current.z);
    roverGroupRef.current.rotation.set(pitchRef.current, yawRef.current, rollRef.current, 'YXZ');

    // 6. Update 6-Wheel Dynamic Rotation and Steering
    // Front wheels (idx 0, 1) steer with steeringRef
    // Mid wheels (idx 2, 3) fixed
    // Rear wheels (idx 4, 5) counter-steer for tight turn
    wheelRefs.current.forEach((wheel, idx) => {
      if (!wheel) return;
      let steerAngle = 0;
      if (idx === 0 || idx === 1) steerAngle = steeringRef.current;
      if (idx === 4 || idx === 5) steerAngle = -steeringRef.current * 0.45;

      wheel.rotation.y = steerAngle;
      // Wheel rolling rotation around axle
      const spinMesh = wheel.children[0];
      if (spinMesh) {
        spinMesh.rotation.x = wheelAngleRef.current;
      }
    });

    // 7. Instantaneous 3D Position & Telemetry Reporting
    // Always expose instantaneous rover position for zero-latency camera follow
    if (typeof window !== 'undefined') {
      (window as unknown as { __ACTIVE_ROVER_POS__?: [number, number, number] }).__ACTIVE_ROVER_POS__ = [
        posRef.current.x,
        posRef.current.y,
        posRef.current.z,
      ];
    }

    if (isDriving) {
      // Throttle React state telemetry to ~10Hz (every 100ms) to eliminate 60fps root re-rendering
      const now = performance.now();
      const shouldNotify = now - lastTelemetryTimeRef.current >= 100;

      if (shouldNotify) {
        lastTelemetryTimeRef.current = now;
        onRoverPositionChange?.([posRef.current.x, posRef.current.y, posRef.current.z]);

        let degreesHeading = (yawRef.current * (180 / Math.PI)) % 360;
        if (degreesHeading < 0) degreesHeading += 360;

        let driveMode: RoverTelemetry['driveMode'] = 'PARK';
        if (isBrakingRef.current) {
          driveMode = 'BRAKE';
        } else if (speedRef.current < -0.1) {
          driveMode = 'REVERSE';
        } else if (speedRef.current > 0.1) {
          driveMode = 'DRIVE';
        }

        const telemetry: RoverTelemetry = {
          speed: Math.abs(speedRef.current),
          speedKmh: Math.abs(speedRef.current) * 3.6,
          battery: batteryRef.current,
          totalDistance: distanceRef.current,
          heading: Math.round(degreesHeading),
          isBraking: isBrakingRef.current,
          isReversing: speedRef.current < -0.1,
          driveMode,
        };

        onTelemetryChange?.(telemetry);
      }

      if (typeof window !== 'undefined') {
        (window as unknown as { __ROVER_STATE__?: unknown }).__ROVER_STATE__ = {
          position: [posRef.current.x, posRef.current.y, posRef.current.z],
          speed: speedRef.current,
          battery: batteryRef.current,
          distance: distanceRef.current,
          isDriving: true,
        };
      }
    }
  });

  // Wheel configuration at scale 0.65
  const wheelsConfig = useMemo(
    () => [
      { id: 'FL', x: -1.42, y: 0.44, z: 1.25, isLeft: true },
      { id: 'FR', x: 1.42, y: 0.44, z: 1.25, isLeft: false },
      { id: 'ML', x: -1.42, y: 0.44, z: 0.0, isLeft: true },
      { id: 'MR', x: 1.42, y: 0.44, z: 0.0, isLeft: false },
      { id: 'RL', x: -1.42, y: 0.44, z: -1.25, isLeft: true },
      { id: 'RR', x: 1.42, y: 0.44, z: -1.25, isLeft: false },
    ],
    []
  );

  return (
    <group ref={roverGroupRef} name="lunar-rover-mmsev">
      {/* 1. NASA Space Exploration Vehicle Chassis Body */}
      {/* Shift up by +2.18m at scale 0.65 so bottom of vehicle rests perfectly above ground */}
      <group position={[0, 2.18, 0]} scale={[0.65, 0.65, 0.65]}>
        <primitive object={clonedScene} />
      </group>

      {/* 2. Six Detailed Lunar Wire-Mesh Traction Wheels with Titanium Cleats */}
      {wheelsConfig.map((w, idx) => (
        <group
          key={w.id}
          ref={(el) => {
            wheelRefs.current[idx] = el;
          }}
          position={[w.x, w.y, w.z]}
        >
          {/* Wheel spin group around X axis */}
          <group>
            {/* Main wire-mesh cylinder tire */}
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
              <cylinderGeometry args={[0.42, 0.42, 0.32, 24]} />
              <meshStandardMaterial
                color="#31353e"
                metalness={0.88}
                roughness={0.45}
                wireframe={false}
              />
            </mesh>

            {/* Titanium chevron traction treads */}
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.435, 0.435, 0.3, 12, 1, true]} />
              <meshStandardMaterial
                color="#505664"
                metalness={0.92}
                roughness={0.3}
              />
            </mesh>

            {/* Gold foil thermal hubcap */}
            <mesh position={[w.isLeft ? -0.17 : 0.17, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.18, 0.18, 0.04, 16]} />
              <meshStandardMaterial
                color="#cda33d"
                metalness={0.95}
                roughness={0.2}
              />
            </mesh>
          </group>
        </group>
      ))}

      {/* 3. High-Intensity Lunar Exploration Headlights */}
      <spotLight
        position={[0, 1.8, 1.8]}
        target-position={[0, 0.5, 20]}
        intensity={isDriving ? 4.8 : 1.2}
        angle={0.65}
        penumbra={0.4}
        color="#fffbf0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0002}
      />

      {/* Rear taillights */}
      <pointLight position={[-0.9, 1.2, -1.8]} intensity={0.8} color="#ff3333" distance={4} />
      <pointLight position={[0.9, 1.2, -1.8]} intensity={0.8} color="#ff3333" distance={4} />
    </group>
  );
}

useGLTF.preload(sevPath, '/draco/gltf/');
