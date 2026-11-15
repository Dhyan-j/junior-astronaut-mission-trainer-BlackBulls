import type { GameEnvironment } from '../types/game';

export interface Crater {
  cx: number;
  cz: number;
  radius: number;
  depth: number;
  rimHeight: number;
  centralPeakHeight?: number;
}

export const CRATERS: Crater[] = [
  // 1. Northeast Major Complex Impact Crater (Prominent distant basin with central rebound peak)
  { cx: 62, cz: -55, radius: 32, depth: 6.8, rimHeight: 2.1, centralPeakHeight: 1.4 },
  // 2. Southwest Prominent Crater (Deep bowl with well-defined ejecta crest)
  { cx: -68, cz: 46, radius: 26, depth: 5.2, rimHeight: 1.6 },
  // 3. Southeast Prominent Crater (Terraced rim)
  { cx: 72, cz: 58, radius: 24, depth: 4.6, rimHeight: 1.4 },
  // 4. Northwest Medium Crater (Highland rim)
  { cx: -52, cz: -62, radius: 20, depth: 3.8, rimHeight: 1.1 },
  // 5. North Exploration Crater (Accessible for astronaut/rover traverse)
  { cx: 8, cz: -56, radius: 14, depth: 2.5, rimHeight: 0.8 },
  // 6. East Exploration Crater (Accessible basin with gentle slopes)
  { cx: 48, cz: 12, radius: 15, depth: 2.6, rimHeight: 0.85 },
  // 7. South Exploration Crater (Scientific sample site)
  { cx: -16, cz: 64, radius: 16, depth: 2.8, rimHeight: 0.9 },
  // 8. West Ridge Crater
  { cx: -36, cz: 16, radius: 10, depth: 1.8, rimHeight: 0.55 },
  // 9. Small Accessible Crater East-Southeast
  { cx: 34, cz: 38, radius: 8.5, depth: 1.5, rimHeight: 0.45 },
  // 10. Small Accessible Crater North-Northwest
  { cx: -28, cz: -42, radius: 7.5, depth: 1.3, rimHeight: 0.4 },
  // 11. Distant East Impact Crater
  { cx: 88, cz: -14, radius: 11, depth: 2.0, rimHeight: 0.6 },
  // 12. Distant West Impact Crater
  { cx: -82, cz: -18, radius: 13, depth: 2.3, rimHeight: 0.7 },
  // 13. Secondary micro-craters for geological diversity
  { cx: 24, cz: -26, radius: 4.8, depth: 0.85, rimHeight: 0.25 },
  { cx: -26, cz: 38, radius: 5.2, depth: 0.95, rimHeight: 0.28 },
  { cx: 42, cz: -72, radius: 6.0, depth: 1.1, rimHeight: 0.32 },
  { cx: -58, cz: -22, radius: 5.5, depth: 1.0, rimHeight: 0.3 },
  { cx: 18, cz: 72, radius: 5.0, depth: 0.9, rimHeight: 0.26 },
  { cx: -74, cz: 18, radius: 4.5, depth: 0.8, rimHeight: 0.24 },
];

export const TERRAIN_WIDTH = 280;
export const TERRAIN_DEPTH = 280;
export const TERRAIN_SEGMENTS = 200; // Enhanced 1.4m vertex density for realistic slopes
export const TERRAIN_CELL_SIZE = TERRAIN_WIDTH / TERRAIN_SEGMENTS; // 1.4m
export const TERRAIN_HALF_SIZE = TERRAIN_WIDTH / 2; // 140m
export const TERRAIN_MESH_Y_OFFSET = -0.05; // Visual mesh vertical offset

/**
 * Calculates raw vertex elevation in local geometry coordinates before the -0.05m mesh Y offset.
 * Inside the central base foundation (radius <= 18m) and dome foundation, raw elevation is 0.05m,
 * guaranteeing the world elevation (raw - 0.05m) is exactly 0.00m flat.
 */
