import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface EnterableHabitatProps {
  airlockDoorOpen: boolean;
  innerDoorOpen: boolean;
  onToggleOuterDoor?: () => void;
  onToggleInnerDoor?: () => void;
}

export function EnterableHabitat({
  airlockDoorOpen,
  innerDoorOpen,
}: EnterableHabitatProps) {
  const outerDoorRef = useRef<THREE.Mesh>(null);
  const innerDoorRef = useRef<THREE.Mesh>(null);
  const airlockLightRef = useRef<THREE.PointLight>(null);

  // Smoothly animate sliding doors
  useFrame((state, delta) => {
    if (outerDoorRef.current) {
      const targetY = airlockDoorOpen ? 3.1 : 1.15;
      outerDoorRef.current.position.y = THREE.MathUtils.damp(
        outerDoorRef.current.position.y,
        targetY,
        8,
        delta
      );
    }

    if (innerDoorRef.current) {
      const targetY = innerDoorOpen ? 3.1 : 1.15;
      innerDoorRef.current.position.y = THREE.MathUtils.damp(
        innerDoorRef.current.position.y,
        targetY,
        8,
        delta
      );
    }

    if (airlockLightRef.current) {
      airlockLightRef.current.intensity = 1.2 + Math.sin(state.clock.elapsedTime * 2.5) * 0.25;
    }
  });

  return (
    <group name="enterable-habitat-interior">
      {/* ================================================================= */}
      {/* 1. HABITAT DECK / FLOORING (spanning x: -14.8 to -3.0, z: -14.8 to -1.6) */}
      {/* ================================================================= */}
      <mesh position={[-8.9, 0.05, -8.2]} receiveShadow>
        <boxGeometry args={[11.8, 0.1, 13.2]} />
        <meshStandardMaterial color="#22262e" roughness={0.65} metalness={0.4} />
      </mesh>

      {/* Non-slip composite deck plating with textured grid lines */}
      <mesh position={[-8.9, 0.105, -8.2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[11.6, 13.0]} />
        <meshStandardMaterial color="#2d333e" roughness={0.7} metalness={0.3} />
      </mesh>

      {/* Entry Ramp at [-3.5, 0.04, -1.3] connecting exterior regolith to interior deck */}
      <mesh position={[-3.5, 0.04, -1.3]} rotation={[0.08, 0, 0]} receiveShadow>
        <boxGeometry args={[1.6, 0.06, 0.8]} />
        <meshStandardMaterial color="#353b47" roughness={0.6} metalness={0.4} />
      </mesh>

      {/* Yellow/Black hazard threshold stripe entering airlock */}
      <mesh position={[-3.5, 0.11, -1.8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.4, 0.35]} />
        <meshStandardMaterial color="#e5a93c" roughness={0.4} />
      </mesh>

      {/* ================================================================= */}
      {/* 2. CEILING & STRUCTURAL ROOF TRUSSES (y = 2.8)                    */}
      {/* ================================================================= */}
      <mesh position={[-8.9, 2.8, -8.2]}>
        <boxGeometry args={[11.8, 0.1, 13.2]} />
        <meshStandardMaterial color="#1a1e24" roughness={0.9} />
      </mesh>

      {/* Cross ceiling structural girders */}
      <mesh position={[-8.9, 2.74, -6.0]}>
        <boxGeometry args={[11.6, 0.12, 0.2]} />
        <meshStandardMaterial color="#353b47" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[-8.9, 2.74, -10.5]}>
        <boxGeometry args={[11.6, 0.12, 0.2]} />
        <meshStandardMaterial color="#353b47" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[-8.5, 2.74, -8.2]}>
        <boxGeometry args={[0.2, 0.12, 13.0]} />
        <meshStandardMaterial color="#353b47" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* ================================================================= */}
      {/* 3. EXTERIOR ENCLOSURE WALLS                                       */}
      {/* ================================================================= */}
      {/* North Wall (z = -14.8) */}
      <mesh position={[-8.9, 1.45, -14.8]} castShadow receiveShadow>
        <boxGeometry args={[11.8, 2.7, 0.2]} />
        <meshStandardMaterial color="#424957" roughness={0.5} metalness={0.3} />
      </mesh>

      {/* West Wall (x = -14.8) */}
      <mesh position={[-14.8, 1.45, -8.2]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 2.7, 13.2]} />
        <meshStandardMaterial color="#424957" roughness={0.5} metalness={0.3} />
      </mesh>

      {/* East Wall (x = -3.0) */}
      <mesh position={[-3.0, 1.45, -8.2]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 2.7, 13.2]} />
        <meshStandardMaterial color="#424957" roughness={0.5} metalness={0.3} />
      </mesh>

      {/* South Wall West segment (left of entrance, x: -14.8 to -4.3) */}
      <mesh position={[-9.55, 1.45, -1.6]} castShadow receiveShadow>
        <boxGeometry args={[10.5, 2.7, 0.2]} />
        <meshStandardMaterial color="#424957" roughness={0.5} metalness={0.3} />
      </mesh>

      {/* South Wall East segment (right of entrance, x: -2.8 to -3.0) */}
      <mesh position={[-2.9, 1.45, -1.6]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 2.7, 0.2]} />
        <meshStandardMaterial color="#424957" roughness={0.5} metalness={0.3} />
      </mesh>

      {/* Door Header above outer entrance */}
      <mesh position={[-3.55, 2.5, -1.6]} castShadow>
        <boxGeometry args={[1.5, 0.6, 0.2]} />
        <meshStandardMaterial color="#373d48" roughness={0.5} metalness={0.4} />
      </mesh>

      {/* ================================================================= */}
      {/* 4. ROOM 1: AIRLOCK CHAMBER & AUTOMATED SLIDING DOORS (z: -3.4 to -1.6) */}
      {/* ================================================================= */}
      {/* Outer Door Frame at [-3.5, 0, -1.8] */}
      <group position={[-3.5, 0, -1.8]}>
        <mesh position={[-0.72, 1.25, 0]} castShadow>
          <boxGeometry args={[0.16, 2.4, 0.25]} />
          <meshStandardMaterial color="#d99b26" metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[0.72, 1.25, 0]} castShadow>
          <boxGeometry args={[0.16, 2.4, 0.25]} />
          <meshStandardMaterial color="#d99b26" metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[0, 2.4, 0]} castShadow>
          <boxGeometry args={[1.6, 0.16, 0.25]} />
          <meshStandardMaterial color="#d99b26" metalness={0.6} roughness={0.4} />
        </mesh>

        {/* Sliding Outer Blast Door */}
        <mesh ref={outerDoorRef} position={[0, 1.15, 0]} castShadow>
          <boxGeometry args={[1.28, 2.15, 0.08]} />
          <meshStandardMaterial color="#5a6170" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>

      {/* Airlock Chamber Partition Wall (z = -3.4) */}
      {/* West segment (x: -6.5 to -4.3) */}
      <mesh position={[-5.4, 1.45, -3.4]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 2.7, 0.15]} />
        <meshStandardMaterial color="#3f4552" roughness={0.6} metalness={0.3} />
      </mesh>
      {/* Inner Door Header */}
      <mesh position={[-3.55, 2.5, -3.4]} castShadow>
        <boxGeometry args={[1.5, 0.6, 0.15]} />
        <meshStandardMaterial color="#3f4552" roughness={0.6} metalness={0.3} />
      </mesh>

      {/* Sliding Inner Blast Door */}
      <mesh
        ref={innerDoorRef}
        position={[-3.55, 1.15, -3.4]}
        castShadow
      >
        <boxGeometry args={[1.26, 2.15, 0.06]} />
        <meshStandardMaterial color="#4a5363" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Airlock Wall Partition between airlock and prep room west side */}
      <mesh position={[-5.0, 1.45, -2.5]} castShadow receiveShadow>
        <boxGeometry args={[0.15, 2.7, 1.6]} />
        <meshStandardMaterial color="#3f4552" roughness={0.6} metalness={0.3} />
      </mesh>

      {/* Airlock Overhead Inspection Light */}
      <pointLight
        ref={airlockLightRef}
        position={[-3.6, 2.45, -2.5]}
        color="#70d6ff"
        intensity={1.5}
        distance={5}
        decay={2}
      />

      {/* Airlock Interior Depressurization Control Console */}
      <group position={[-4.85, 1.35, -2.5]} rotation={[0, Math.PI / 2, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.5, 0.75, 0.12]} />
          <meshStandardMaterial color="#1a202c" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.12, 0.07]}>
          <planeGeometry args={[0.42, 0.32]} />
          <meshBasicMaterial color="#0b385e" />
        </mesh>
        <mesh position={[0, -0.2, 0.07]}>
          <circleGeometry args={[0.045, 16]} />
          <meshBasicMaterial color={airlockDoorOpen ? '#38b000' : '#e5a93c'} />
        </mesh>
      </group>

      {/* ================================================================= */}
      {/* 5. ROOM 2: SUIT PREPARATION STAGING ROOM (x: -6.5 to -3.0, z: -6.0 to -3.4) */}
      {/* ================================================================= */}
      {/* Wall separating Suit Prep and Spacesuit Storage (x = -6.5, with doorway z: -5.4 to -4.0) */}
      <mesh position={[-6.5, 1.45, -2.6]} castShadow receiveShadow>
        <boxGeometry args={[0.15, 2.7, 1.6]} />
        <meshStandardMaterial color="#3f4552" roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[-6.5, 1.45, -5.7]} castShadow receiveShadow>
        <boxGeometry args={[0.15, 2.7, 0.6]} />
        <meshStandardMaterial color="#3f4552" roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[-6.5, 2.5, -4.7]} castShadow>
        <boxGeometry args={[0.15, 0.6, 1.4]} />
        <meshStandardMaterial color="#3f4552" roughness={0.6} metalness={0.3} />
      </mesh>

      {/* Doorway Sign: "ROOM 3 - SPACESUIT STORAGE" */}
      <mesh position={[-6.42, 2.22, -4.7]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[1.2, 0.22]} />
        <meshStandardMaterial color="#0b3d91" roughness={0.4} />
      </mesh>

      {/* Wall separating Suit Prep and Mission Control (z = -6.0, with doorway x: -5.7 to -4.3) */}
      <mesh position={[-7.5, 1.45, -6.0]} castShadow receiveShadow>
        <boxGeometry args={[2.0, 2.7, 0.15]} />
        <meshStandardMaterial color="#3f4552" roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[-3.65, 1.45, -6.0]} castShadow receiveShadow>
        <boxGeometry args={[1.3, 2.7, 0.15]} />
        <meshStandardMaterial color="#3f4552" roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[-5.0, 2.5, -6.0]} castShadow>
        <boxGeometry args={[1.4, 0.6, 0.15]} />
        <meshStandardMaterial color="#3f4552" roughness={0.6} metalness={0.3} />
      </mesh>

      {/* Staging Tool Benches & Glove Inspection Station */}
      <group position={[-5.2, 0.1, -4.8]}>
        <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.6, 0.8, 0.6]} />
          <meshStandardMaterial color="#303642" roughness={0.5} metalness={0.6} />
        </mesh>
        <mesh position={[-0.45, 0.9, 0]} castShadow>
          <boxGeometry args={[0.4, 0.1, 0.3]} />
          <meshStandardMaterial color="#4a5568" roughness={0.6} />
        </mesh>
        <mesh position={[0.45, 0.9, 0]} castShadow>
          <boxGeometry args={[0.4, 0.1, 0.3]} />
          <meshStandardMaterial color="#4a5568" roughness={0.6} />
        </mesh>
      </group>

      <pointLight position={[-4.8, 2.5, -4.7]} color="#f0f4ff" intensity={1.8} distance={7} decay={2} />

      {/* ================================================================= */}
      {/* 6. ROOM 3: SPACESUIT STORAGE & SELECTION GALLERY (x: -14.5 to -6.5, z: -6.0 to -1.8) */}
      {/* ================================================================= */}
      {/* Wall separating Spacesuit Storage and PLSS Room (z = -6.0, with doorway x: -12.2 to -10.8) */}
      <mesh position={[-13.5, 1.45, -6.0]} castShadow receiveShadow>
        <boxGeometry args={[2.6, 2.7, 0.15]} />
        <meshStandardMaterial color="#3f4552" roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[-8.65, 1.45, -6.0]} castShadow receiveShadow>
        <boxGeometry args={[4.3, 2.7, 0.15]} />
        <meshStandardMaterial color="#3f4552" roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[-11.5, 2.5, -6.0]} castShadow>
        <boxGeometry args={[1.4, 0.6, 0.15]} />
        <meshStandardMaterial color="#3f4552" roughness={0.6} metalness={0.3} />
      </mesh>

      {/* Gallery Back Wall Storage Lockers */}
      <group position={[-14.4, 0.1, -3.9]}>
        <mesh position={[0, 1.1, 0]} castShadow>
          <boxGeometry args={[0.6, 2.0, 3.4]} />
          <meshStandardMaterial color="#2d3340" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Locker doors */}
        <mesh position={[0.31, 1.1, -0.9]}>
          <planeGeometry args={[0.02, 1.8]} />
          <meshBasicMaterial color="#1a202c" />
        </mesh>
        <mesh position={[0.31, 1.1, 0.9]}>
          <planeGeometry args={[0.02, 1.8]} />
          <meshBasicMaterial color="#1a202c" />
        </mesh>
      </group>

      {/* Overhead Gallery Spotlights for the 3 Suit Pedestals */}
      <pointLight position={[-12.5, 2.6, -3.8]} color="#90e0ef" intensity={2.4} distance={6} decay={2} />
      <pointLight position={[-10.5, 2.6, -3.8]} color="#ffffff" intensity={2.8} distance={6} decay={2} />
      <pointLight position={[-8.5, 2.6, -3.8]} color="#ffd166" intensity={2.4} distance={6} decay={2} />

      {/* ================================================================= */}
      {/* 7. ROOM 4: PLSS EQUIPMENT ROOM (x: -14.5 to -8.5, z: -10.5 to -6.0) */}
      {/* ================================================================= */}
      {/* Wall separating PLSS Room and Mission Control (x = -8.5, with doorway z: -8.9 to -7.5) */}
      <mesh position={[-8.5, 1.45, -6.75]} castShadow receiveShadow>
        <boxGeometry args={[0.15, 2.7, 1.5]} />
        <meshStandardMaterial color="#3f4552" roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[-8.5, 1.45, -9.7]} castShadow receiveShadow>
        <boxGeometry args={[0.15, 2.7, 1.6]} />
        <meshStandardMaterial color="#3f4552" roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[-8.5, 2.5, -8.2]} castShadow>
        <boxGeometry args={[0.15, 0.6, 1.4]} />
        <meshStandardMaterial color="#3f4552" roughness={0.6} metalness={0.3} />
      </mesh>

      {/* Wall separating PLSS Room and Crew Quarters (z = -10.5, with doorway x: -12.2 to -10.8) */}
      <mesh position={[-13.5, 1.45, -10.5]} castShadow receiveShadow>
        <boxGeometry args={[2.6, 2.7, 0.15]} />
        <meshStandardMaterial color="#3f4552" roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[-9.65, 1.45, -10.5]} castShadow receiveShadow>
        <boxGeometry args={[2.3, 2.7, 0.15]} />
        <meshStandardMaterial color="#3f4552" roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[-11.5, 2.5, -10.5]} castShadow>
        <boxGeometry args={[1.4, 0.6, 0.15]} />
        <meshStandardMaterial color="#3f4552" roughness={0.6} metalness={0.3} />
      </mesh>

      <pointLight position={[-11.5, 2.5, -8.2]} color="#00b4d8" intensity={2.2} distance={7} decay={2} />

      {/* ================================================================= */}
      {/* 8. ROOM 5: MISSION CONTROL ROOM (x: -8.5 to -3.0, z: -10.5 to -6.0) */}
      {/* ================================================================= */}
      {/* Wall separating Mission Control and Life Support (z = -10.5, with doorway x: -5.7 to -4.3) */}
      <mesh position={[-7.1, 1.45, -10.5]} castShadow receiveShadow>
        <boxGeometry args={[2.8, 2.7, 0.15]} />
        <meshStandardMaterial color="#3f4552" roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[-3.65, 1.45, -10.5]} castShadow receiveShadow>
        <boxGeometry args={[1.3, 2.7, 0.15]} />
        <meshStandardMaterial color="#3f4552" roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[-5.0, 2.5, -10.5]} castShadow>
        <boxGeometry args={[1.4, 0.6, 0.15]} />
        <meshStandardMaterial color="#3f4552" roughness={0.6} metalness={0.3} />
      </mesh>

      {/* Mission Control Main Console Workstations */}
      <group position={[-5.8, 0.1, -7.8]}>
        <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.6, 0.8, 0.8]} />
          <meshStandardMaterial color="#21252d" roughness={0.5} metalness={0.7} />
        </mesh>
        {/* Dual High-Res Flight Telemetry Screens */}
        <mesh position={[-0.7, 1.05, -0.1]} rotation={[-0.2, 0.1, 0]} castShadow>
          <boxGeometry args={[0.85, 0.5, 0.04]} />
          <meshStandardMaterial color="#111827" />
        </mesh>
        <mesh position={[-0.7, 1.05, -0.075]} rotation={[-0.2, 0.1, 0]}>
          <planeGeometry args={[0.8, 0.46]} />
          <meshBasicMaterial color="#0b4d75" />
        </mesh>

        <mesh position={[0.6, 1.05, -0.1]} rotation={[-0.2, -0.1, 0]} castShadow>
          <boxGeometry args={[0.85, 0.5, 0.04]} />
          <meshStandardMaterial color="#111827" />
        </mesh>
        <mesh position={[0.6, 1.05, -0.075]} rotation={[-0.2, -0.1, 0]}>
          <planeGeometry args={[0.8, 0.46]} />
          <meshBasicMaterial color="#09554f" />
        </mesh>
      </group>

      <pointLight position={[-5.8, 2.5, -8.2]} color="#64dfdf" intensity={2.0} distance={7} decay={2} />

      {/* ================================================================= */}
      {/* 9. ROOM 6: LIFE SUPPORT (ECLSS) ROOM (x: -8.5 to -3.0, z: -14.8 to -10.5) */}
      {/* ================================================================= */}
      {/* Wall separating Life Support and Crew Quarters (x = -8.5, with doorway z: -13.2 to -11.8) */}
      <mesh position={[-8.5, 1.45, -11.15]} castShadow receiveShadow>
        <boxGeometry args={[0.15, 2.7, 1.3]} />
        <meshStandardMaterial color="#3f4552" roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[-8.5, 1.45, -14.0]} castShadow receiveShadow>
        <boxGeometry args={[0.15, 2.7, 1.6]} />
        <meshStandardMaterial color="#3f4552" roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[-8.5, 2.5, -12.5]} castShadow>
        <boxGeometry args={[0.15, 0.6, 1.4]} />
        <meshStandardMaterial color="#3f4552" roughness={0.6} metalness={0.3} />
      </mesh>

      <pointLight position={[-5.8, 2.5, -12.6]} color="#80ed99" intensity={2.0} distance={7} decay={2} />

      {/* ================================================================= */}
      {/* 10. ROOM 7: CREW LIVING QUARTERS (x: -14.5 to -8.5, z: -14.8 to -10.5) */}
      {/* ================================================================= */}
      {/* Bunk Berths */}
      <group position={[-13.8, 0.1, -12.8]}>
        <mesh position={[0, 1.0, 0]} castShadow>
          <boxGeometry args={[1.2, 2.0, 2.2]} />
          <meshStandardMaterial color="#2d3340" metalness={0.7} roughness={0.4} />
        </mesh>
        <mesh position={[0.1, 0.5, 0]} castShadow>
          <boxGeometry args={[1.0, 0.2, 2.0]} />
          <meshStandardMaterial color="#4a5568" roughness={0.8} />
        </mesh>
        <mesh position={[0.1, 1.45, 0]} castShadow>
          <boxGeometry args={[1.0, 0.2, 2.0]} />
          <meshStandardMaterial color="#4a5568" roughness={0.8} />
        </mesh>
      </group>

      {/* Crew Cycle Ergometer */}
      <group position={[-11.5, 0.1, -13.5]}>
        <mesh position={[0, 0.35, 0]} castShadow>
          <boxGeometry args={[0.8, 0.6, 0.9]} />
          <meshStandardMaterial color="#4a5568" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.85, 0.3]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.6, 8]} />
          <meshStandardMaterial color="#cbd5e0" metalness={0.8} />
        </mesh>
      </group>

      {/* Galley Hydration Station */}
      <group position={[-10.2, 0.1, -14.2]}>
        <mesh position={[0, 0.8, 0]} castShadow>
          <boxGeometry args={[1.2, 1.5, 0.5]} />
          <meshStandardMaterial color="#353b47" metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.9, 0.26]}>
          <planeGeometry args={[0.8, 0.4]} />
          <meshBasicMaterial color="#0b406b" />
        </mesh>
      </group>

      <pointLight position={[-11.5, 2.5, -12.6]} color="#ffb703" intensity={1.8} distance={7} decay={2} />
    </group>
  );
}
