import { useMemo } from 'react';
import * as THREE from 'three';
import {
  getRawTerrainHeight,
  getTerrainAlbedoFactor,
  TERRAIN_WIDTH,
  TERRAIN_DEPTH,
  TERRAIN_SEGMENTS,
  TERRAIN_MESH_Y_OFFSET,
} from '../../utils/terrainHeight';

function createRegolithNormalTexture(): THREE.Texture | null {
  if (typeof document === 'undefined') return null;

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  // Pseudo-random 2D hash for value noise
  const hash2D = (ix: number, iy: number) => {
    let n = Math.sin(ix * 12.9898 + iy * 78.233) * 43758.5453;
    return n - Math.floor(n);
  };

  // Smooth interpolated value noise
  const valNoise = (x: number, y: number, freq: number) => {
    const fx = x * freq;
    const fy = y * freq;
    const ix = Math.floor(fx);
    const iy = Math.floor(fy);
    const fracX = fx - ix;
    const fracY = fy - iy;

    // Smoothstep interpolation
    const sx = fracX * fracX * (3 - 2 * fracX);
    const sy = fracY * fracY * (3 - 2 * fracY);

    const n00 = hash2D(ix, iy);
    const n10 = hash2D(ix + 1, iy);
    const n01 = hash2D(ix, iy + 1);
    const n11 = hash2D(ix + 1, iy + 1);

    const nx0 = n00 * (1 - sx) + n10 * sx;
    const nx1 = n01 * (1 - sx) + n11 * sx;
    return nx0 * (1 - sy) + nx1 * sy;
  };

  // Generate multi-octave fBm regolith heightfield with micro-craterlets
  const heights = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    const v = y / size;
    for (let x = 0; x < size; x++) {
      const u = x / size;

      // 5-octave fBm value noise
      let h =
        valNoise(u, v, 6) * 0.45 +
        valNoise(u, v, 14) * 0.28 +
        valNoise(u, v, 28) * 0.16 +
        valNoise(u, v, 56) * 0.08 +
        valNoise(u, v, 112) * 0.03;

      // Micro-craterlet dimples scattered across regolith
      const cU = (u * 4) % 1;
      const cV = (v * 4) % 1;
      const distToCenter = Math.hypot(cU - 0.5, cV - 0.5);
      if (distToCenter < 0.22) {
        const normD = distToCenter / 0.22;
        h -= (1.0 - normD * normD) * 0.06;
      }

      heights[y * size + x] = h;
    }
  }

  // Sobel gradient operator for smooth, natural tangent-space normals
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const xPrev = (x - 1 + size) % size;
      const xNext = (x + 1) % size;
      const yPrev = (y - 1 + size) % size;
      const yNext = (y + 1) % size;

      const dx = (heights[y * size + xNext] - heights[y * size + xPrev]) * 1.8;
      const dy = (heights[yNext * size + x] - heights[yPrev * size + x]) * 1.8;
      const dz = 1.0;

      const len = Math.hypot(dx, dy, dz);
      const nx = -dx / len;
      const ny = -dy / len;
      const nz = dz / len;

      const idx = (y * size + x) * 4;
      data[idx] = Math.floor((nx * 0.5 + 0.5) * 255);
      data[idx + 1] = Math.floor((ny * 0.5 + 0.5) * 255);
      data[idx + 2] = Math.floor((nz * 0.5 + 0.5) * 255);
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(14, 14); // Broad 20-meter repeat eliminating visible tiling
  texture.needsUpdate = true;
  return texture;
}

export function LunarTerrain() {
  const normalMap = useMemo(() => createRegolithNormalTexture(), []);

  const { geometry } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      TERRAIN_WIDTH,
      TERRAIN_DEPTH,
      TERRAIN_SEGMENTS,
      TERRAIN_SEGMENTS
    );
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    // Natural lunar regolith base tone
    const baseR = 0.22;
    const baseG = 0.235;
    const baseB = 0.26;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, getRawTerrainHeight(x, z));

      // Calculate per-vertex albedo factor (bright ejecta blankets vs dark mare depressions)
      const albedo = getTerrainAlbedoFactor(x, z);
      colors[i * 3] = Math.min(1.0, baseR * albedo);
      colors[i * 3 + 1] = Math.min(1.0, baseG * albedo);
      colors[i * 3 + 2] = Math.min(1.0, baseB * albedo);
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    return { geometry: geo };
  }, []);

  return (
    <mesh
      geometry={geometry}
      receiveShadow
      position={[0, TERRAIN_MESH_Y_OFFSET, 0]}
    >
      <meshStandardMaterial
        vertexColors
        roughness={0.95}
        metalness={0.02}
        normalMap={normalMap}
        normalScale={new THREE.Vector2(0.32, 0.32)}
        flatShading={false}
      />
    </mesh>
  );
}