export function getRawTerrainHeight(x: number, z: number): number {
  const distFromCenter = Math.hypot(x, z);
  const distToDomeCenter = Math.hypot(x - -20, z - -16);
  const distToDomeDoor = Math.hypot(x - -13.5, z - -12.25);

  // Preserve completely flat central base foundation and dome footprint at world Y=0
  if (distFromCenter <= 18.0 || distToDomeDoor <= 3.0 || distToDomeCenter <= 8.5) {
    return 0.05;
  }

  // Smooth C1-continuous Hermite blending factor outside central foundation (18m to 32m)
  const rawBlend = Math.min(1, Math.max(0, (distFromCenter - 18.0) / 14.0));
  const baseFlatFactor = rawBlend * rawBlend * (3 - 2 * rawBlend);

  // Domain-rotated organic mare topography (eliminates cardinal grid stripes and waves)
  const rx1 = x * 0.829 - z * 0.559; // 34 degrees
  const rz1 = x * 0.559 + z * 0.829;
  const rx2 = x * -0.375 - z * 0.927; // 112 degrees
  const rz2 = x * 0.927 - z * 0.375;
  const rx3 = x * -0.819 + z * 0.574; // 215 degrees
  const rz3 = -x * 0.574 - z * 0.819;

  let y =
    (Math.sin(rx1 * 0.021 + 0.5) * 1.6 +
      Math.cos(rz1 * 0.019 - 0.7) * 1.2 +
      Math.sin(rx2 * 0.045 + rz2 * 0.038) * 0.75 +
      Math.cos(rx3 * 0.078 - rz3 * 0.062) * 0.35 +
      Math.sin(rx1 * 0.14 + rz2 * 0.12) * 0.15) *
    baseFlatFactor;

  // Realistic impact craters with parabolic bowls, central peaks, and continuous rounded rims
  for (const c of CRATERS) {
    const dx = x - c.cx;
    const dz = z - c.cz;
    const dist = Math.hypot(dx, dz);
    const normDist = dist / c.radius;

    if (normDist < 2.5) {
      if (normDist < 1.0) {
        // Parabolic crater interior basin
        const bowl = (1.0 - normDist * normDist) * c.depth;
        y -= bowl * baseFlatFactor;

        // Central rebound peak for major complex craters
        if (c.centralPeakHeight && normDist < 0.35) {
          const peakRatio = normDist / 0.35;
          const peak =
            c.centralPeakHeight * Math.cos((peakRatio * Math.PI) / 2) ** 2;
          y += peak * baseFlatFactor;
        }

        // Inner rim uplift (smooth rounded crater crest)
        const innerRimDelta = normDist - 1.0;
        const innerRim =
          c.rimHeight * Math.exp(-(innerRimDelta * innerRimDelta) / 0.015);
        y += innerRim * baseFlatFactor;
      } else {
        // Outer continuous ejecta blanket smoothly decaying outward
        const outerRimDelta = normDist - 1.0;
        const ejecta =
          (c.rimHeight /
            (1.0 + 2.2 * outerRimDelta + 3.0 * outerRimDelta * outerRimDelta)) *
          baseFlatFactor;
        y += ejecta;
      }
    }
  }

  // Fine regolith micro-relief (rotated domain, non-striped)
  const regolithNoise =
    (Math.sin(rx1 * 0.38 + rz2 * 0.32) * 0.05 +
      Math.cos(rx2 * 0.72 - rz1 * 0.58) * 0.03 +
      Math.sin(rx3 * 1.35 + rz3 * 1.25) * 0.015) *
    baseFlatFactor;
  y += regolithNoise;

  return y + 0.05;
}

/**
 * Computes lunar surface albedo factor (0.75 = dark basaltic mare, 1.0 = standard regolith, 1.55 = bright anorthositic ejecta)
 */
export function getTerrainAlbedoFactor(x: number, z: number): number {
  let factor = 1.0;

  // Impact craters and ejecta blankets excavate bright, high-albedo anorthosite
  for (const c of CRATERS) {
    const dx = x - c.cx;
    const dz = z - c.cz;
    const dist = Math.hypot(dx, dz);
    const normDist = dist / c.radius;

    if (normDist < 2.4) {
      const ejectaBright =
        Math.exp(-((normDist - 1.0) * (normDist - 1.0)) / 0.45) * 0.42;
      factor += ejectaBright;
    }
  }

  // Subtle basalt darkening in low-lying mare depressions
  const rawH = getRawTerrainHeight(x, z);
  if (rawH < -0.8) {
    factor -= Math.min(0.2, Math.abs(rawH) * 0.035);
  }

  return Math.min(1.5, Math.max(0.75, factor));
}

/**
 * Computes exact world ground height at any (x, z) coordinate on the rendered 3D terrain mesh.
 * Evaluates the exact barycentric interpolation across the active triangle quad of
 * PlaneGeometry(280, 280, 140, 140) rotated by -Math.PI / 2, accounting for the -0.05m mesh Y offset.
 */
