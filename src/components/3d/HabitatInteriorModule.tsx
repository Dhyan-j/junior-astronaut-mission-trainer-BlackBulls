import { useEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SuitSelectionStation } from '../game/SuitSelectionStation';
import { PLSSStation } from '../game/PLSSStation';
import { PhysicalEquipmentStations } from './PhysicalEquipmentStations';
import type { SpacesuitId } from '../../types/game';

const interiorPath = '/models/habitat_interior.glb';

interface HabitatInteriorModuleProps {
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

export function HabitatInteriorModule({
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
  onInteractAirlockConsole,
}: HabitatInteriorModuleProps) {
  const { scene: interiorScene } = useGLTF(interiorPath, '/draco/gltf/');

  // Sanitize materials: make sure opaque materials are solid and well-lit
  useEffect(() => {
    interiorScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => {
          if ('transmission' in m) {
            (m as THREE.MeshPhysicalMaterial).transmission = 0;
          }
          if ('roughness' in m && typeof (m as THREE.MeshStandardMaterial).roughness === 'number') {
            (m as THREE.MeshStandardMaterial).roughness = Math.max(0.3, (m as THREE.MeshStandardMaterial).roughness);
          }
        });
      }
    });
  }, [interiorScene]);

  // Clone scene to avoid shared mutation
  const clonedInterior = useMemo(() => interiorScene.clone(true), [interiorScene]);

  // Airlock door animation ref
  const exitDoorRef = useRef<THREE.Mesh>(null);
  const airlockBeaconLightRef = useRef<THREE.PointLight>(null);

  useFrame((state, delta) => {
    if (exitDoorRef.current) {
      const targetY = airlockDoorOpen ? 2.8 : 1.15;
      exitDoorRef.current.position.y = THREE.MathUtils.damp(
        exitDoorRef.current.position.y,
        targetY,
        8,
        delta
      );
    }

    if (airlockBeaconLightRef.current) {
      airlockBeaconLightRef.current.intensity =
        1.0 + Math.sin(state.clock.elapsedTime * 2.5) * 0.3;
    }
  });

  return (
    <group name="habitat-pressurized-interior">
      {/* =============================================================== */}
      {/* 1. INTERIOR AMBIENT & CEILING PANEL LIGHTING                   */}
      {/* =============================================================== */}
      <ambientLight color="#c8dcfa" intensity={0.8} />

      {/* Central Work Bay overhead task lights */}
      <pointLight position={[0, 2.5, 0]} color="#ffffff" intensity={2.5} distance={10} decay={2} />
      <pointLight position={[-2.0, 2.5, 1.8]} color="#ffffff" intensity={2.2} distance={8} decay={2} />
      <pointLight position={[1.5, 2.5, 1.8]} color="#ffffff" intensity={2.2} distance={8} decay={2} />
      <pointLight position={[-1.2, 2.2, 0.2]} color="#64b5f6" intensity={2.0} distance={6} decay={2} />
      <pointLight position={[0.1, 2.2, -2.3]} color="#81c784" intensity={2.0} distance={6} decay={2} />

      {/* Airlock chamber beacon light */}
      <pointLight
        ref={airlockBeaconLightRef}
        position={[0, 2.5, 3.2]}
        color={airlockCycled ? '#38b000' : '#e5a93c'}
        intensity={1.8}
        distance={7}
        decay={2}
      />

      {/* =============================================================== */}
      {/* 2. AUTHENTIC NASA INTERIOR WORK BAY GEOMETRY (GLTF ASSET)     */}
      {/* =============================================================== */}
      <group position={[0, 0.06, 0]}>
        <primitive object={clonedInterior} />
      </group>

      {/* =============================================================== */}
      {/* 3. AIRLOCK ACCESS HATCH & SLIDING EGRESS DOOR (z = 3.6 to 4.0)  */}
      {/* =============================================================== */}
      <group position={[0, 0.06, 3.6]}>
        {/* Airlock Bulkhead Frame */}
        <mesh position={[-0.95, 1.25, 0]} castShadow>
          <boxGeometry args={[0.2, 2.4, 0.3]} />
          <meshStandardMaterial color="#2d333e" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0.95, 1.25, 0]} castShadow>
          <boxGeometry args={[0.2, 2.4, 0.3]} />
          <meshStandardMaterial color="#2d333e" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 2.35, 0]} castShadow>
          <boxGeometry args={[2.1, 0.2, 0.3]} />
          <meshStandardMaterial color="#2d333e" metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Sliding Blast Door */}
        <mesh ref={exitDoorRef} position={[0, 1.15, 0]} castShadow>
          <boxGeometry args={[1.7, 2.2, 0.08]} />
          <meshStandardMaterial color="#555c6d" metalness={0.85} roughness={0.25} />
        </mesh>

        {/* Threshold Floor Plate */}
        <mesh position={[0, 0.01, -0.4]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.6, 0.5]} />
          <meshStandardMaterial color="#e5a93c" roughness={0.4} />
        </mesh>

        {/* Airlock Depressurization Console */}
        <group
          position={[1.15, 1.35, -0.5]}
          rotation={[0, -Math.PI / 2, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onInteractAirlockConsole();
          }}
        >
          <mesh castShadow>
            <boxGeometry args={[0.45, 0.65, 0.12]} />
            <meshStandardMaterial color="#1a202c" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.12, 0.07]}>
            <planeGeometry args={[0.35, 0.25]} />
            <meshBasicMaterial color="#0b385e" />
          </mesh>
          <mesh position={[0, -0.16, 0.07]}>
            <circleGeometry args={[0.045, 16]} />
            <meshBasicMaterial color={airlockCycled ? '#38b000' : '#e5a93c'} />
          </mesh>
        </group>
      </group>

      {/* =============================================================== */}
      {/* 4. PHYSICAL EQUIPMENT STATIONS (MAPPED TO REAL GLB RACKS)      */}
      {/* =============================================================== */}
      {/* Life Support Valves & Gauges mounted on authentic equipment racks */}
      <PhysicalEquipmentStations
        oxygenChecked={oxygenChecked}
        pressureChecked={pressureChecked}
        commsVerified={commsVerified}
        coolingInspected={coolingInspected}
        onInteractOxygen={onInteractOxygen}
        onInteractPressure={onInteractPressure}
        onInteractComms={onInteractComms}
        onInteractCooling={onInteractCooling}
      />

      {/* Spacesuit Selection Gallery at authentic 015-eva-suit station */}
      <SuitSelectionStation
        selectedSuit={selectedSuit}
        onSelectSuit={onSelectSuit}
        position={[-1.2, 0.06, 0.2]}
        rotation={[0, Math.PI, 0]}
      />

      {/* PLSS Life Support Servicing Station at stowage rack */}
      <PLSSStation
        isPLSSInstalledOnPlayer={plssInstalled}
        position={[-2.6, 0.06, -2.2]}
        rotation={[0, Math.PI / 2, 0]}
      />
    </group>
  );
}

useGLTF.preload(interiorPath, '/draco/gltf/');
