interface DiagnosticTerminalProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
}

export function DiagnosticTerminal({
  position = [-1.2, 0, 4.8],
  rotation = [0, 0.1, 0],
}: DiagnosticTerminalProps) {
  return (
    <group name="diagnostic-terminal" position={position} rotation={rotation}>
      {/* Platform Pedestal */}
      <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.12, 1.2]} />
        <meshStandardMaterial color="#21242c" roughness={0.7} metalness={0.3} />
      </mesh>

      {/* Main Computer Console Body */}
      <mesh position={[0, 0.65, -0.15]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 1.18, 0.45]} />
        <meshStandardMaterial color="#2e3440" roughness={0.5} metalness={0.5} />
      </mesh>

      {/* Dual Angled Diagnostic Display Screens */}
      <group position={[0, 1.15, 0.05]} rotation={[-0.35, 0, 0]}>
        {/* Left Screen: Telemetry & O2 */}
        <mesh position={[-0.3, 0, 0]} castShadow>
          <boxGeometry args={[0.5, 0.38, 0.04]} />
          <meshStandardMaterial color="#1a202c" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[-0.3, 0, 0.022]}>
          <planeGeometry args={[0.46, 0.34]} />
          <meshBasicMaterial color="#0b233a" />
        </mesh>

        {/* Right Screen: Pressure & Comms */}
        <mesh position={[0.3, 0, 0]} castShadow>
          <boxGeometry args={[0.5, 0.38, 0.04]} />
          <meshStandardMaterial color="#1a202c" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0.3, 0, 0.022]}>
          <planeGeometry args={[0.46, 0.34]} />
          <meshBasicMaterial color="#182c20" />
        </mesh>
      </group>

      {/* High-Gain Telemetry Antenna Mast (Top of Console) */}
      <mesh position={[0.45, 1.6, -0.2]} castShadow>
        <cylinderGeometry args={[0.015, 0.02, 0.7, 8]} />
        <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0.45, 1.95, -0.2]} rotation={[0.4, 0, 0]} castShadow>
        <sphereGeometry args={[0.12, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#cbd5e0" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