export function getInterpolatedTerrainHeight(x: number, z: number): number {
  const clampedX = Math.max(-TERRAIN_HALF_SIZE, Math.min(TERRAIN_HALF_SIZE, x));
  const clampedZ = Math.max(-TERRAIN_HALF_SIZE, Math.min(TERRAIN_HALF_SIZE, z));

  const gx = (clampedX + TERRAIN_HALF_SIZE) / TERRAIN_CELL_SIZE;
  const gz = (clampedZ + TERRAIN_HALF_SIZE) / TERRAIN_CELL_SIZE;

  const ix0 = Math.min(TERRAIN_SEGMENTS - 1, Math.max(0, Math.floor(gx)));
  const iz0 = Math.min(TERRAIN_SEGMENTS - 1, Math.max(0, Math.floor(gz)));
  const ix1 = ix0 + 1;
  const iz1 = iz0 + 1;

  const u = gx - ix0;
  const v = gz - iz0;

  const x0 = ix0 * TERRAIN_CELL_SIZE - TERRAIN_HALF_SIZE;
  const x1 = ix1 * TERRAIN_CELL_SIZE - TERRAIN_HALF_SIZE;
  const z0 = iz0 * TERRAIN_CELL_SIZE - TERRAIN_HALF_SIZE;
  const z1 = iz1 * TERRAIN_CELL_SIZE - TERRAIN_HALF_SIZE;

  const h00 = getRawTerrainHeight(x0, z0);
  const h10 = getRawTerrainHeight(x1, z0);
  const h01 = getRawTerrainHeight(x0, z1);
  const h11 = getRawTerrainHeight(x1, z1);

  // PlaneGeometry with rotateX(-Math.PI / 2) has diagonal from (u=0, v=1) to (u=1, v=0)
  let interpolatedRaw: number;
  if (u + v <= 1.0) {
    // Triangle 1: [v00, v01, v10]
    interpolatedRaw = (1.0 - u - v) * h00 + v * h01 + u * h10;
  } else {
    // Triangle 2: [v01, v11, v10]
    interpolatedRaw = (u + v - 1.0) * h11 + (1.0 - u) * h01 + (1.0 - v) * h10;
  }

  return interpolatedRaw + TERRAIN_MESH_Y_OFFSET;
}

/**
 * Calculates exact mathematical ground elevation at given coordinates.
 * Inside the pressurized habitat, elevation is pinned to the interior floor deck (0.06m).
 * At the entrance ramps, elevation matches the ramp threshold (0.04m).
 */
export function getTerrainHeight(
  x: number,
  z: number,
  environment: GameEnvironment = 'exterior'
): number {
  if (environment === 'interior') {
    return 1.14; // Flat pressurized habitat deck height of lunar_base_interior.glb
  }

  // Exterior Ramp at Large Domed Habitat entrance threshold [-13.5, -12.25]
  const distToDomeDoor = Math.hypot(x - -13.5, z - -12.25);
  if (distToDomeDoor < 2.5) {
    return 0.04;
  }

  // Exterior Ramp at HDU airlock threshold [-3.5, -1.8]
  const distToHduDoor = Math.hypot(x - -3.5, z - -1.8);
  if (distToHduDoor < 1.2) {
    return 0.04;
  }

  return getInterpolatedTerrainHeight(x, z);
}

export interface BoxObstacle {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  name: string;
}

export interface CylinderObstacle {
  x: number;
  z: number;
  radius: number;
  name: string;
}

export interface RockInstance {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  radius: number;
}

