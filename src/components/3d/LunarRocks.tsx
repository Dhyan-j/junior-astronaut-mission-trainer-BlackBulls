import { useMemo } from 'react';
import * as THREE from 'three';

export function LunarRocks() {
  const rockData = useMemo(() => {
    const rocks: {
      position: [number, number, number];
      rotation: [number, number, number];
      scale: [number, number, number];
    }[] = [];

    // Seeded pseudo-random generator for consistent procedural placement
    let seed = 19690720; // Apollo 11 date as seed
    const pseudoRand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    const count = 90;
    for (let i = 0; i < count; i++) {
      // Angle and radius (keep clear of central base area: radius between 16m and 110m)
      const angle = pseudoRand() * Math.PI * 2;
      const radius = 16 + pseudoRand() * 95;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      // Approximate terrain elevation at this location
      const distFromCenter = Math.sqrt(x * x + z * z);
      const baseFlatFactor = Math.min(1, Math.max(0, (distFromCenter - 18) / 16));
      let y =
        (Math.sin(x * 0.02) * Math.cos(z * 0.02) * 1.8 +
          Math.sin(x * 0.05 + 1.2) * Math.cos(z * 0.04) * 0.9) *
        baseFlatFactor;

      // Size scale: mostly 0.35m to 1.8m boulders
      const baseScale = 0.3 + Math.pow(pseudoRand(), 2) * 1.6;
      const sx = baseScale * (0.8 + pseudoRand() * 0.5);
      const sy = baseScale * (0.6 + pseudoRand() * 0.4);
      const sz = baseScale * (0.8 + pseudoRand() * 0.5);

      // Embed rock slightly into regolith
      const embedY = y + sy * 0.45;

      rocks.push({
        position: [x, embedY, z],
        rotation: [
          pseudoRand() * Math.PI,
          pseudoRand() * Math.PI,
          pseudoRand() * Math.PI,
        ],
        scale: [sx, sy, sz],
      });
    }

    return rocks;
  }, []);

  const { geometry } = useMemo(() => {
    // Irregular polyhedral rock geometry using perturbed Dodecahedron
    const geo = new THREE.DodecahedronGeometry(1, 1);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const vz = pos.getZ(i);
      const noise = 1.0 + (Math.sin(vx * 7) * Math.cos(vy * 6) * Math.sin(vz * 8)) * 0.22;
      pos.setXYZ(i, vx * noise, vy * noise, vz * noise);
    }
    geo.computeVertexNormals();
    return { geometry: geo };
  }, []);

  return (
    <group name="lunar-rocks">
      {rockData.map((rock, idx) => (
        <mesh
          key={idx}
          geometry={geometry}
          position={rock.position}
          rotation={rock.rotation}
          scale={rock.scale}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color="#2a2c32"
            roughness={0.96}
            metalness={0.05}
            flatShading={true}
          />
        </mesh>
      ))}
    </group>
  );
}

