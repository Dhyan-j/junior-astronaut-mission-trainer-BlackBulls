import { useMemo, useEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SuitSelectionStation } from '../game/SuitSelectionStation';
import { PLSSStation } from '../game/PLSSStation';
import type { SpacesuitId } from '../../types/game';

const lunarInteriorGlbPath = '/models/lunar_base_interior.glb';

interface LunarBaseInteriorProps {
  selectedSuit: SpacesuitId;
  plssInstalled: boolean;
  oxygenChecked: boolean;
  pressureChecked: boolean;
  commsVerified: boolean;
  coolingInspected: boolean;
  airlockCycled: boolean;
  airlockDoorOpen: boolean;
  onSelectSuit: (id: SpacesuitId) => void;
  onInteractOxygen: () => void;
  onInteractPressure: () => void;
  onInteractComms: () => void;
  onInteractCooling: () => void;
  onInteractAirlockConsole: () => void;
}

export function LunarBaseInterior({
  selectedSuit,
  plssInstalled,
  oxygenChecked,
  pressureChecked,
  commsVerified,
  coolingInspected,
  airlockCycled,
  airlockDoorOpen,
  onSelectSuit,
  onInteractOxygen,
  onInteractPressure,
  onInteractComms,
  onInteractCooling,
  onInteractAirlockConsole: _onInteractAirlockConsole,
}: LunarBaseInteriorProps) {
  const { scene } = useGLTF(lunarInteriorGlbPath);
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  // Animated sliding door references inside the model
  const outerDoorLeftRef = useRef<THREE.Object3D | null>(null);
  const outerDoorRightRef = useRef<THREE.Object3D | null>(null);
  const innerDoorLeftRef = useRef<THREE.Object3D | null>(null);
  const innerDoorRightRef = useRef<THREE.Object3D | null>(null);

  useEffect(() => {
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => {
          m.side = THREE.DoubleSide; // Ensure all roof and wall surfaces render without backface culling
          if ('roughness' in m && typeof (m as THREE.MeshStandardMaterial).roughness === 'number') {
            (m as THREE.MeshStandardMaterial).roughness = THREE.MathUtils.clamp(
              (m as THREE.MeshStandardMaterial).roughness,
              0.2,
              0.8
            );
          }
        });
      }

      // Locate animated airlock doors by name
      if (child.name.includes('outer-left')) {
        outerDoorLeftRef.current = child;
      } else if (child.name.includes('outer-right')) {
        outerDoorRightRef.current = child;
      } else if (child.name.includes('inner-left')) {
        innerDoorLeftRef.current = child;
      } else if (child.name.includes('inner-right')) {
        innerDoorRightRef.current = child;
      }
    });

    if (typeof window !== 'undefined') {
      const floorMeshes: { name: string; minY: number; maxY: number }[] = [];
      clonedScene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const box = new THREE.Box3().setFromObject(mesh);
          if (box.min.y >= 0.5 && box.max.y <= 1.5 && (box.max.x - box.min.x) > 1.0) {
            floorMeshes.push({
              name: mesh.name || (mesh.parent ? mesh.parent.name : ''),
              minY: box.min.y,
              maxY: box.max.y,
            });
          }
        }
      });
      (window as unknown as { __INTERIOR_FLOOR_DEBUG__?: unknown }).__INTERIOR_FLOOR_DEBUG__ = {
        floorMeshesCount: floorMeshes.length,
        floorMeshes: floorMeshes.slice(0, 10),
      };
      console.log('[LunarBaseInterior] Detected floor meshes:', floorMeshes.slice(0, 10));
    }
  }, [clonedScene]);

  // Door sliding animations
  useFrame((_, delta) => {
    // Outer blast door (opens when airlock door is open)
    const targetOuterXOffset = airlockDoorOpen ? 0.75 : 0.0;
    if (outerDoorLeftRef.current) {
      outerDoorLeftRef.current.position.x = THREE.MathUtils.damp(
        outerDoorLeftRef.current.position.x,
        -targetOuterXOffset,
        6,
        delta
      );
    }
    if (outerDoorRightRef.current) {
      outerDoorRightRef.current.position.x = THREE.MathUtils.damp(
        outerDoorRightRef.current.position.x,
        targetOuterXOffset,
        6,
        delta
      );
    }

    // Inner airlock hatch (opens when inner hatch is cycled / not depressurizing)
    const targetInnerXOffset = airlockCycled ? 0.0 : 0.75;
    if (innerDoorLeftRef.current) {
      innerDoorLeftRef.current.position.x = THREE.MathUtils.damp(
        innerDoorLeftRef.current.position.x,
        -targetInnerXOffset,
        6,
        delta
      );
    }
    if (innerDoorRightRef.current) {
      innerDoorRightRef.current.position.x = THREE.MathUtils.damp(
        innerDoorRightRef.current.position.x,
        targetInnerXOffset,
        6,
        delta
      );
    }
  });

  return (
    <group name="lunar-base-interior-environment">
      {/* 1. Complete authentic 28.14m x 41.04m Lunar Base Model */}
      <primitive object={clonedScene} />

      {/* 2. Tailored Volumetric Architectural Interior Lighting */}
      <ambientLight intensity={0.45} color="#dbeafe" />

      {/* Airlock Chamber Warm Overhead Lighting */}
      <pointLight position={[0.0, 2.5, 21.0]} intensity={1.8} distance={7} color="#38bdf8" decay={2} />

      {/* South Access Corridor Linear Lighting */}
      <pointLight position={[0.0, 2.6, 17.0]} intensity={1.5} distance={8} color="#e2e8f0" decay={2} />
      <pointLight position={[0.0, 2.6, 11.0]} intensity={1.5} distance={8} color="#e2e8f0" decay={2} />
      <pointLight position={[0.0, 2.6, 5.0]} intensity={1.5} distance={8} color="#e2e8f0" decay={2} />

      {/* Cargo Bay Industrial Floodlights */}
      <pointLight position={[9.5, 4.6, 16.0]} intensity={2.8} distance={15} color="#f8fafc" decay={2} />

      {/* Crew Quarters & Suit Prep Bay Inviting Ambient Light */}
      <pointLight position={[-9.5, 2.8, -3.0]} intensity={2.2} distance={10} color="#fed7aa" decay={2} />
      <pointLight position={[-12.0, 2.8, -2.5]} intensity={1.6} distance={8} color="#38bdf8" decay={2} />

      {/* Engineering Bay Reactor Core Glow & Work Lights */}
      <pointLight position={[10.5, 3.2, -3.0]} intensity={3.5} distance={12} color="#06b6d4" decay={2} />
      <pointLight position={[7.5, 3.0, -4.5]} intensity={2.0} distance={8} color="#f59e0b" decay={2} />

      {/* Command Bridge High-Tech Cyan & Navy Mood Lighting */}
      <pointLight position={[0.0, 3.0, -14.0]} intensity={2.6} distance={11} color="#38bdf8" decay={2} />
      <pointLight position={[-3.5, 2.8, -14.5]} intensity={1.4} distance={6} color="#818cf8" decay={2} />
      <pointLight position={[3.5, 2.8, -14.5]} intensity={1.4} distance={6} color="#818cf8" decay={2} />

      {/* Medbay Clean White Sanitary Light */}
      <pointLight position={[-7.0, 2.8, 5.0]} intensity={2.0} distance={8} color="#f0fdf4" decay={2} />

      {/* 3. Interactive Equipment Stations mapped to Authentic Model Coordinates */}
      {/* Step 4: Crew Quarters - Suit Selection Station */}
      <group position={[-12.2, 1.14, -2.5]}>
        <SuitSelectionStation
          selectedSuit={selectedSuit}
          onSelectSuit={onSelectSuit}
        />
      </group>

      {/* Step 6: Engineering Bay - PLSS Life Support Gantry */}
      <group position={[7.8, 1.14, -5.2]} rotation={[0, -Math.PI / 2, 0]}>
        <PLSSStation isPLSSInstalledOnPlayer={plssInstalled} />
      </group>

      {/* Step 5: Crew Quarters - Component Inspection Glovebox Bench */}
      <group position={[-5.0, 1.14, -5.0]}>
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[1.6, 0.9, 0.6]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 1.05, 0]}>
          <boxGeometry args={[1.2, 0.5, 0.5]} />
          <meshPhysicalMaterial color="#38bdf8" transmission={0.7} roughness={0.1} transparent opacity={0.8} />
        </mesh>
      </group>

      {/* Step 7: Engineering Bay - High-Pressure O2 Supply Manifold */}
      <group
        position={[12.8, 1.14, -4.5]}
        onClick={onInteractOxygen}
      >
        <mesh position={[0, 0.9, 0]}>
          <cylinderGeometry args={[0.35, 0.35, 1.8, 16]} />
          <meshStandardMaterial color={oxygenChecked ? '#22c55e' : '#0284c7'} metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* Step 8: Command Bridge - Suit Pressure Diagnostic Console */}
      <group
        position={[-3.8, 1.14, -14.5]}
        onClick={onInteractPressure}
      >
        <mesh position={[0, 0.7, 0]}>
          <boxGeometry args={[0.7, 0.8, 0.8]} />
          <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, 1.15, 0]} rotation={[-0.4, 0, 0]}>
          <planeGeometry args={[0.6, 0.4]} />
          <meshBasicMaterial color={pressureChecked ? '#22c55e' : '#38bdf8'} />
        </mesh>
      </group>

      {/* Step 9: Command Bridge - Mission Comms Radio Terminal */}
      <group
        position={[3.8, 1.14, -14.5]}
        onClick={onInteractComms}
      >
        <mesh position={[0, 0.7, 0]}>
          <boxGeometry args={[0.7, 0.8, 0.8]} />
          <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, 1.15, 0]} rotation={[-0.4, 0, 0]}>
          <planeGeometry args={[0.6, 0.4]} />
          <meshBasicMaterial color={commsVerified ? '#22c55e' : '#f59e0b'} />
        </mesh>
      </group>

      {/* Step 10: Engineering Bay - LCVG Cooling Chiller Loop */}
      <group
        position={[7.0, 1.14, -2.5]}
        onClick={onInteractCooling}
      >
        <mesh position={[0, 0.9, 0]}>
          <cylinderGeometry args={[0.35, 0.35, 1.8, 16]} />
          <meshStandardMaterial color={coolingInspected ? '#22c55e' : '#3b82f6'} metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
}

useGLTF.preload(lunarInteriorGlbPath);
