import type { GameEnvironment } from '../types/game';

export interface Crater {
  cx: number;
  cz: number;
  radius: number;
  depth: number;
  rimHeight: number;
}

export const CRATERS: Crater[] = [
  { cx: 58, cz: -50, radius: 28, depth: 5.5, rimHeight: 1.5 },
  { cx: -65, cz: 42, radius: 24, depth: 4.2, rimHeight: 1.2 },
  { cx: -45, cz: -60, radius: 18, depth: 3.2, rimHeight: 0.9 },
  { cx: 70, cz: 55, radius: 22, depth: 3.8, rimHeight: 1.0 },
  { cx: -32, cz: 10, radius: 9.5, depth: 1.6, rimHeight: 0.45 },
  { cx: 36, cz: 20, radius: 8.5, depth: 1.4, rimHeight: 0.4 },
  { cx: 8, cz: -52, radius: 12, depth: 2.1, rimHeight: 0.6 },
  { cx: -18, cz: 60, radius: 15, depth: 2.6, rimHeight: 0.75 },
];

export const TERRAIN_WIDTH = 280;
export const TERRAIN_DEPTH = 280;
export const TERRAIN_SEGMENTS = 140;
export const TERRAIN_CELL_SIZE = TERRAIN_WIDTH / TERRAIN_SEGMENTS; // 2.0m
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

  // Smooth blending factor outside central foundation (18m to 34m)
  const baseFlatFactor = Math.min(1, Math.max(0, (distFromCenter - 18.0) / 16.0));

  // Subtle undulating lunar mare hills
  let y =
    (Math.sin(x * 0.02) * Math.cos(z * 0.02) * 1.8 +
      Math.sin(x * 0.05 + 1.2) * Math.cos(z * 0.04) * 0.9 +
      Math.cos(x * 0.09) * Math.sin(z * 0.08) * 0.4) *
    baseFlatFactor;

  // Impact craters with bowls and raised Gaussian rims (modulated by baseFlatFactor)
  for (const c of CRATERS) {
    const dx = x - c.cx;
    const dz = z - c.cz;
    const dist = Math.hypot(dx, dz);
    const normDist = dist / c.radius;

    if (normDist < 2.0) {
      if (normDist < 1.0) {
        const bowl = (1.0 - normDist * normDist) * c.depth;
        y -= bowl * baseFlatFactor;
      }
      const rimDelta = normDist - 1.0;
      const rim = c.rimHeight * Math.exp(-((rimDelta * rimDelta) / 0.06));
      y += rim * baseFlatFactor;
    }
  }

  // Subtle regolith micro-undulation for natural surface detail
  const regolithNoise =
    (Math.sin(x * 0.35 + z * 0.25) * 0.08 +
      Math.cos(x * 0.7 - z * 0.5) * 0.04) *
    baseFlatFactor;
  y += regolithNoise;

  return y + 0.05;
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
    return 0.06; // Flat pressurized habitat deck height
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

// Procedural boulder generator using seeded pseudo-random distribution
function generateLunarRocks(): {
  instances: RockInstance[];
  obstacles: CylinderObstacle[];
} {
  const instances: RockInstance[] = [];
  const obstacles: CylinderObstacle[] = [];

  let seed = 19690720; // Apollo 11 landing date
  const pseudoRand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const count = 90;
  let attempts = 0;

  while (instances.length < count && attempts < 1000) {
    attempts++;
    const angle = pseudoRand() * Math.PI * 2;
    const radius = 20.0 + pseudoRand() * 92.0;
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

    // Exact ground elevation from the interpolated terrain mesh
    const groundY = getInterpolatedTerrainHeight(x, z);
    // Embed the boulder ~38% into the regolith so it sits flush on the surface
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

    // Substantial boulders provide physical obstacle collision for the astronaut & rover
    if (baseScale >= 0.55) {
      obstacles.push({
        x,
        z,
        radius: boulderRadius,
        name: `Lunar Boulder ${instances.length}`,
      });
    }
  }

  return { instances, obstacles };
}

const { instances: GENERATED_ROCK_INSTANCES, obstacles: GENERATED_ROCK_OBSTACLES } =
  generateLunarRocks();

export const LUNAR_ROCK_INSTANCES: RockInstance[] = GENERATED_ROCK_INSTANCES;
export const LUNAR_ROCK_OBSTACLES: CylinderObstacle[] = GENERATED_ROCK_OBSTACLES;

export const LUNAR_BASE_CYLINDERS: CylinderObstacle[] = [
  // Space Exploration Vehicle (MMSEV) Rover
  { x: 9.5, z: -1.5, radius: 3.8, name: 'Lunar Rover MMSEV' },
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
 * Authentic NASA Interior Work Bay Capsule Colliders (equipment racks & bulkheads)
 * Preserves completely unobstructed central passage (Z: [-1.4, 1.4])
 */
export const INTERIOR_BOX_OBSTACLES: BoxObstacle[] = [
  // North Equipment Racks West (racks 0, 1 along X: -3.4 to -0.95, Z: 1.7 to 2.8)
  { minX: -3.4, maxX: -0.95, minZ: 1.7, maxZ: 2.8, name: 'North Equipment Racks West' },

  // North Equipment Racks East (racks 2, 3 along X: 0.95 to 3.4, Z: 1.7 to 2.8)
  { minX: 0.95, maxX: 3.4, minZ: 1.7, maxZ: 2.8, name: 'North Equipment Racks East' },

  // South Stowage Racks & Glovebox (Z: -2.8 to -1.9, along X: -3.4 to 3.4)
  { minX: -3.4, maxX: 3.4, minZ: -2.8, maxZ: -1.9, name: 'South Equipment Stowage' },

  // Outer Bulkhead Walls
  // West End Wall
  { minX: -4.2, maxX: -3.6, minZ: -2.8, maxZ: 2.8, name: 'Work Bay West Bulkhead' },
  // East End Wall
  { minX: 3.6, maxX: 4.2, minZ: -2.8, maxZ: 2.8, name: 'Work Bay East Bulkhead' },

  // Airlock Inner Vestibule Portals
  { minX: -3.2, maxX: -1.0, minZ: 3.0, maxZ: 3.6, name: 'Airlock Portal West' },
  { minX: 1.0, maxX: 3.2, minZ: 3.0, maxZ: 3.6, name: 'Airlock Portal East' },
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

    // Interior Perimeter Bounds Clamp
    resolvedX = Math.max(-3.5, Math.min(3.5, resolvedX));
    resolvedZ = Math.max(-2.2, Math.min(4.0, resolvedZ));
  }

  return { x: resolvedX, z: resolvedZ };
}
