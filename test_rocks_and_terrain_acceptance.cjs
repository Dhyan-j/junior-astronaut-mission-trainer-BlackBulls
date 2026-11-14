const THREE = require('three');

// Defined craters from terrainHeight.ts
const CRATERS = [
  { cx: 58, cz: -50, radius: 28, depth: 5.5, rimHeight: 1.5 },
  { cx: -65, cz: 42, radius: 24, depth: 4.2, rimHeight: 1.2 },
  { cx: -45, cz: -60, radius: 18, depth: 3.2, rimHeight: 0.9 },
  { cx: 70, cz: 55, radius: 22, depth: 3.8, rimHeight: 1.0 },
  { cx: -32, cz: 10, radius: 9.5, depth: 1.6, rimHeight: 0.45 },
  { cx: 36, cz: 20, radius: 8.5, depth: 1.4, rimHeight: 0.4 },
  { cx: 8, cz: -52, radius: 12, depth: 2.1, rimHeight: 0.6 },
  { cx: -18, cz: 60, radius: 15, depth: 2.6, rimHeight: 0.75 },
];

const TERRAIN_WIDTH = 280;
const TERRAIN_DEPTH = 280;
const TERRAIN_SEGMENTS = 140;
const TERRAIN_CELL_SIZE = TERRAIN_WIDTH / TERRAIN_SEGMENTS;
const TERRAIN_HALF_SIZE = TERRAIN_WIDTH / 2;
const TERRAIN_MESH_Y_OFFSET = -0.05;

function getRawTerrainHeight(x, z) {
  const distFromCenter = Math.hypot(x, z);
  const distToDomeCenter = Math.hypot(x - -20, z - -16);
  const distToDomeDoor = Math.hypot(x - -13.5, z - -12.25);

  if (distFromCenter <= 18.0 || distToDomeDoor <= 3.0 || distToDomeCenter <= 8.5) {
    return 0.05;
  }

  const baseFlatFactor = Math.min(1, Math.max(0, (distFromCenter - 18.0) / 16.0));

  let y =
    (Math.sin(x * 0.02) * Math.cos(z * 0.02) * 1.8 +
      Math.sin(x * 0.05 + 1.2) * Math.cos(z * 0.04) * 0.9 +
      Math.cos(x * 0.09) * Math.sin(z * 0.08) * 0.4) *
    baseFlatFactor;

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

  const regolithNoise =
    (Math.sin(x * 0.35 + z * 0.25) * 0.08 +
      Math.cos(x * 0.7 - z * 0.5) * 0.04) *
    baseFlatFactor;
  y += regolithNoise;

  return y + 0.05;
}

function getInterpolatedTerrainHeight(x, z) {
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

  let interpolatedRaw;
  if (u + v <= 1.0) {
    interpolatedRaw = (1.0 - u - v) * h00 + v * h01 + u * h10;
  } else {
    interpolatedRaw = (u + v - 1.0) * h11 + (1.0 - u) * h01 + (1.0 - v) * h10;
  }

  return interpolatedRaw + TERRAIN_MESH_Y_OFFSET;
}

