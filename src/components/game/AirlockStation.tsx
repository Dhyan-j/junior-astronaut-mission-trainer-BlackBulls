interface AirlockStationProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  isReady: boolean;
  isOpen: boolean;
}

export function AirlockStation({
  position = [-3.5, 0, -1.8],
  rotation = [0, 0, 0],
  isReady,
  isOpen,
}: AirlockStationProps) {
  return (
    <group name="airlock-control-station" position={position} rotation={rotation}>
      {/* Wall-Mounted Airlock Cycling Console right beside entrance door */}
      <group position={[0.95, 1.35, 0.15]}>
        <mesh castShadow>
          <boxGeometry args={[0.3, 0.45, 0.12]} />
          <meshStandardMaterial color="#1f2937" metalness={0.7} roughness={0.3} />
        </mesh>

        {/* Status Light: Green when all previous steps completed, Amber when pending */}
        <mesh position={[0, 0.12, 0.07]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.02, 12]} />
          <meshBasicMaterial color={isOpen ? '#38b000' : isReady ? '#e5a93c' : '#e53e3e'} />
        </mesh>

        {/* Hatch Pressure Digital Readout */}
        <mesh position={[0, -0.06, 0.07]}>
          <planeGeometry args={[0.22, 0.14]} />
          <meshBasicMaterial color="#0b1b2b" />
        </mesh>
      </group>
    </group>
  );
}
