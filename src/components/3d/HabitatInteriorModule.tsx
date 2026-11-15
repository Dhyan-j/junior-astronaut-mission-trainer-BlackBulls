import { useEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SuitSelectionStation } from '../game/SuitSelectionStation';
import { PLSSStation } from '../game/PLSSStation';
import { PhysicalEquipmentStations } from './PhysicalEquipmentStations';
import type { SpacesuitId } from '../../types/game';

const spaceStationPath = '/models/Space Station and Docking Bays.glb';

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
  const { scene: spaceStationScene } = useGLTF(spaceStationPath, '/draco/gltf/');

  // Sanitize materials: make sure opaque materials are solid, well-lit, and double-sided for hollow module interiors
  useEffect(() => {
    spaceStationScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => {
          m.side = THREE.DoubleSide; // Ensure hollow modules are visible from inside
          if ('transmission' in m) {
            (m as THREE.MeshPhysicalMaterial).transmission = 0;
          }
          if ('roughness' in m && typeof (m as THREE.MeshStandardMaterial).roughness === 'number') {
            (m as THREE.MeshStandardMaterial).roughness = Math.max(0.3, (m as THREE.MeshStandardMaterial).roughness);
          }
        });
      }
    });
  }, [spaceStationScene]);

  // Extract and clone specific NASA space station modules
  const {
    clonedHub,
    clonedLab,
    clonedHab,
    clonedLogistics,
    clonedAirlock,
    clonedCupola,
  } = useMemo(() => {
    let hubNode: THREE.Object3D | null = null;
    let labNode: THREE.Object3D | null = null;
    let habNode: THREE.Object3D | null = null;
    let logNode: THREE.Object3D | null = null;
    let airlockNode: THREE.Object3D | null = null;
    let cupolaNode: THREE.Object3D | null = null;

    spaceStationScene.traverse((child) => {
      if (child.name === '000-hub-six-port') hubNode = child;
      else if (child.name === '002-laboratory-module') labNode = child;
      else if (child.name === '008-habitation-module') habNode = child;
      else if (child.name === '004-logistics-module') logNode = child;
      else if (child.name === '005-airlock-module') airlockNode = child;
      else if (child.name === '011-cupola-observation-module') cupolaNode = child;
    });

    const cloneOrEmpty = (node: THREE.Object3D | null) =>
      node ? node.clone(true) : new THREE.Group();

    const cHub = cloneOrEmpty(hubNode);
    const cLab = cloneOrEmpty(labNode);
    const cHab = cloneOrEmpty(habNode);
    const cLog = cloneOrEmpty(logNode);
    const cAir = cloneOrEmpty(airlockNode);
    const cCup = cloneOrEmpty(cupolaNode);

    // Filter out duplicate or conflicting interior clutter (e.g. 015-eva-suit) from the cloned modules
    [cHub, cLab, cHab, cLog, cAir, cCup].forEach((root) => {
      root.traverse((obj) => {
        if (obj.name.toLowerCase().includes('015-eva-suit')) {
          obj.visible = false;
        }
      });
    });

    return {
      clonedHub: cHub,
      clonedLab: cLab,
      clonedHab: cHab,
      clonedLogistics: cLog,
      clonedAirlock: cAir,
      clonedCupola: cCup,
    };
  }, [spaceStationScene]);

  // Airlock doors animation refs
  const innerDoorRef = useRef<THREE.Mesh>(null);
  const outerDoorRef = useRef<THREE.Mesh>(null);
  const airlockBeaconLightRef = useRef<THREE.PointLight>(null);

  useFrame((state, delta) => {
    // Sliding Inner Airlock Hatch at Z = 3.2
    if (innerDoorRef.current) {
      const targetY = 1.15; // Kept secure/closed or open as needed
      innerDoorRef.current.position.y = THREE.MathUtils.damp(
        innerDoorRef.current.position.y,
        targetY,
        8,
        delta
      );
    }

    // Sliding Outer Blast Door at Z = 9.0
    if (outerDoorRef.current) {
      const targetY = airlockDoorOpen ? 2.8 : 1.15;
      outerDoorRef.current.position.y = THREE.MathUtils.damp(
        outerDoorRef.current.position.y,
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
    <group name="modular-spacious-habitat-pressurized-interior">
      {/* =============================================================== */}
      {/* 1. ROOM-BY-ROOM VOLUMETRIC & TASK LIGHTING                      */}
      {/* =============================================================== */}
      <ambientLight color="#d0e1fd" intensity={0.85} />

      {/* Central Six-Port Navigation Hub Overhead Lighting (Z: [-2, 2], X: [-2, 2]) */}
      <pointLight position={[0, 3.4, 0]} color="#ffffff" intensity={2.8} distance={12} decay={2} />
      <pointLight position={[0, 3.0, -1.5]} color="#64b5f6" intensity={2.0} distance={8} decay={2} />

      {/* West Suit Preparation Bay (X: [-11, -2], Z: ~0) */}
      <pointLight position={[-4.5, 3.2, 0]} color="#ffffff" intensity={2.4} distance={9} decay={2} />
      <pointLight position={[-8.5, 3.2, 0]} color="#81c784" intensity={2.4} distance={9} decay={2} />

      {/* North Science & Diagnostics Lab (X: ~0, Z: [-13, -2]) */}
      <pointLight position={[0, 3.2, -5.0]} color="#ffffff" intensity={2.4} distance={10} decay={2} />
      <pointLight position={[0, 3.2, -9.5]} color="#4dd0e1" intensity={2.6} distance={10} decay={2} />

      {/* East Life Support & ECLSS Wing (X: [2, 10], Z: ~0) */}
      <pointLight position={[4.5, 3.2, 0]} color="#ffffff" intensity={2.4} distance={9} decay={2} />
      <pointLight position={[7.5, 3.2, 0]} color="#38bdf8" intensity={2.4} distance={9} decay={2} />

      {/* South Dedicated Airlock Module (X: ~0, Z: [2, 9.5]) */}
      <pointLight position={[0, 3.0, 4.5]} color="#ffffff" intensity={2.2} distance={8} decay={2} />
      <pointLight
        ref={airlockBeaconLightRef}
        position={[0, 3.2, 7.5]}
        color={airlockCycled ? '#38b000' : '#e5a93c'}
        intensity={2.0}
        distance={8}
        decay={2}
      />

      {/* =============================================================== */}
      {/* 2. AUTHENTIC NASA MODULAR HABITAT ROOMS (GLTF MODULES)          */}
      {/* =============================================================== */}
      {/* Floor Deck alignment: Modules intrinsic bounds sit at Y ~2.0m.  */}
      {/* With Y = -1.94, composite deck sits at exactly world Y = 0.06m. */}
      <group position={[0, -1.94, 0]}>
        {/* Central Six-Port Navigation Hub (4.1m x 4.1m x 4.0m) */}
        <primitive object={clonedHub} position={[0, 0, 0]} rotation={[0, 0, 0]} />

        {/* Observation Cupola attached to Top Port of Central Hub */}
        <primitive object={clonedCupola} position={[0, 3.2, 0]} rotation={[0, 0, 0]} />

        {/* North: 002-laboratory-module (Science & Diagnostics Lab) */}
        <primitive object={clonedLab} position={[0, 0, -7.5]} rotation={[0, Math.PI, 0]} />

        {/* West: 008-habitation-module (Suit Preparation Bay) */}
        <primitive object={clonedHab} position={[-6.5, 0, 0]} rotation={[0, Math.PI / 2, 0]} />

        {/* East: 004-logistics-module (Life Support & ECLSS Wing) */}
        <primitive object={clonedLogistics} position={[6.5, 0, 0]} rotation={[0, -Math.PI / 2, 0]} />

        {/* South: 005-airlock-module (Dedicated EVA Airlock) */}
        <primitive object={clonedAirlock} position={[0, 0, 6.0]} rotation={[0, 0, 0]} />
      </group>

      {/* =============================================================== */}
      {/* 3. CONTINUOUS WALKABLE COMPOSITE FLOOR DECK (Y = 0.06m)         */}
      {/* =============================================================== */}
      {/* Smooth non-slip floor decks spanning all 5 connected rooms */}
      <group position={[0, 0.058, 0]}>
        {/* Central Hub Floor */}
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[4.4, 4.4]} />
          <meshStandardMaterial color="#212631" roughness={0.7} metalness={0.3} />
        </mesh>

        {/* West Suit Bay Floor */}
        <mesh position={[-6.2, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[8.8, 3.8]} />
          <meshStandardMaterial color="#282e3b" roughness={0.7} metalness={0.3} />
        </mesh>

        {/* North Science Lab Floor */}
        <mesh position={[0, 0, -7.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[4.0, 10.6]} />
          <meshStandardMaterial color="#232a36" roughness={0.7} metalness={0.3} />
        </mesh>

        {/* East Life Support Floor */}
        <mesh position={[6.2, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[8.0, 3.8]} />
          <meshStandardMaterial color="#242b38" roughness={0.7} metalness={0.3} />
        </mesh>

        {/* South Airlock Floor */}
        <mesh position={[0, 0, 6.0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[3.6, 7.6]} />
          <meshStandardMaterial color="#2c3340" roughness={0.7} metalness={0.3} />
        </mesh>
      </group>

      {/* =============================================================== */}
      {/* 4. DEDICATED AIRLOCK INNER & OUTER BLAST DOORS                  */}
      {/* =============================================================== */}
      {/* Inner Airlock Hatch (Between Central Hub & Airlock at Z = 3.2) */}
      <group position={[0, 0.06, 3.2]}>
        <mesh position={[-1.4, 1.25, 0]} castShadow>
          <boxGeometry args={[0.2, 2.5, 0.3]} />
          <meshStandardMaterial color="#2d333e" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[1.4, 1.25, 0]} castShadow>
          <boxGeometry args={[0.2, 2.5, 0.3]} />
          <meshStandardMaterial color="#2d333e" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 2.45, 0]} castShadow>
          <boxGeometry args={[3.0, 0.25, 0.3]} />
          <meshStandardMaterial color="#2d333e" metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Sliding Inner Door */}
        <mesh ref={innerDoorRef} position={[0, 1.15, 0]} castShadow>
          <boxGeometry args={[2.5, 2.3, 0.08]} />
          <meshStandardMaterial color="#4a5263" metalness={0.85} roughness={0.25} />
        </mesh>

        {/* Floor Threshold Plate */}
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.4, 0.5]} />
          <meshStandardMaterial color="#e5a93c" roughness={0.4} />
        </mesh>
      </group>

      {/* Airlock Depressurization Console (Mounted on East Bulkhead at [1.5, 0.06, 6.0]) */}
      <group
        position={[1.5, 0.06, 6.0]}
        rotation={[0, -Math.PI / 2, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onInteractAirlockConsole();
        }}
      >
        <mesh position={[0, 1.35, 0]} castShadow>
          <boxGeometry args={[0.45, 0.65, 0.12]} />
          <meshStandardMaterial color="#1a202c" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 1.47, 0.07]}>
          <planeGeometry args={[0.35, 0.25]} />
          <meshBasicMaterial color="#0b385e" />
        </mesh>
        <mesh position={[0, 1.19, 0.07]}>
          <circleGeometry args={[0.045, 16]} />
          <meshBasicMaterial color={airlockCycled ? '#38b000' : '#e5a93c'} />
        </mesh>
      </group>

      {/* Outer Blast Door (Airlock Egress to Lunar Surface at Z = 9.0) */}
      <group position={[0, 0.06, 9.0]}>
        <mesh position={[-1.4, 1.25, 0]} castShadow>
          <boxGeometry args={[0.2, 2.5, 0.3]} />
          <meshStandardMaterial color="#2d333e" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[1.4, 1.25, 0]} castShadow>
          <boxGeometry args={[0.2, 2.5, 0.3]} />
          <meshStandardMaterial color="#2d333e" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 2.45, 0]} castShadow>
          <boxGeometry args={[3.0, 0.25, 0.3]} />
          <meshStandardMaterial color="#2d333e" metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Sliding Outer Blast Door */}
        <mesh ref={outerDoorRef} position={[0, 1.15, 0]} castShadow>
          <boxGeometry args={[2.5, 2.3, 0.1]} />
          <meshStandardMaterial color="#555c6d" metalness={0.85} roughness={0.25} />
        </mesh>

        {/* Egress Floor Plate */}
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.4, 0.6]} />
          <meshStandardMaterial color="#e5a93c" roughness={0.4} />
        </mesh>
      </group>

      {/* =============================================================== */}
      {/* 5. PHYSICAL EQUIPMENT STATIONS ACROSS DEDICATED ROOMS           */}
      {/* =============================================================== */}
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

      {/* West Suit Preparation Bay: Spacesuit Selection Gallery at [-8.5, 0.06, 0.0] */}
      <SuitSelectionStation
        selectedSuit={selectedSuit}
        onSelectSuit={onSelectSuit}
        position={[-8.5, 0.06, 0.0]}
        rotation={[0, Math.PI / 2, 0]}
      />

      {/* West Suit Preparation Bay: PLSS Gantry at [-5.5, 0.06, 1.8] */}
      <PLSSStation
        isPLSSInstalledOnPlayer={plssInstalled}
        position={[-5.5, 0.06, 1.8]}
        rotation={[0, 0, 0]}
      />
    </group>
  );
}

useGLTF.preload(spaceStationPath, '/draco/gltf/');