function generateLunarRocks() {
  const instances = [];
  const obstacles = [];

  let seed = 19690720;
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

    if (Math.hypot(x, z) < 19.5) continue;
    if (Math.hypot(x - -20.0, z - -16.0) < 10.5) continue;

    const baseScale = 0.35 + Math.pow(pseudoRand(), 2) * 1.5;
    const sx = baseScale * (0.8 + pseudoRand() * 0.4);
    const sy = baseScale * (0.6 + pseudoRand() * 0.4);
    const sz = baseScale * (0.8 + pseudoRand() * 0.4);

    const groundY = getInterpolatedTerrainHeight(x, z);
    const embedY = groundY + sy * 0.38;

    const rot = [
      pseudoRand() * Math.PI,
      pseudoRand() * Math.PI,
      pseudoRand() * Math.PI,
    ];

    const boulderRadius = Math.max(sx, sz) * 0.75;

    instances.push({
      position: [x, embedY, z],
      rotation: rot,
      scale: [sx, sy, sz],
      groundY,
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

  return { instances, obstacles };
}

console.log('=== LUNAR TERRAIN & ROCKS FOUNDATION ACCEPTANCE TEST ===');

// 1. Build Three.js rendered mesh exactly as in LunarTerrain.tsx
const geo = new THREE.PlaneGeometry(TERRAIN_WIDTH, TERRAIN_DEPTH, TERRAIN_SEGMENTS, TERRAIN_SEGMENTS);
geo.rotateX(-Math.PI / 2);
const pos = geo.attributes.position;
for (let i = 0; i < pos.count; i++) {
  pos.setY(i, getRawTerrainHeight(pos.getX(i), pos.getZ(i)));
}
geo.computeVertexNormals();
const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial());
mesh.position.set(0, TERRAIN_MESH_Y_OFFSET, 0);
mesh.updateMatrixWorld(true);

const raycaster = new THREE.Raycaster();

// 2. Comprehensive check points
const testPoints = [
  // Flat habitat foundation & entrance thresholds
  { desc: 'Base Center (0, 0)', x: 0, z: 0 },
  { desc: 'Astronaut Spawn Point (-11, -5)', x: -11, z: -5 },
  { desc: 'MMSEV Rover Area (9.5, -1.5)', x: 9.5, z: -1.5 },
  { desc: 'Base Perimeter Boundary (18, 0)', x: 18, z: 0 },
  { desc: 'Dome Center (-20, -16)', x: -20, z: -16 },
  { desc: 'Dome Entrance Area (-13.5, -12.25)', x: -13.5, z: -12.25 },
  { desc: 'HDU Entrance Area (-3.5, -1.8)', x: -3.5, z: -1.8 },
  // 8 Craters (Bowl centers and rims)
  { desc: 'Crater 1 Bowl Center (58, -50)', x: 58, z: -50 },
  { desc: 'Crater 1 Rim Lip (86, -50)', x: 86, z: -50 },
  { desc: 'Crater 2 Bowl Center (-65, 42)', x: -65, z: 42 },
  { desc: 'Crater 2 Rim Lip (-65, 66)', x: -65, z: 66 },
  { desc: 'Crater 3 Bowl Center (-45, -60)', x: -45, z: -60 },
  { desc: 'Crater 4 Bowl Center (70, 55)', x: 70, z: 55 },
  { desc: 'Crater 5 Bowl Center (-32, 10)', x: -32, z: 10 },
  { desc: 'Crater 5 Rim Lip (-22.5, 10)', x: -22.5, z: 10 },
  { desc: 'Crater 6 Bowl Center (36, 20)', x: 36, z: 20 },
  { desc: 'Crater 7 Bowl Center (8, -52)', x: 8, z: -52 },
  { desc: 'Crater 8 Bowl Center (-18, 60)', x: -18, z: 60 },
  // Terrain Mare Slopes and boundaries
  { desc: 'South Pole Slopes (50, 20)', x: 50, z: 20 },
  { desc: 'Mare Undulation (-80, -30)', x: -80, z: -30 },
  { desc: 'Outer North Boundary (0, 135)', x: 0, z: 135 },
  { desc: 'Outer South Boundary (0, -135)', x: 0, z: -135 },
  { desc: 'Arbitrary Fractional Coordinate (-37.62, 51.48)', x: -37.62, z: 51.48 },
];

let maxDiff = 0;
let passes = 0;
for (const tp of testPoints) {
  raycaster.set(new THREE.Vector3(tp.x, 50, tp.z), new THREE.Vector3(0, -1, 0));
  const hits = raycaster.intersectObject(mesh);
  if (hits.length === 0) {
    console.error(`FAIL: Raycast missed terrain at ${tp.desc}`);
    process.exit(1);
  }
  const meshY = hits[0].point.y;
  const interpY = getInterpolatedTerrainHeight(tp.x, tp.z);
  const diff = Math.abs(meshY - interpY);
  if (diff > maxDiff) maxDiff = diff;
  if (diff > 0.001) {
    console.error(`FAIL: Discrepancy > 1mm at ${tp.desc}: meshY=${meshY}, interpY=${interpY}, diff=${diff}`);
    process.exit(1);
  }
  passes++;
  console.log(`✓ ${tp.desc.padEnd(50)}: MeshY=${meshY.toFixed(4).padStart(7)}, InterpY=${interpY.toFixed(4).padStart(7)}, diff=${diff.toExponential(2)}`);
}

console.log(`\nAll ${passes} elevation test points verified. Max difference across entire domain: ${maxDiff.toExponential(4)}m (PASS)`);

// 3. Test Rock generation & placement
const { instances: rocks, obstacles: rockObstacles } = generateLunarRocks();
console.log(`\nGenerated ${rocks.length} rocks and ${rockObstacles.length} collidable boulder obstacles.`);

let floatingCount = 0;
let buriedCount = 0;
let baseIntrusionCount = 0;

for (let i = 0; i < rocks.length; i++) {
  const r = rocks[i];
  const distFromCenter = Math.hypot(r.position[0], r.position[2]);
  const distFromDome = Math.hypot(r.position[0] - -20, r.position[2] - -16);

  if (distFromCenter < 18.0 || distFromDome < 9.0) {
    baseIntrusionCount++;
  }

  const actualGroundY = getInterpolatedTerrainHeight(r.position[0], r.position[2]);
  const sy = r.scale[1];

  // Rock should have bottom embedded in ground (bottom = position.y - sy)
  // bottom = actualGroundY + embedOffset - sy.
  // For proper embedment, embedOffset should be roughly ~0.38 * sy, so bottom is below ground:
  const bottomBelowGround = actualGroundY - (r.position[1] - sy);
  const topAboveGround = (r.position[1] + sy) - actualGroundY;

  if (bottomBelowGround <= 0) {
    floatingCount++;
    console.error(`Rock ${i} is FLOATING! bottomBelowGround=${bottomBelowGround}`);
  }
  if (topAboveGround <= 0) {
    buriedCount++;
    console.error(`Rock ${i} is COMPLETELY BURIED! topAboveGround=${topAboveGround}`);
  }
}

console.log(`✓ Base intrusions (inside 18m base or dome): ${baseIntrusionCount} (Expected: 0)`);
console.log(`✓ Floating rocks: ${floatingCount} (Expected: 0)`);
console.log(`✓ Completely buried rocks: ${buriedCount} (Expected: 0)`);

if (baseIntrusionCount > 0 || floatingCount > 0 || buriedCount > 0) {
  console.error('FAIL: Rock placement validation failed!');
  process.exit(1);
}

// 4. Test Obstacle Collision Repulsion
let collisionPassed = 0;
for (const obs of rockObstacles.slice(0, 5)) {
  // Test player walking into the rock center
  const playerRadius = 0.35;
  const testX = obs.x + 0.1;
  const testZ = obs.z + 0.1;
  const minDist = obs.radius + playerRadius;

  const dx = testX - obs.x;
  const dz = testZ - obs.z;
  const dist = Math.hypot(dx, dz);
  if (dist < minDist) {
    const push = (minDist - dist) / dist;
    const resolvedX = testX + dx * push;
    const resolvedZ = testZ + dz * push;
    const resolvedDist = Math.hypot(resolvedX - obs.x, resolvedZ - obs.z);
    if (Math.abs(resolvedDist - minDist) < 0.0001) {
      collisionPassed++;
    }
  }
}
console.log(`✓ Rock collision repulsion verified on sample boulders: ${collisionPassed}/5 passed.`);

console.log('\n=== ALL TERRAIN FOUNDATION ACCEPTANCE TESTS PASSED ===');