// Procedural boulder & ejecta generator using deterministic pseudo-random distribution
function generateLunarRocks(): {
  instances: RockInstance[];
  gravel: RockInstance[];
  obstacles: CylinderObstacle[];
} {
  const instances: RockInstance[] = [];
  const gravel: RockInstance[] = [];
  const obstacles: CylinderObstacle[] = [];

  let seed = 19690720; // Apollo 11 landing date
  const pseudoRand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  // 1. General Field Boulders (75 boulders scattered across mare)
  let attempts = 0;
  while (instances.length < 75 && attempts < 1000) {
    attempts++;
    const angle = pseudoRand() * Math.PI * 2;
    const radius = 20.0 + pseudoRand() * 95.0;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    // Guarantee rocks remain clear of central habitat foundation (18m) and dome foundation
    if (Math.hypot(x, z) < 19.5) continue;
    if (Math.hypot(x - -20.0, z - -16.0) < 10.5) continue;

    // Boulder scale: 0.35m to 1.85m
    const baseScale = 0.35 + Math.pow(pseudoRand(), 2) * 1.5;
    const sx = baseScale * (0.8 + pseudoRand() * 0.4);
    const sy = baseScale * (0.6 + pseudoRand() * 0.4);
    const sz = baseScale * (0.8 + pseudoRand() * 0.4);

    const groundY = getInterpolatedTerrainHeight(x, z);
    const embedY = groundY + sy * 0.38;

    const rot: [number, number, number] = [
      pseudoRand() * Math.PI,
      pseudoRand() * Math.PI,
      pseudoRand() * Math.PI,
    ];

    const boulderRadius = Math.max(sx, sz) * 0.75;

    instances.push({
      position: [x, embedY, z],
      rotation: rot,
      scale: [sx, sy, sz],
      radius: boulderRadius,
    });

    if (baseScale >= 0.55) {
      obstacles.push({
        x,
        z,
        radius: boulderRadius,
        name: `Lunar Boulder ${instances.length}`,
      });
    }
  }

  // 2. Crater Rim Ejecta Boulders (45 boulders clustered along crater rims & ejecta blankets)
  for (const c of CRATERS) {
    if (instances.length >= 120) break;
    // Skip distant craters outside exploration zone
    if (Math.hypot(c.cx, c.cz) > 95) continue;

    const rocksPerCrater = Math.min(6, Math.max(2, Math.floor(c.radius * 0.35)));
    for (let k = 0; k < rocksPerCrater; k++) {
      const angle = pseudoRand() * Math.PI * 2;
      // Ejecta deposits concentrated near the crest and outer rim slope (0.95 to 1.35 * radius)
      const dist = c.radius * (0.95 + pseudoRand() * 0.4);
      const x = c.cx + Math.cos(angle) * dist;
      const z = c.cz + Math.sin(angle) * dist;

      if (Math.hypot(x, z) < 19.5) continue;
      if (Math.hypot(x - -20.0, z - -16.0) < 10.5) continue;

      const baseScale = 0.4 + pseudoRand() * 0.95;
      const sx = baseScale * (0.85 + pseudoRand() * 0.3);
      const sy = baseScale * (0.65 + pseudoRand() * 0.3);
      const sz = baseScale * (0.85 + pseudoRand() * 0.3);

      const groundY = getInterpolatedTerrainHeight(x, z);
      const embedY = groundY + sy * 0.35;

      const rot: [number, number, number] = [
        pseudoRand() * Math.PI,
        pseudoRand() * Math.PI,
        pseudoRand() * Math.PI,
      ];

      const boulderRadius = Math.max(sx, sz) * 0.75;

      instances.push({
        position: [x, embedY, z],
        rotation: rot,
        scale: [sx, sy, sz],
        radius: boulderRadius,
      });

      if (baseScale >= 0.55) {
        obstacles.push({
          x,
          z,
          radius: boulderRadius,
          name: `Crater Ejecta Block ${instances.length}`,
        });
      }
    }
  }

  // 3. Fine Lunar Gravel & Pebble Fragments (220 small surface pebbles, scale 0.08m to 0.24m)
  attempts = 0;
  while (gravel.length < 220 && attempts < 1200) {
    attempts++;
    const angle = pseudoRand() * Math.PI * 2;
    const radius = 18.0 + pseudoRand() * 95.0;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    if (Math.hypot(x, z) < 19.0) continue;
    if (Math.hypot(x - -20.0, z - -16.0) < 9.5) continue;

    const baseScale = 0.08 + Math.pow(pseudoRand(), 2) * 0.16;
    const sx = baseScale * (0.8 + pseudoRand() * 0.4);
    const sy = baseScale * (0.6 + pseudoRand() * 0.4);
    const sz = baseScale * (0.8 + pseudoRand() * 0.4);

    const groundY = getInterpolatedTerrainHeight(x, z);
    const embedY = groundY + sy * 0.35;

    const rot: [number, number, number] = [
      pseudoRand() * Math.PI,
      pseudoRand() * Math.PI,
      pseudoRand() * Math.PI,
    ];

    gravel.push({
      position: [x, embedY, z],
      rotation: rot,
      scale: [sx, sy, sz],
      radius: Math.max(sx, sz),
    });
  }

  return { instances, gravel, obstacles };
}

