import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { GeologicalSample } from '../../types/game';

interface GeologicalSamplesProps {
  samples: GeologicalSample[];
  activeSampleId?: string | null;
  onInspectSample?: (sample: GeologicalSample) => void;
}

export function GeologicalSamples({
  samples,
  activeSampleId,
  onInspectSample,
}: GeologicalSamplesProps) {
  const beaconRingsRef = useRef<THREE.Group>(null);
  const floatingMarkersRef = useRef<THREE.Group>(null);

  // Expose samples to window for testing & debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as unknown as { __GEOLOGICAL_SAMPLES__?: GeologicalSample[] }).__GEOLOGICAL_SAMPLES__ = samples;
    }
  }, [samples]);

  // Anorthosite geometry: blocky crystalline plagioclase facets
  const anorthositeGeo = useMemo(() => {
    const geo = new THREE.DodecahedronGeometry(0.34, 1);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const vz = pos.getZ(i);
      pos.setXYZ(i, vx * (1 + Math.sin(vy * 8) * 0.18), vy * 0.85, vz * (1 + Math.cos(vx * 7) * 0.16));
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Basalt geometry: vesicular porous volcanic rock with angular fractures
  const basaltGeo = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(0.36, 1);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const vz = pos.getZ(i);
      pos.setXYZ(i, vx * 1.2, vy * 0.7, vz * 0.9);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Breccia geometry: composite angular clasts fused in matrix
  const brecciaGeo = useMemo(() => {
    const geo = new THREE.BoxGeometry(0.48, 0.32, 0.42, 3, 3, 3);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const vz = pos.getZ(i);
      pos.setXYZ(i, vx + Math.sin(vz * 12) * 0.05, vy + Math.cos(vx * 10) * 0.04, vz + Math.sin(vy * 9) * 0.05);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Volcanic Glass geometry: smooth vitreous droplets / volcanic spherules
  const glassGeo = useMemo(() => {
    const geo = new THREE.SphereGeometry(0.30, 20, 20);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const vz = pos.getZ(i);
      pos.setXYZ(i, vx * 1.05, vy * 0.92, vz * 1.05);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Marker diamond geometry
  const diamondGeo = useMemo(() => new THREE.OctahedronGeometry(0.14, 0), []);

  // Animate beacon rings pulsing and markers bobbing/rotating
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (beaconRingsRef.current) {
      beaconRingsRef.current.children.forEach((child, idx) => {
        const ring = child as THREE.Mesh;
        const s = 1.0 + Math.sin(t * 2.5 + idx) * 0.12;
        ring.scale.set(s, 1, s);
      });
    }

    if (floatingMarkersRef.current) {
      floatingMarkersRef.current.children.forEach((child, idx) => {
        const marker = child as THREE.Mesh;
        marker.rotation.y = t * 1.2 + idx;
        marker.position.y = 0.72 + Math.sin(t * 2.0 + idx) * 0.08;
      });
    }
  });

  return (
    <group name="geological-sample-sites">
      {/* Ground beacon rings */}
      <group ref={beaconRingsRef}>
        {samples.map((sample) => {
          if (sample.collected) return null;
          const isNearby = activeSampleId === sample.id;
          const [sx, sy, sz] = sample.position;
          return (
            <mesh key={`ring-${sample.id}`} position={[sx, sy + 0.04, sz]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.75, 0.90, 32]} />
              <meshBasicMaterial
                color={isNearby ? '#38bdf8' : sample.color}
                transparent
                opacity={isNearby ? 0.85 : 0.45}
                side={THREE.DoubleSide}
              />
            </mesh>
          );
        })}
      </group>

      {/* Floating 3D holographic diamond markers */}
      <group ref={floatingMarkersRef}>
        {samples.map((sample) => {
          if (sample.collected) return null;
          const isNearby = activeSampleId === sample.id;
          const [sx, sy, sz] = sample.position;
          return (
            <mesh
              key={`marker-${sample.id}`}
              geometry={diamondGeo}
              position={[sx, sy + 0.72, sz]}
            >
              <meshBasicMaterial
                color={isNearby ? '#38bdf8' : sample.color}
                wireframe={!isNearby}
              />
            </mesh>
          );
        })}
      </group>

      {/* Physical Rock Specimens, Locator Beams, and Collected Science Pins */}
      {samples.map((sample) => {
        const [sx, sy, sz] = sample.position;
        const isNearby = activeSampleId === sample.id;
        const isGlass = sample.rockType === 'Volcanic Glass' || sample.rockType === 'Pyroclastic Glass';

        let geo: THREE.BufferGeometry = anorthositeGeo;
        if (sample.rockType === 'Basalt') geo = basaltGeo;
        if (sample.rockType === 'Breccia') geo = brecciaGeo;
        if (isGlass) geo = glassGeo;

        return (
          <group key={sample.id} position={[sx, sy, sz]}>
            {/* Physical Rock Specimen */}
            {!sample.collected && (
              <mesh
                geometry={geo}
                castShadow
                receiveShadow
                position={[0, 0.12, 0]}
                onClick={() => onInspectSample?.(sample)}
              >
                <meshStandardMaterial
                  color={sample.color}
                  roughness={isGlass ? 0.18 : 0.88}
                  metalness={sample.rockType === 'Basalt' ? 0.35 : 0.05}
                  flatShading={!isGlass}
                />
              </mesh>
            )}

            {/* Vertical holographic locator light beam (visible from rover) */}
            {!sample.collected && (
              <mesh position={[0, 1.6, 0]}>
                <cylinderGeometry args={[0.015, 0.045, 3.2, 8]} />
                <meshBasicMaterial
                  color={sample.color}
                  transparent
                  opacity={isNearby ? 0.5 : 0.22}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}

            {/* Collected Apollo-Style Science Core Marker Pin */}
            {sample.collected && (
              <group position={[0, 0.25, 0]}>
                <mesh>
                  <cylinderGeometry args={[0.015, 0.015, 0.5, 8]} />
                  <meshStandardMaterial color="#64748b" metalness={0.9} />
                </mesh>
                <mesh position={[0, 0.28, 0]}>
                  <sphereGeometry args={[0.05, 12, 12]} />
                  <meshStandardMaterial color="#22c55e" emissive="#16a34a" emissiveIntensity={0.8} />
                </mesh>
              </group>
            )}
          </group>
        );
      })}
    </group>
  );
}
