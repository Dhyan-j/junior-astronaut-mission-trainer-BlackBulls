import { useMemo, useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { LUNAR_ROCK_INSTANCES } from '../../utils/terrainHeight';

export function LunarRocks() {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const geometry = useMemo(() => {
    // Irregular polyhedral rock geometry using perturbed Dodecahedron
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

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#2a2c32',
      roughness: 0.96,
      metalness: 0.05,
      flatShading: true,
    });
  }, []);

  useLayoutEffect(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();

    LUNAR_ROCK_INSTANCES.forEach((rock, idx) => {
      dummy.position.set(rock.position[0], rock.position[1], rock.position[2]);
      dummy.rotation.set(rock.rotation[0], rock.rotation[1], rock.rotation[2]);
      dummy.scale.set(rock.scale[0], rock.scale[1], rock.scale[2]);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(idx, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, LUNAR_ROCK_INSTANCES.length]}
      castShadow
      receiveShadow
    />
  );
}