const {
  instances: GENERATED_ROCK_INSTANCES,
  gravel: GENERATED_GRAVEL_INSTANCES,
  obstacles: GENERATED_ROCK_OBSTACLES,
} = generateLunarRocks();

export const LUNAR_ROCK_INSTANCES: RockInstance[] = GENERATED_ROCK_INSTANCES;
export const LUNAR_GRAVEL_INSTANCES: RockInstance[] = GENERATED_GRAVEL_INSTANCES;
export const LUNAR_ROCK_OBSTACLES: CylinderObstacle[] = GENERATED_ROCK_OBSTACLES;

export const LUNAR_BASE_CYLINDERS: CylinderObstacle[] = [
  // Solar Array Alpha
  { x: -14.0, z: 16.0, radius: 2.4, name: 'Solar Array Alpha' },
  // Solar Array Beta
  { x: -23.0, z: 24.0, radius: 2.4, name: 'Solar Array Beta' },
];

export const LUNAR_CYLINDER_OBSTACLES: CylinderObstacle[] = [
  ...LUNAR_BASE_CYLINDERS,
  ...LUNAR_ROCK_OBSTACLES,
];

/**
 * Exterior obstacles: Habitat Demonstration Unit outer shell
 */
export const EXTERIOR_BOX_OBSTACLES: BoxObstacle[] = [
  // HDU Main Cylindrical Body approximation box (back and sides)
  { minX: -6.5, maxX: -4.2, minZ: -5.0, maxZ: -1.5, name: 'HDU West Pod' },
  { minX: -2.8, maxX: -1.2, minZ: -5.0, maxZ: -1.5, name: 'HDU East Pod' },
  { minX: -6.5, maxX: -1.2, minZ: -5.5, maxZ: -3.8, name: 'HDU North Core' },
];

/**
 * Complete Authentic 28.14m x 41.04m Lunar Base Interior Capsule Colliders
 * Mapped directly to lunar_base_interior.glb room geometry:
 * - Airlock & South Corridors (X: [-1.4, 1.4], Z: [7.0, 22.8])
 * - Command Bridge (X: [-4.6, 4.6], Z: [-17.5, -9.5])
 * - Crew Quarters / Suit Prep (X: [-13.6, -2.0], Z: [-6.8, 0.6])
 * - Engineering & Life Support (X: [2.0, 13.6], Z: [-6.8, 0.6])
 * - Cargo Bay (X: [2.0, 13.8], Z: [10.0, 21.8])
 * - Medbay / Science Lab (X: [-9.8, -2.0], Z: [2.2, 7.8])
 */
