interface ProceduralPLSSProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  isMounted?: boolean;
}

/**
 * Procedural representation of a NASA Portable Life Support System (PLSS) backpack.
 * Note: Procedurally generated with Three.js geometry; not a static CAD model.
 */
export function ProceduralPLSSModel({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1.0,
  isMounted = false,
}: ProceduralPLSSProps) {
  return (
    <group
      name="procedural-plss-unit"
      position={position}
      rotation={rotation}
      scale={[scale, scale, scale]}
    >
      {/* Main PLSS Composite Outer Housing */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.54, 0.76, 0.28]} />
        <meshStandardMaterial
          color="#e8ecf2" // Thermal Beta-Cloth white
          roughness={0.65}
          metalness={0.15}
        />
      </mesh>

      {/* Top Protective Thermal Hood */}
      <mesh position={[0, 0.41, 0.02]} rotation={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.26, 0.27, 0.12, 16]} />
        <meshStandardMaterial color="#d0d5dd" roughness={0.5} metalness={0.2} />
      </mesh>

      {/* Dual Internal High-Pressure Oxygen Tanks (Visual Cladding) */}
      <mesh position={[-0.15, 0.05, -0.06]} castShadow>
        <cylinderGeometry args={[0.075, 0.075, 0.58, 16]} />
        <meshStandardMaterial color="#2d3748" roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh position={[0.15, 0.05, -0.06]} castShadow>
        <cylinderGeometry args={[0.075, 0.075, 0.58, 16]} />
        <meshStandardMaterial color="#2d3748" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Oxygen Supply Pressure Dial / Indicator */}
      <group position={[0.16, 0.22, 0.145]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 0.02, 16]} />
          <meshStandardMaterial color="#1a202c" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.012]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.005, 16]} />
          <meshBasicMaterial color="#38b000" /> {/* Green Nominal O2 Indicator */}
        </mesh>
      </group>

      {/* Battery Power Module Cassette (Bottom) */}
      <mesh position={[0, -0.32, 0.02]} castShadow>
        <boxGeometry args={[0.48, 0.14, 0.24]} />
        <meshStandardMaterial color="#333842" roughness={0.4} metalness={0.6} />
      </mesh>
      {/* Battery Status LED Block */}
      <mesh position={[-0.14, -0.32, 0.145]}>
        <boxGeometry args={[0.08, 0.03, 0.01]} />
        <meshBasicMaterial color="#e5a93c" /> {/* Amber Power LED */}
      </mesh>

      {/* Sublimator / Liquid Cooling (LCVG) Porous Plate (Right Flank) */}
      <mesh position={[0.275, -0.04, 0]} castShadow>
        <boxGeometry args={[0.03, 0.36, 0.22]} />
        <meshStandardMaterial
          color="#718096"
          roughness={0.8}
          metalness={0.5}
        />
      </mesh>
      {/* Cooling Loop Indicator Light */}
      <mesh position={[0.28, 0.16, 0.06]}>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshBasicMaterial color="#4ecdc4" /> {/* Cyan Cooling Loop OK */}
      </mesh>

      {/* Communication Antenna Connector & Mast Socket (Top Left) */}
      <mesh position={[-0.18, 0.48, -0.06]} castShadow>
        <cylinderGeometry args={[0.025, 0.035, 0.12, 12]} />
        <meshStandardMaterial color="#c0af76" metalness={0.85} roughness={0.3} />
      </mesh>
      <mesh position={[-0.18, 0.72, -0.06]} castShadow>
        <cylinderGeometry args={[0.006, 0.008, 0.38, 8]} />
        <meshStandardMaterial color="#a0aec0" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Umbilical Quick-Disconnect Port */}
      <mesh position={[-0.275, -0.15, 0.04]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.04, 0.05, 12]} />
        <meshStandardMaterial color="#e53e3e" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Suit Mounting Latch Brackets (Rear Flange) */}
      <mesh position={[-0.18, 0.12, -0.15]} castShadow>
        <boxGeometry args={[0.05, 0.12, 0.05]} />
        <meshStandardMaterial color="#4a5568" metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[0.18, 0.12, -0.15]} castShadow>
        <boxGeometry args={[0.05, 0.12, 0.05]} />
        <meshStandardMaterial color="#4a5568" metalness={0.9} roughness={0.3} />
      </mesh>

      {/* Stand mount / pedestal bracket if not mounted on player */}
      {!isMounted && (
        <group position={[0, -0.44, 0]}>
          <mesh position={[0, -0.3, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.04, 0.05, 0.6, 12]} />
            <meshStandardMaterial color="#718096" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.6, 0]} receiveShadow>
            <cylinderGeometry args={[0.35, 0.4, 0.06, 16]} />
            <meshStandardMaterial color="#2d3748" metalness={0.7} roughness={0.4} />
          </mesh>
        </group>
      )}
    </group>
  );
}

