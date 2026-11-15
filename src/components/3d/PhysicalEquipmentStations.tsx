import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PhysicalEquipmentProps {
  oxygenChecked: boolean;
  pressureChecked: boolean;
  commsVerified: boolean;
  coolingInspected: boolean;
  onInteractOxygen?: () => void;
  onInteractPressure?: () => void;
  onInteractComms?: () => void;
  onInteractCooling?: () => void;
}

export function PhysicalEquipmentStations({
  oxygenChecked,
  pressureChecked,
  commsVerified,
  coolingInspected,
  onInteractOxygen,
  onInteractPressure,
  onInteractComms,
  onInteractCooling,
}: PhysicalEquipmentProps) {
  // Oxygen Valve and Mechanical Gauge Refs
  const o2ValveWheelRef = useRef<THREE.Group>(null);
  const o2NeedleRef = useRef<THREE.Mesh>(null);

  // Pressure Console Needle and Switch Refs
  const pressureNeedleRef = useRef<THREE.Mesh>(null);
  const switchLever1Ref = useRef<THREE.Mesh>(null);
  const switchLever2Ref = useRef<THREE.Mesh>(null);

  // Radio VU Meter Bars
  const vuBar1Ref = useRef<THREE.Mesh>(null);
  const vuBar2Ref = useRef<THREE.Mesh>(null);
  const vuBar3Ref = useRef<THREE.Mesh>(null);
  const vuBar4Ref = useRef<THREE.Mesh>(null);
  const pttButtonRef = useRef<THREE.Mesh>(null);

  // Cooling Fluid Flow Pulses
  const coolantPulse1Ref = useRef<THREE.Mesh>(null);
  const coolantPulse2Ref = useRef<THREE.Mesh>(null);
  const coolantPulse3Ref = useRef<THREE.Mesh>(null);

  // Helmet Laser Scanner
  const laserScannerRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;

    // 1. Oxygen Valve & Needle
    if (o2ValveWheelRef.current) {
      const targetRotZ = oxygenChecked ? Math.PI * 2 : 0;
      o2ValveWheelRef.current.rotation.z = THREE.MathUtils.damp(
        o2ValveWheelRef.current.rotation.z,
        targetRotZ,
        4,
        delta
      );
    }
    if (o2NeedleRef.current) {
      const targetAngle = oxygenChecked ? 0.95 : -0.78;
      o2NeedleRef.current.rotation.z = THREE.MathUtils.damp(
        o2NeedleRef.current.rotation.z,
        targetAngle,
        5,
        delta
      );
    }

    // 2. Pressure Diagnostic Needle & Switches
    if (pressureNeedleRef.current) {
      const targetAngle = pressureChecked ? 0.85 : -0.8;
      pressureNeedleRef.current.rotation.z = THREE.MathUtils.damp(
        pressureNeedleRef.current.rotation.z,
        targetAngle,
        5,
        delta
      );
    }
    if (switchLever1Ref.current && switchLever2Ref.current) {
      const targetSwitchRot = pressureChecked ? 0.45 : -0.45;
      switchLever1Ref.current.rotation.x = THREE.MathUtils.damp(
        switchLever1Ref.current.rotation.x,
        targetSwitchRot,
        8,
        delta
      );
      switchLever2Ref.current.rotation.x = THREE.MathUtils.damp(
        switchLever2Ref.current.rotation.x,
        targetSwitchRot,
        8,
        delta
      );
    }

    // 3. Radio Comms VU Meter Bars
    if (commsVerified && vuBar1Ref.current && vuBar2Ref.current && vuBar3Ref.current && vuBar4Ref.current) {
      const s1 = 0.5 + Math.sin(time * 12) * 0.4;
      const s2 = 0.6 + Math.sin(time * 15 + 1) * 0.35;
      const s3 = 0.4 + Math.sin(time * 18 + 2) * 0.35;
      const s4 = 0.3 + Math.sin(time * 22 + 3) * 0.25;

      vuBar1Ref.current.scale.y = Math.max(0.1, s1);
      vuBar2Ref.current.scale.y = Math.max(0.1, s2);
      vuBar3Ref.current.scale.y = Math.max(0.1, s3);
      vuBar4Ref.current.scale.y = Math.max(0.1, s4);
    }

    // 4. Cooling Loop fluid flow pulses
    if (coolingInspected && coolantPulse1Ref.current && coolantPulse2Ref.current && coolantPulse3Ref.current) {
      const p1 = (time * 1.5) % 1;
      const p2 = (time * 1.5 + 0.33) % 1;
      const p3 = (time * 1.5 + 0.66) % 1;

      coolantPulse1Ref.current.position.y = 0.6 + p1 * 0.8;
      coolantPulse2Ref.current.position.y = 0.6 + p2 * 0.8;
      coolantPulse3Ref.current.position.y = 0.6 + p3 * 0.8;
    }

    // 5. Laser Scanner sweeps over helmet glovebox
    if (laserScannerRef.current) {
      laserScannerRef.current.position.z = Math.sin(time * 2) * 0.2;
    }
  });

  return (
    <group name="physical-equipment-stations">
      {/* ================================================================= */}
      {/* 0. WORK BAY EQUIPMENT CONSOLE (Central Hub at [0.0, 0.06, -1.6])  */}
      {/* ================================================================= */}
      <group position={[0.0, 0.06, -1.6]} rotation={[0, 0, 0]}>
        {/* Sleek freestanding pedestal console */}
        <mesh position={[0, 0.55, 0]} castShadow>
          <boxGeometry args={[1.2, 1.1, 0.5]} />
          <meshStandardMaterial color="#20242e" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 1.12, 0.05]} rotation={[-0.45, 0, 0]} castShadow>
          <boxGeometry args={[1.1, 0.45, 0.08]} />
          <meshStandardMaterial color="#141822" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 1.12, 0.1]} rotation={[-0.45, 0, 0]}>
          <planeGeometry args={[0.98, 0.36]} />
          <meshBasicMaterial color="#0b385e" />
        </mesh>
        <mesh position={[0, 0.01, 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.2, 0.6]} />
          <meshStandardMaterial color="#313847" roughness={0.5} />
        </mesh>
      </group>

      {/* ================================================================= */}
      {/* 1. COMPONENT INSPECTION GLOVEBOX (West Suit Bay at [-5.5, 0.06, -1.8]) */}
      {/* ================================================================= */}
      <group position={[-5.5, 0.06, -1.8]} rotation={[0, 0, 0]}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[1.4, 1.0, 0.6]} />
          <meshStandardMaterial color="#2d3340" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Transparent acrylic inspection chamber */}
        <mesh position={[0, 1.25, 0]} castShadow>
          <boxGeometry args={[1.2, 0.6, 0.5]} />
          <meshPhysicalMaterial
            color="#a0c4ff"
            transparent
            opacity={0.3}
            roughness={0.1}
            metalness={0.1}
          />
        </mesh>
        {/* Holographic Diagnostic Scan Field */}
        <mesh ref={laserScannerRef} position={[0, 1.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.9, 0.4]} />
          <meshBasicMaterial
            color="#4ecdc4"
            transparent
            opacity={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* ================================================================= */}
      {/* 2. HIGH-PRESSURE O2 SUPPLY MANIFOLD (East Wing at [6.5, 0.06, -1.8]) */}
      {/* ================================================================= */}
      <group
        position={[6.5, 0.06, -1.8]}
        rotation={[0, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onInteractOxygen?.();
        }}
      >
        {/* Support Steel Stanchion */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[0.9, 1.0, 0.45]} />
          <meshStandardMaterial color="#2d3340" metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Dual High-Pressure O2 COPV Cylinders (Gold / Amber Overwrap) */}
        <mesh position={[-0.2, 1.25, 0]} castShadow>
          <cylinderGeometry args={[0.14, 0.14, 1.1, 24]} />
          <meshStandardMaterial color="#e5a93c" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0.2, 1.25, 0]} castShadow>
          <cylinderGeometry args={[0.14, 0.14, 1.1, 24]} />
          <meshStandardMaterial color="#e5a93c" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Manifold Connecting Pipe */}
        <mesh position={[0, 1.8, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 0.5, 12]} />
          <meshStandardMaterial color="#a0aec0" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Physical 3D Rotary Valve Wheel */}
        <group ref={o2ValveWheelRef} position={[0, 1.88, 0.16]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh castShadow>
            <torusGeometry args={[0.11, 0.018, 12, 24]} />
            <meshStandardMaterial color="#e53e3e" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh rotation={[0, 0, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.22, 8]} />
            <meshStandardMaterial color="#e53e3e" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.012, 0.012, 0.22, 8]} />
            <meshStandardMaterial color="#e53e3e" metalness={0.6} roughness={0.3} />
          </mesh>
        </group>

        {/* Mechanical Pressure Gauge Dial */}
        <group position={[0, 1.4, 0.24]} rotation={[-0.2, 0, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.12, 0.12, 0.04, 24]} />
            <meshStandardMaterial color="#1a202c" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.022, 0]}>
            <circleGeometry args={[0.1, 24]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <group position={[0, 0.024, 0]}>
            <mesh ref={o2NeedleRef} position={[0, 0.04, 0]}>
              <cylinderGeometry args={[0.004, 0.008, 0.07, 6]} />
              <meshBasicMaterial color="#e53e3e" />
            </mesh>
          </group>
        </group>

        {/* Green/Amber Status Lamp */}
        <mesh position={[0, 1.62, 0.24]}>
          <circleGeometry args={[0.025, 16]} />
          <meshBasicMaterial color={oxygenChecked ? '#38b000' : '#e5a93c'} />
        </mesh>
      </group>

      {/* ================================================================= */}
      {/* 3. SUIT PRESSURE DIAGNOSTIC CONSOLE (North Lab at [-1.6, 0.06, -7.5]) */}
      {/* ================================================================= */}
      <group
        position={[-1.6, 0.06, -7.5]}
        rotation={[0, Math.PI / 2, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onInteractPressure?.();
        }}
      >
        <mesh position={[0, 0.55, 0]} castShadow>
          <boxGeometry args={[0.9, 1.1, 0.45]} />
          <meshStandardMaterial color="#21252f" roughness={0.6} metalness={0.7} />
        </mesh>

        <mesh position={[0, 1.15, 0.05]} rotation={[-0.5, 0, 0]} castShadow>
          <boxGeometry args={[0.8, 0.4, 0.05]} />
          <meshStandardMaterial color="#161a23" roughness={0.4} metalness={0.8} />
        </mesh>

        <group position={[-0.2, 1.15, 0.1]}>
          <mesh ref={switchLever1Ref} position={[0, 0.03, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.05, 8]} />
            <meshStandardMaterial color="#e53e3e" metalness={0.7} />
          </mesh>
        </group>

        <group position={[-0.08, 1.15, 0.1]}>
          <mesh ref={switchLever2Ref} position={[0, 0.03, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.05, 8]} />
            <meshStandardMaterial color="#e53e3e" metalness={0.7} />
          </mesh>
        </group>

        <group position={[0.18, 1.16, 0.12]} rotation={[-0.5, 0, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.1, 0.1, 0.035, 24]} />
            <meshStandardMaterial color="#111827" metalness={0.9} />
          </mesh>
          <mesh position={[0, 0.018, 0]}>
            <circleGeometry args={[0.085, 24]} />
            <meshBasicMaterial color="#f8fafc" />
          </mesh>
          <group position={[0, 0.02, 0]}>
            <mesh ref={pressureNeedleRef} position={[0, 0.03, 0]}>
              <cylinderGeometry args={[0.004, 0.007, 0.06, 6]} />
              <meshBasicMaterial color="#0b3d91" />
            </mesh>
          </group>
        </group>
      </group>

      {/* ================================================================= */}
      {/* 4. MISSION COMMS & RADIO TERMINAL (North Lab at [1.6, 0.06, -7.5]) */}
      {/* ================================================================= */}
      <group
        position={[1.6, 0.06, -7.5]}
        rotation={[0, -Math.PI / 2, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onInteractComms?.();
        }}
      >
        <mesh position={[0, 0.55, 0]} castShadow>
          <boxGeometry args={[0.9, 1.1, 0.45]} />
          <meshStandardMaterial color="#21252f" roughness={0.6} metalness={0.7} />
        </mesh>
        <mesh position={[0, 1.15, 0.05]} rotation={[-0.45, 0, 0]} castShadow>
          <boxGeometry args={[0.8, 0.4, 0.05]} />
          <meshStandardMaterial color="#161a23" roughness={0.4} metalness={0.8} />
        </mesh>

        <mesh ref={pttButtonRef} position={[-0.2, 1.25, 0.1]} rotation={[-0.35, 0, 0]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, 0.03, 16]} />
          <meshStandardMaterial color="#e53e3e" roughness={0.4} />
        </mesh>

        <group position={[0.08, 1.22, 0.08]} rotation={[-0.35, 0, 0]}>
          <mesh ref={vuBar1Ref} position={[-0.08, 0, 0]}>
            <boxGeometry args={[0.02, 0.12, 0.01]} />
            <meshBasicMaterial color="#38b000" />
          </mesh>
          <mesh ref={vuBar2Ref} position={[-0.025, 0, 0]}>
            <boxGeometry args={[0.02, 0.12, 0.01]} />
            <meshBasicMaterial color="#38b000" />
          </mesh>
          <mesh ref={vuBar3Ref} position={[0.025, 0, 0]}>
            <boxGeometry args={[0.02, 0.12, 0.01]} />
            <meshBasicMaterial color="#e5a93c" />
          </mesh>
          <mesh ref={vuBar4Ref} position={[0.08, 0, 0]}>
            <boxGeometry args={[0.02, 0.12, 0.01]} />
            <meshBasicMaterial color="#e53e3e" />
          </mesh>
        </group>
      </group>

      {/* ================================================================= */}
      {/* 5. LCVG COOLING CHILLER LOOP (East Wing at [6.5, 0.06, 1.8])       */}
      {/* ================================================================= */}
      <group
        position={[6.5, 0.06, 1.8]}
        rotation={[0, Math.PI, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onInteractCooling?.();
        }}
      >
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[0.85, 1.0, 0.45]} />
          <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.7} />
        </mesh>

        <mesh position={[0, 1.05, 0.12]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.9, 16]} />
          <meshPhysicalMaterial
            color="#38bdf8"
            transparent
            opacity={0.65}
            roughness={0.1}
            metalness={0.1}
          />
        </mesh>

        <mesh ref={coolantPulse1Ref} position={[0, 0.6, 0.12]}>
          <sphereGeometry args={[0.04, 12, 12]} />
          <meshBasicMaterial color="#7dd3fc" />
        </mesh>
        <mesh ref={coolantPulse2Ref} position={[0, 0.9, 0.12]}>
          <sphereGeometry args={[0.04, 12, 12]} />
          <meshBasicMaterial color="#7dd3fc" />
        </mesh>
        <mesh ref={coolantPulse3Ref} position={[0, 1.2, 0.12]}>
          <sphereGeometry args={[0.04, 12, 12]} />
          <meshBasicMaterial color="#7dd3fc" />
        </mesh>

        <mesh position={[0.22, 1.15, 0.15]}>
          <circleGeometry args={[0.03, 16]} />
          <meshBasicMaterial color={coolingInspected ? '#38b000' : '#0284c7'} />
        </mesh>
      </group>
    </group>
  );
}