export const INTERIOR_BOX_OBSTACLES: BoxObstacle[] = [
  // 1. South Airlock Chamber outer perimeter
  { minX: -2.0, maxX: 2.0, minZ: 22.8, maxZ: 24.0, name: 'Airlock Outer Blast Wall' },
  { minX: -2.5, maxX: -1.5, minZ: 19.5, maxZ: 23.0, name: 'Airlock West Wall' },
  { minX: 1.5, maxX: 2.5, minZ: 19.5, maxZ: 23.0, name: 'Airlock East Wall' },

  // 2. South Corridor walls (between airlock and cargo bay junction)
  { minX: -2.5, maxX: -1.5, minZ: 7.0, maxZ: 19.5, name: 'South Corridor West Wall' },
  { minX: 1.5, maxX: 2.5, minZ: 17.5, maxZ: 19.5, name: 'South Corridor East Wall Lower' },
  { minX: 1.5, maxX: 2.5, minZ: 7.0, maxZ: 12.5, name: 'South Corridor East Wall Upper' },

  // 3. Central & North Corridor walls
  { minX: -2.5, maxX: -1.5, minZ: 0.6, maxZ: 3.5, name: 'Corridor West Wall Junction' },
  { minX: 1.5, maxX: 2.5, minZ: 0.6, maxZ: 7.0, name: 'Corridor East Wall Mid' },
  { minX: -2.5, maxX: -1.5, minZ: -9.5, maxZ: -6.8, name: 'Corridor West Wall North' },
  { minX: 1.5, maxX: 2.5, minZ: -9.5, maxZ: -6.8, name: 'Corridor East Wall North' },

  // 4. Command Bridge perimeter & forward console
  { minX: -5.5, maxX: 5.5, minZ: -18.2, maxZ: -17.2, name: 'Bridge Forward Bulkhead' },
  { minX: -5.5, maxX: -4.6, minZ: -17.5, maxZ: -9.5, name: 'Bridge West Bulkhead' },
  { minX: 4.6, maxX: 5.5, minZ: -17.5, maxZ: -9.5, name: 'Bridge East Bulkhead' },
  { minX: -5.5, maxX: -1.5, minZ: -10.0, maxZ: -9.2, name: 'Bridge Rear West Bulkhead' },
  { minX: 1.5, maxX: 5.5, minZ: -10.0, maxZ: -9.2, name: 'Bridge Rear East Bulkhead' },
  { minX: -1.8, maxX: 1.8, minZ: -16.8, maxZ: -15.5, name: 'Bridge Helm Console' },

  // 5. Crew Quarters & Suit Prep Room perimeter
  { minX: -14.2, maxX: -13.5, minZ: -7.2, maxZ: 1.0, name: 'Crew Quarters West Wall' },
  { minX: -14.0, maxX: -2.0, minZ: -7.5, maxZ: -6.8, name: 'Crew Quarters North Wall' },
  { minX: -14.0, maxX: -2.0, minZ: 0.6, maxZ: 1.5, name: 'Crew Quarters South Wall' },
  { minX: -2.5, maxX: -1.5, minZ: -7.0, maxZ: -4.5, name: 'Crew Quarters East Wall Upper' },
  { minX: -2.5, maxX: -1.5, minZ: -1.5, maxZ: 1.0, name: 'Crew Quarters East Wall Lower' },

  // 6. Engineering & Life Support Bay perimeter & reactor core
  { minX: 13.5, maxX: 14.2, minZ: -7.2, maxZ: 1.0, name: 'Engineering East Wall' },
  { minX: 2.0, maxX: 14.0, minZ: -7.5, maxZ: -6.8, name: 'Engineering North Wall' },
  { minX: 2.0, maxX: 14.0, minZ: 0.6, maxZ: 1.5, name: 'Engineering South Wall' },
  { minX: 1.5, maxX: 2.5, minZ: -7.0, maxZ: -4.5, name: 'Engineering West Wall Upper' },
  { minX: 1.5, maxX: 2.5, minZ: -1.5, maxZ: 1.0, name: 'Engineering West Wall Lower' },
  { minX: 9.3, maxX: 11.7, minZ: -4.2, maxZ: -1.8, name: 'Engineering Reactor Core' },
  { minX: 8.2, maxX: 8.4, minZ: -4.1, maxZ: -1.9, name: 'Engineering Reactor West Railing' },

  // 7. Cargo Bay perimeter
  { minX: 13.8, maxX: 14.5, minZ: 9.5, maxZ: 22.2, name: 'Cargo Bay East Wall' },
  { minX: 2.0, maxX: 14.0, minZ: 9.2, maxZ: 10.0, name: 'Cargo Bay North Wall' },
  { minX: 2.0, maxX: 14.0, minZ: 21.8, maxZ: 22.5, name: 'Cargo Bay South Wall' },

  // 8. Medbay perimeter
  { minX: -10.5, maxX: -9.8, minZ: 2.0, maxZ: 8.0, name: 'Medbay West Wall' },
  { minX: -10.0, maxX: -2.0, minZ: 1.5, maxZ: 2.2, name: 'Medbay North Wall' },
  { minX: -10.0, maxX: -2.0, minZ: 7.8, maxZ: 8.5, name: 'Medbay South Wall' },
];

/**
 * Resolves player position against base structures and walls based on environment
 * Uses an appropriately sized capsule collider (radius ~0.35m, height ~1.8m).
 */
