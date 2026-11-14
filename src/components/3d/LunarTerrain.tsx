import { useMemo } from 'react';
import * as THREE from 'three';

interface Crater {
  cx: number;
  cz: number;
  radius: number;
  depth: number;
  rimHeight: number;
}

export function LunarTerrain() {
  const { geometry } = useMemo(() => {
    const width = 280;
    const depth = 280;
    const segments = 140;

    const geo = new THREE.PlaneGeometry(width, depth, segments, segments);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;

    // Defined craters around the lunar training site
    const craters: Crater[] = [
      { cx: 58, cz: -50, radius: 28, depth: 5.5, rimHeight: 1.5 },
      { cx: -65, cz: 42, radius: 24, depth: 4.2, rimHeight: 1.2 },
      { cx: -45, cz: -60, radius: 18, depth: 3.2, rimHeight: 0.9 },
      { cx: 70, cz: 55, radius: 22, depth: 3.8, rimHeight: 1.0 },
      { cx: -32, cz: 10, radius: 9.5, depth: 1.6, rimHeight: 0.45 },
      { cx: 36, cz: 20, radius: 8.5, depth: 1.4, rimHeight: 0.4 },
      { cx: 8, cz: -52, radius: 12, depth: 2.1, rimHeight: 0.6 },
      { cx: -18, cz: 60, radius: 15, depth: 2.6, rimHeight: 0.75 },
    ];

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      // Distance from central base perimeter (flattened area for habitat, rover, astronaut)
      const distFromCenter = Math.sqrt(x * x + z * z);
      const baseFlatFactor = Math.min(
        1,
        Math.max(0, (distFromCenter - 18) / 16)
      );

      // Subtle undulating lunar mare hills
      let y =
        (Math.sin(x * 0.02) * Math.cos(z * 0.02) * 1.8 +
          Math.sin(x * 0.05 + 1.2) * Math.cos(z * 0.04) * 0.9 +
          Math.cos(x * 0.09) * Math.sin(z * 0.08) * 0.4) *
        baseFlatFactor;

      // Apply crater depressions and raised rims
      for (const c of craters) {
        const dx = x - c.cx;
        const dz = z - c.cz;
        const dist = Math.sqrt(dx * dx + dz * dz);
        const normDist = dist / c.radius;

        if (normDist < 2.0) {
          // Inner bowl depression
          if (normDist < 1.0) {
            const bowl = (1.0 - normDist * normDist) * c.depth;
            y -= bowl;
          }

          // Raised rim lip around crater perimeter (Gaussian peak at normDist = 1.0)
          const rimDelta = normDist - 1.0;
          const rim = c.rimHeight * Math.exp(-((rimDelta * rimDelta) / 0.06));
          y += rim;
        }
      }

      pos.setY(i, y);
    }

    geo.computeVertexNormals();

    return { geometry: geo };
  }, []);

  return (
    <mesh geometry={geometry} receiveShadow position={[0, -0.05, 0]}>
      <meshStandardMaterial
        color="#32353b"
        roughness={0.94}
        metalness={0.03}
        flatShading={false}
      />
    </mesh>
  );
}

