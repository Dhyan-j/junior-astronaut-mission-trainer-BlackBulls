import { useMemo } from 'react';
import * as THREE from 'three';
import {
  getRawTerrainHeight,
  TERRAIN_WIDTH,
  TERRAIN_DEPTH,
  TERRAIN_SEGMENTS,
  TERRAIN_MESH_Y_OFFSET,
} from '../../utils/terrainHeight';

export function LunarTerrain() {
  const { geometry } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      TERRAIN_WIDTH,
      TERRAIN_DEPTH,
      TERRAIN_SEGMENTS,
      TERRAIN_SEGMENTS
    );
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, getRawTerrainHeight(x, z));
    }

    geo.computeVertexNormals();

    return { geometry: geo };
  }, []);

  return (
    <mesh geometry={geometry} receiveShadow position={[0, TERRAIN_MESH_Y_OFFSET, 0]}>
      <meshStandardMaterial
        color="#32353b"
        roughness={0.94}
        metalness={0.03}
        flatShading={false}
      />
    </mesh>
  );
}
