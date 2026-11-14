import { useEffect, useMemo, useRef } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { ProceduralPLSSModel } from './ProceduralPLSSModel';
import { playFootstepSound } from '../../utils/sound';
import type { SpacesuitId } from '../../types/game';

const RIGGED_ASTRONAUT_PATH = '/models/astronaut_rigged.glb';

export interface AvatarMotionState {
  isMoving: boolean;
  isRunning: boolean;
  isGrounded: boolean;
}

interface SuitAvatarProps {
  suitId: SpacesuitId;
  showPLSS?: boolean;
  motionStateRef?: React.RefObject<AvatarMotionState>;
  visible?: boolean;
}

export function SuitAvatar({
  suitId,
  showPLSS = false,
  motionStateRef,
  visible = true,
}: SuitAvatarProps) {
  // Load rigged astronaut model and animation tracks
  const { scene, animations } = useGLTF(RIGGED_ASTRONAUT_PATH);

  // Group container for animations and model
  const groupRef = useRef<THREE.Group>(null);

  // Use SkeletonUtils.clone to properly clone the SkinnedMesh and its 24-bone Armature
  const clonedScene = useMemo(() => {
    const clone = SkeletonUtils.clone(scene) as THREE.Group;
    clone.traverse((child) => {
      if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
        const mesh = child as THREE.SkinnedMesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.frustumCulled = false; // Prevent culling when animation stretches bounding box
      }
    });
    return clone;
  }, [scene]);

  // Bind animation tracks to the cloned armature
  const { actions, mixer } = useAnimations(animations, groupRef);

  // Spine bone reference for dynamic PLSS attachment
  const spineBoneRef = useRef<THREE.Bone | null>(null);
  const plssGroupRef = useRef<THREE.Group>(null);

  // Locate the Spine02 bone in cloned skeleton
  useEffect(() => {
    let spine: THREE.Bone | null = null;
    clonedScene.traverse((obj) => {
      if ((obj as THREE.Bone).isBone && obj.name === 'Spine02') {
        spine = obj as THREE.Bone;
      }
    });
    spineBoneRef.current = spine;
  }, [clonedScene]);

  // State tracking for smooth cross-fades
  const currentActionRef = useRef<'walk' | 'run' | 'idle'>('idle');
  const prevTimeRef = useRef(0);
  const equipTransitionRef = useRef(0.0);

  // Reset equipment transition counter on suit change
  useEffect(() => {
    equipTransitionRef.current = 0.0;
  }, [suitId]);

  // Animation controller: cross-fading walk/run/idle + footstep synchronization
  useFrame((state, delta) => {
    if (!groupRef.current || !actions) return;

    const motion = motionStateRef?.current || {
      isMoving: false,
      isRunning: false,
      isGrounded: true,
    };

    // Determine target animation state
    let targetAction: 'walk' | 'run' | 'idle' = 'idle';
    if (motion.isMoving && motion.isGrounded) {
      targetAction = motion.isRunning ? 'run' : 'walk';
    }

    // Handle cross-fading between states
    if (targetAction !== currentActionRef.current) {
      const prevActionName = currentActionRef.current;
      currentActionRef.current = targetAction;

      const crossFadeDuration = 0.22; // smooth 220ms blend

      if (targetAction === 'idle') {
        // Fade out active walk or run
        if (prevActionName !== 'idle' && actions[prevActionName]) {
          actions[prevActionName]?.fadeOut(crossFadeDuration);
        }
      } else {
        const nextAction = actions[targetAction];
        if (nextAction) {
          nextAction.reset();
          if (prevActionName !== 'idle' && actions[prevActionName]) {
            actions[prevActionName]?.fadeOut(crossFadeDuration);
            nextAction.fadeIn(crossFadeDuration);
          } else {
            nextAction.fadeIn(crossFadeDuration);
          }
          nextAction.play();
        }
      }
    }

    // Footstep audio synchronization based on animation phase
    if (motion.isMoving && motion.isGrounded) {
      const activeClipAction = actions[currentActionRef.current];
      if (activeClipAction) {
        const clipDuration = activeClipAction.getClip().duration;
        const currentTime = activeClipAction.time % clipDuration;
        const prevTime = prevTimeRef.current;

        if (currentActionRef.current === 'walk') {
          // Walk cycle (1.0s): Left foot impact ~0.25s, Right foot impact ~0.75s
          if ((prevTime < 0.25 && currentTime >= 0.25) || (prevTime < 0.75 && currentTime >= 0.75)) {
            playFootstepSound();
          }
        } else if (currentActionRef.current === 'run') {
          // Run cycle (0.625s): Left foot impact ~0.16s, Right foot impact ~0.47s
          if ((prevTime < 0.16 && currentTime >= 0.16) || (prevTime < 0.47 && currentTime >= 0.47)) {
            playFootstepSound();
          }
        }
        prevTimeRef.current = currentTime;
      }
    } else {
      prevTimeRef.current = 0;
    }

    // Idle breathing & low-gravity jump procedural posture adjustments
    if (equipTransitionRef.current < 1.0) {
      equipTransitionRef.current = Math.min(1.0, equipTransitionRef.current + delta * 3.5);
    }
    const equipSettleY = (1.0 - equipTransitionRef.current) * 0.15;

    const time = state.clock.elapsedTime;

    if (!motion.isGrounded) {
      // Airborne lunar hop posture: slight body incline & leg hang
      groupRef.current.position.y = equipSettleY + 0.05;
      groupRef.current.rotation.x = THREE.MathUtils.damp(
        groupRef.current.rotation.x,
        -0.06,
        8,
        delta
      );
    } else if (!motion.isMoving) {
      // Natural idle standing pose with subtle chest/spine breathing
      const breathing = Math.sin(time * 1.8) * 0.005;
      groupRef.current.position.y = equipSettleY + breathing;
      groupRef.current.rotation.x = THREE.MathUtils.damp(
        groupRef.current.rotation.x,
        0,
        8,
        delta
      );
    } else {
      groupRef.current.position.y = equipSettleY;
      groupRef.current.rotation.x = THREE.MathUtils.damp(
        groupRef.current.rotation.x,
        0,
        8,
        delta
      );
    }

    // Dynamic PLSS backpack orientation following spine movement
    if (plssGroupRef.current && spineBoneRef.current) {
      // Follow the spine's pitch and sway
      const spineRot = spineBoneRef.current.rotation;
      plssGroupRef.current.rotation.x = THREE.MathUtils.damp(
        plssGroupRef.current.rotation.x,
        spineRot.x * 0.5,
        12,
        delta
      );
      plssGroupRef.current.rotation.z = THREE.MathUtils.damp(
        plssGroupRef.current.rotation.z,
        spineRot.z * 0.5,
        12,
        delta
      );
    }
  });

  // Clean up animation mixer on unmount
  useEffect(() => {
    return () => {
      if (mixer) {
        mixer.stopAllAction();
      }
    };
  }, [mixer]);

  return (
    <group
      name={`astronaut-avatar-${suitId}`}
      visible={visible}
    >
      <group ref={groupRef}>
        {/* Real Rigged Spacesuit Model with 24 Humanoid Bones */}
        <primitive object={clonedScene} scale={[1.0, 1.0, 1.0]} />

        {/* Procedurally Attached PLSS Life Support Backpack mounted on upper back */}
        {showPLSS && (
          <group ref={plssGroupRef} position={[0, 1.25, -0.28]}>
            <ProceduralPLSSModel
              position={[0, 0, 0]}
              rotation={[0, Math.PI, 0]}
              scale={0.86}
              isMounted
            />
          </group>
        )}
      </group>
    </group>
  );
}

// Preload rigged astronaut model
useGLTF.preload(RIGGED_ASTRONAUT_PATH);
