import { useMemo, useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  LUNAR_ROCK_INSTANCES,
  LUNAR_GRAVEL_INSTANCES,
} from '../../utils/terrainHeight';

export function LunarRocks() {
  const rockMeshRef = useRef<THREE.InstancedMesh>(null);
  const gravelMeshRef = useRef<THREE.InstancedMesh>(null);

  // 1. Prominent Boulder Geometry: perturbed crystalline/angular dodecahedron
  const boulderGeometry = useMemo(() => {
    const geo = new THREE.DodecahedronGeometry(1, 1);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const vz = pos.getZ(i);
      const noise =
        1.0 + Math.sin(vx * 7) * Math.cos(vy * 6) * Math.sin(vz * 8) * 0.22;
      pos.setXYZ(i, vx * noise, vy * noise, vz * noise);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  // 2. Fine Gravel & Pebble Geometry: irregular fractured fragment
  const gravelGeometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1, 0);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const vz = pos.getZ(i);
      const noise =
        1.0 + Math.sin(vx * 9 + vz * 6) * 0.28;
      pos.setXYZ(i, vx * noise, vy * 0.8 * noise, vz * noise);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  const rockMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#2d3037',
      roughness: 0.95,
      metalness: 0.04,
      flatShading: true,
    });
  }, []);

  const gravelMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#343840',
      roughness: 0.97,
      metalness: 0.03,
      flatShading: true,
    });
  }, []);

  useLayoutEffect(() => {
    if (!rockMeshRef.current || !gravelMeshRef.current) return;
    const dummy = new THREE.Object3D();

    // Populate large/medium boulders & crater ejecta
    LUNAR_ROCK_INSTANCES.forEach((rock, idx) => {
      dummy.position.set(rock.position[0], rock.position[1], rock.position[2]);
      dummy.rotation.set(rock.rotation[0], rock.rotation[1], rock.rotation[2]);
      dummy.scale.set(rock.scale[0], rock.scale[1], rock.scale[2]);
      dummy.updateMatrix();
      rockMeshRef.current!.setMatrixAt(idx, dummy.matrix);
    });
    rockMeshRef.current.instanceMatrix.needsUpdate = true;

    // Populate fine regolith gravel & pebble fragments
    LUNAR_GRAVEL_INSTANCES.forEach((stone, idx) => {
      dummy.position.set(stone.position[0], stone.position[1], stone.position[2]);
      dummy.rotation.set(stone.rotation[0], stone.rotation[1], stone.rotation[2]);
      dummy.scale.set(stone.scale[0], stone.scale[1], stone.scale[2]);
      dummy.updateMatrix();
      gravelMeshRef.current!.setMatrixAt(idx, dummy.matrix);
    });
    gravelMeshRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <group name="lunar-surface-rocks">
      {/* Prominent Boulders and Crater-Rim Ejecta Blocks */}
      <instancedMesh
        ref={rockMeshRef}
        args={[boulderGeometry, rockMaterial, LUNAR_ROCK_INSTANCES.length]}
        castShadow
        receiveShadow
      />

      {/* Scattered Regolith Gravel & Pebbles */}
      <instancedMesh
        ref={gravelMeshRef}
        args={[gravelGeometry, gravelMaterial, LUNAR_GRAVEL_INSTANCES.length]}
        castShadow
        receiveShadow
      />
    </group>
  );
}
