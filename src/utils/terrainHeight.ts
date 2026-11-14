import type { GameEnvironment } from '../types/game';

interface Crater {
  cx: number;
  cz: number;
  radius: number;
  depth: number;
  rimHeight: number;
}

const CRATERS: Crater[] = [
  { cx: 58, cz: -50, radius: 28, depth: 5.5, rimHeight: 1.5 },
  { cx: -65, cz: 42, radius: 24, depth: 4.2, rimHeight: 1.2 },
  { cx: -45, cz: -60, radius: 18, depth: 3.2, rimHeight: 0.9 },
  { cx: 70, cz: 55, radius: 22, depth: 3.8, rimHeight: 1.0 },
  { cx: -32, cz: 10, radius: 9.5, depth: 1.6, rimHeight: 0.45 },
  { cx: 36, cz: 20, radius: 8.5, depth: 1.4, rimHeight: 0.4 },
  { cx: 8, cz: -52, radius: 12, depth: 2.1, rimHeight: 0.6 },
  { cx: -18, cz: 60, radius: 15, depth: 2.6, rimHeight: 0.75 },
];

/**
 * Calculates exact mathematical ground elevation at given coordinates.
 * Inside the pressurized habitat, elevation is pinned to the interior floor deck (0.06m).
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

  const distFromCenter = Math.sqrt(x * x + z * z);
  const baseFlatFactor = Math.min(1, Math.max(0, (distFromCenter - 18) / 16));

  let y =
    (Math.sin(x * 0.02) * Math.cos(z * 0.02) * 1.8 +
      Math.sin(x * 0.05 + 1.2) * Math.cos(z * 0.04) * 0.9 +
      Math.cos(x * 0.09) * Math.sin(z * 0.08) * 0.4) *
    baseFlatFactor;

  for (const c of CRATERS) {
    const dx = x - c.cx;
    const dz = z - c.cz;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const normDist = dist / c.radius;

    if (normDist < 2.0) {
      if (normDist < 1.0) {
        const bowl = (1.0 - normDist * normDist) * c.depth;
        y -= bowl;
      }
      const rimDelta = normDist - 1.0;
      const rim = c.rimHeight * Math.exp(-((rimDelta * rimDelta) / 0.06));
      y += rim;
    }
  }

  return y;
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

export const LUNAR_CYLINDER_OBSTACLES: CylinderObstacle[] = [
  // Space Exploration Vehicle (MMSEV) Rover
  { x: 9.5, z: -1.5, radius: 3.8, name: 'Lunar Rover MMSEV' },
  // Solar Array Alpha
  { x: -14.0, z: 16.0, radius: 2.4, name: 'Solar Array Alpha' },
  // Solar Array Beta
  { x: 16.0, z: 16.0, radius: 2.4, name: 'Solar Array Beta' },
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

    // 2. Check Exterior Cylinder Obstacles (Rover, Solar Arrays)
    for (const obs of LUNAR_CYLINDER_OBSTACLES) {
      const dx = resolvedX - obs.x;
      const dz = resolvedZ - obs.z;
      const dist = Math.hypot(dx, dz);
      const minDist = obs.radius + playerRadius;

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
    const maxWorldRadius = 145.0;
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