export function resolveCollisions(
  x: number,
  z: number,
  playerRadius = 0.35,
  environment: GameEnvironment = 'exterior'
): { x: number; z: number } {
  let resolvedX = x;
  let resolvedZ = z;

  if (environment === 'exterior') {
    // 1. Large Domed Habitat Main Perimeter (radius 7.2m at [-20, -16])
    // Clear doorway passage at connector.003 (around [-13.5, -12.25])
    const domeCenterX = -20.0;
    const domeCenterZ = -16.0;
    const distToDomeDoor = Math.hypot(resolvedX - -13.5, resolvedZ - -12.25);

    // If not approaching the doorway corridor, enforce dome outer collision
    if (distToDomeDoor > 3.0) {
      const dx = resolvedX - domeCenterX;
      const dz = resolvedZ - domeCenterZ;
      const distToDome = Math.hypot(dx, dz);
      const minDomeDist = 7.2 + playerRadius;
      if (distToDome < minDomeDist && distToDome > 0.0001) {
        const push = (minDomeDist - distToDome) / distToDome;
        resolvedX += dx * push;
        resolvedZ += dz * push;
      }
    }

    // 2. Check Exterior Cylinder Obstacles (Rover, Solar Arrays, Boulders)
    for (const obs of LUNAR_CYLINDER_OBSTACLES) {
      const dx = resolvedX - obs.x;
      const dz = resolvedZ - obs.z;
      const minDist = obs.radius + playerRadius;

      // Efficient AABB rejection before hypot
      if (Math.abs(dx) > minDist || Math.abs(dz) > minDist) {
        continue;
      }

      const dist = Math.hypot(dx, dz);
      if (dist < minDist && dist > 0.0001) {
        const pushFactor = (minDist - dist) / dist;
        resolvedX += dx * pushFactor;
        resolvedZ += dz * pushFactor;
      }
    }

    // 3. Check Exterior Box Obstacles (HDU body)
    for (const wall of EXTERIOR_BOX_OBSTACLES) {
      const expandedMinX = wall.minX - playerRadius;
      const expandedMaxX = wall.maxX + playerRadius;
      const expandedMinZ = wall.minZ - playerRadius;
      const expandedMaxZ = wall.maxZ + playerRadius;

      if (
        resolvedX >= expandedMinX &&
        resolvedX <= expandedMaxX &&
        resolvedZ >= expandedMinZ &&
        resolvedZ <= expandedMaxZ
      ) {
        const pushLeft = expandedMinX - resolvedX;
        const pushRight = expandedMaxX - resolvedX;
        const pushTop = expandedMinZ - resolvedZ;
        const pushBottom = expandedMaxZ - resolvedZ;

        const minPushX = Math.abs(pushLeft) < Math.abs(pushRight) ? pushLeft : pushRight;
        const minPushZ = Math.abs(pushTop) < Math.abs(pushBottom) ? pushTop : pushBottom;

        if (Math.abs(minPushX) < Math.abs(minPushZ)) {
          resolvedX += minPushX;
        } else {
          resolvedZ += minPushZ;
        }
      }
    }

    // Exterior World Bounds
    const maxWorldRadius = 138.0;
    const currentRadius = Math.hypot(resolvedX, resolvedZ);
    if (currentRadius > maxWorldRadius) {
      const scale = maxWorldRadius / currentRadius;
      resolvedX *= scale;
      resolvedZ *= scale;
    }
  } else {
    // INTERIOR ENVIRONMENT COLLISION RESOLUTION (CAPSULE COLLIDER)
    for (const wall of INTERIOR_BOX_OBSTACLES) {
      const expandedMinX = wall.minX - playerRadius;
      const expandedMaxX = wall.maxX + playerRadius;
      const expandedMinZ = wall.minZ - playerRadius;
      const expandedMaxZ = wall.maxZ + playerRadius;

      if (
        resolvedX >= expandedMinX &&
        resolvedX <= expandedMaxX &&
        resolvedZ >= expandedMinZ &&
        resolvedZ <= expandedMaxZ
      ) {
        const pushLeft = expandedMinX - resolvedX;
        const pushRight = expandedMaxX - resolvedX;
        const pushTop = expandedMinZ - resolvedZ;
        const pushBottom = expandedMaxZ - resolvedZ;

        const minPushX = Math.abs(pushLeft) < Math.abs(pushRight) ? pushLeft : pushRight;
        const minPushZ = Math.abs(pushTop) < Math.abs(pushBottom) ? pushTop : pushBottom;

        if (Math.abs(minPushX) < Math.abs(minPushZ)) {
          resolvedX += minPushX;
        } else {
          resolvedZ += minPushZ;
        }
      }
    }

    // Multi-Room Interior Perimeter Bounds Clamp (covers 28.14m x 41.04m base)
    resolvedX = Math.max(-13.8, Math.min(13.8, resolvedX));
    resolvedZ = Math.max(-17.8, Math.min(22.8, resolvedZ));
  }

  return { x: resolvedX, z: resolvedZ };
}
