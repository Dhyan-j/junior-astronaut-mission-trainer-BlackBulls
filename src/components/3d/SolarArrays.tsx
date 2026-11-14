import { useMemo } from 'react';

interface SolarArrayProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  label: string;
}

function SingleSolarArray({
  position,
  rotation = [0, 0, 0],
  label,
}: SolarArrayProps) {
  // Panel cell layout
  const cells = useMemo(() => {
    const list: { x: number; y: number }[] = [];
    const cols = 6;
    const rows = 3;
    const cellW = 0.92;
    const cellH = 0.85;

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        // Gap in center for structural mast
        const xOffset = c < 3 ? -1.8 + c * cellW : 0.4 + (c - 3) * cellW;
        const yOffset = -1.1 + r * cellH;
        list.push({ x: xOffset, y: yOffset });
      }
    }
    return list;
  }, []);

  return (
    <group name={`solar-array-${label.toLowerCase()}`} position={position} rotation={rotation}>
      {/* Heavy Regolith Anchor Pad */}
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.4, 1.6, 0.3, 8]} />
        <meshStandardMaterial color="#40434b" roughness={0.8} metalness={0.2} />
      </mesh>

      {/* Gold Thermal Foil Insulation Collar */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.55, 0.65, 0.3, 16]} />
        <meshStandardMaterial
          color="#d4af37"
          roughness={0.35}
          metalness={0.9}
        />
      </mesh>

      {/* Vertical Structural Mast */}
      <mesh position={[0, 2.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.18, 0.22, 3.2, 16]} />
        <meshStandardMaterial color="#c0c4ce" roughness={0.4} metalness={0.8} />
      </mesh>

      {/* Dual-Axis Actuator Gimbal Hub */}
      <mesh position={[0, 3.8, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.38, 16, 16]} />
        <meshStandardMaterial color="#2d3139" roughness={0.5} metalness={0.7} />
      </mesh>

      {/* Main Panel Array Assembly (Tilted 35 degrees toward the Sun) */}
      <group position={[0, 3.8, 0]} rotation={[-0.45, 0, 0]}>
        {/* Horizontal Spaceframe Truss */}
        <mesh castShadow receiveShadow position={[0, 0, -0.08]}>
          <boxGeometry args={[6.2, 0.14, 0.14]} />
          <meshStandardMaterial color="#a0a5b2" roughness={0.5} metalness={0.75} />
        </mesh>

        {/* Diagonal Truss Braces */}
        <mesh castShadow position={[-1.5, -0.6, -0.12]} rotation={[0, 0, 0.35]}>
          <cylinderGeometry args={[0.04, 0.04, 1.5, 8]} />
          <meshStandardMaterial color="#7a808d" roughness={0.5} metalness={0.6} />
        </mesh>
        <mesh castShadow position={[1.5, -0.6, -0.12]} rotation={[0, 0, -0.35]}>
          <cylinderGeometry args={[0.04, 0.04, 1.5, 8]} />
          <meshStandardMaterial color="#7a808d" roughness={0.5} metalness={0.6} />
        </mesh>

        {/* Array Backing Substrate (Left & Right Wings) */}
        <mesh position={[-1.6, 0, -0.02]} castShadow receiveShadow>
          <boxGeometry args={[2.9, 2.8, 0.05]} />
          <meshStandardMaterial
            color="#8c6a23" // Kapton polyimide gold thermal backing
            roughness={0.4}
            metalness={0.7}
          />
        </mesh>
        <mesh position={[1.6, 0, -0.02]} castShadow receiveShadow>
          <boxGeometry args={[2.9, 2.8, 0.05]} />
          <meshStandardMaterial
            color="#8c6a23"
            roughness={0.4}
            metalness={0.7}
          />
        </mesh>

        {/* Individual High-Efficiency Silicon Photovoltaic Cells */}
        {cells.map((cell, idx) => (
          <mesh
            key={idx}
            position={[cell.x, cell.y, 0.02]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[0.88, 0.81, 0.025]} />
            <meshStandardMaterial
              color="#091428" // Deep navy-black antireflective silicon
              roughness={0.18}
              metalness={0.88}
            />
          </mesh>
        ))}

        {/* Silver Electrical Busbars / Grid Connectors */}
        <mesh position={[-1.6, 0, 0.038]}>
          <boxGeometry args={[2.8, 0.015, 0.005]} />
          <meshStandardMaterial color="#e0e4eb" metalness={0.95} roughness={0.2} />
        </mesh>
        <mesh position={[1.6, 0, 0.038]}>
          <boxGeometry args={[2.8, 0.015, 0.005]} />
          <meshStandardMaterial color="#e0e4eb" metalness={0.95} roughness={0.2} />
        </mesh>
      </group>

      {/* Base Power Conduit / Cable */}
      <mesh position={[0.4, 0.1, 0.5]} rotation={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 1.2, 8]} />
        <meshStandardMaterial color="#1a1c20" roughness={0.9} />
      </mesh>
    </group>
  );
}

export function SolarArrays() {
  return (
    <group name="simulated-solar-array-grid">
      {/* Unit Alpha */}
      <SingleSolarArray
        position={[-14, 0, 16]}
        rotation={[0, 0.25, 0]}
        label="Alpha"
      />

      {/* Unit Beta */}
      <SingleSolarArray
        position={[-23, 0, 24]}
        rotation={[0, 0.3, 0]}
        label="Beta"
      />
    </group>
  );
}

