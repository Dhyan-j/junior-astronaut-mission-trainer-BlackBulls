import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Creates authentic Earth surface texture with natural oceans, continents,
 * polar ice caps, and swirling cloud systems.
 */
function createEarthTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;

  const w = 1024;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // 1. Deep Pacific / Atlantic ocean gradient
  ctx.fillStyle = '#071e3d';
  ctx.fillRect(0, 0, w, h);

  const oceanGrad = ctx.createLinearGradient(0, 0, 0, h);
  oceanGrad.addColorStop(0.0, '#0c2e59');
  oceanGrad.addColorStop(0.2, '#081e3a');
  oceanGrad.addColorStop(0.5, '#051429');
  oceanGrad.addColorStop(0.8, '#081e3a');
  oceanGrad.addColorStop(1.0, '#0c2e59');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, w, h);

  // 2. Continental Landmasses (African, Eurasian, American, Australian plates)
  // Simplified continental silhouettes with natural biome colors
  ctx.save();
  ctx.fillStyle = '#3d5a32'; // Temperate greenery

  // Africa & Europe
  ctx.beginPath();
  ctx.ellipse(w * 0.52, h * 0.52, w * 0.08, h * 0.22, 0.15, 0, Math.PI * 2);
  ctx.fill();
  // Sahara desert tan
  ctx.fillStyle = '#9b804e';
  ctx.beginPath();
  ctx.ellipse(w * 0.52, h * 0.44, w * 0.075, h * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eurasia
  ctx.fillStyle = '#3a582e';
  ctx.beginPath();
  ctx.ellipse(w * 0.65, h * 0.32, w * 0.16, h * 0.12, -0.1, 0, Math.PI * 2);
  ctx.fill();
  // Central Asian steppes
  ctx.fillStyle = '#7a683e';
  ctx.beginPath();
  ctx.ellipse(w * 0.68, h * 0.35, w * 0.10, h * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();

  // North America
  ctx.fillStyle = '#38532c';
  ctx.beginPath();
  ctx.ellipse(w * 0.22, h * 0.32, w * 0.12, h * 0.14, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // South America
  ctx.fillStyle = '#264b22'; // Amazon rainforest
  ctx.beginPath();
  ctx.ellipse(w * 0.30, h * 0.64, w * 0.065, h * 0.18, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Australia
  ctx.fillStyle = '#925c31'; // Outback red-ochre
  ctx.beginPath();
  ctx.ellipse(w * 0.82, h * 0.70, w * 0.06, h * 0.08, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Polar Ice Caps (Arctic and Antarctica)
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.04, w * 0.45, h * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.96, w * 0.48, h * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 3. Swirling atmospheric cloud formations
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';

  // Equatorial Intertropical Convergence Zone (ITCZ) cloud bands
  for (let i = 0; i < 18; i++) {
    const cx = (w * (i * 0.058 + 0.02)) % w;
    const cy = h * (0.48 + Math.sin(i * 1.8) * 0.05);
    ctx.beginPath();
    ctx.ellipse(cx, cy, w * 0.05, h * 0.022, Math.sin(i) * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Mid-latitude storm spirals & cyclonic bands
  ctx.fillStyle = 'rgba(255, 255, 255, 0.62)';
  for (let i = 0; i < 12; i++) {
    const cx = (w * (i * 0.088 + 0.04)) % w;
    const cy1 = h * (0.26 + Math.sin(i * 2.1) * 0.06);
    const cy2 = h * (0.72 + Math.cos(i * 1.7) * 0.06);
    ctx.beginPath();
    ctx.ellipse(cx, cy1, w * 0.07, h * 0.028, 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 40, cy2, w * 0.065, h * 0.026, -0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export function LunarEnvironment() {
  const earthTexture = useMemo(() => createEarthTexture(), []);
  const earthGroupRef = useRef<THREE.Group>(null);

  // Slow, realistic axial Earth rotation (~1 revolution per 24 hours, speed scaled for subtle realism)
  useFrame((_, delta) => {
    if (earthGroupRef.current) {
      earthGroupRef.current.rotation.y += delta * 0.015;
    }
  });

  // Calculate Sun position aligned with Directional Light [70, 52, 45]
  // Vector length: sqrt(70^2 + 52^2 + 45^2) = 98.13m. At distance 260m:
  const sunDistance = 260.0;
  const sunDir = new THREE.Vector3(70, 52, 45).normalize();
  const sunPos = sunDir.clone().multiplyScalar(sunDistance);

  // Real solar disc angular diameter is ~0.53 degrees (~0.00925 rad)
  // Radius = 260 * tan(0.265 deg) = 1.20m
  const sunRadius = 1.20;

  // Real Earth apparent angular diameter from Moon is ~1.9 degrees (~0.03316 rad)
  // Distance = 230m, Radius = 230 * tan(0.95 deg) = 3.81m
  // Fixed in sky at Earth-facing azimuth (Moon is tidally locked: no sunrise/sunset)
  const earthDistance = 230.0;
  const earthDir = new THREE.Vector3(-0.58, 0.36, -0.73).normalize();
  const earthPos = earthDir.clone().multiplyScalar(earthDistance);
  const earthRadius = 3.81;

  return (
    <>
      {/* Deep space black void of the lunar vacuum */}
      <color attach="background" args={['#010204']} />

      {/* Realistic unattenuated starfield (no atmospheric scintillation) */}
      <Stars
        radius={180}
        depth={60}
        count={4500}
        factor={3.8}
        saturation={0}
        fade={false}
        speed={0}
      />

      {/* Harsh, unfiltered directional solar illumination with realistic low-angle lunar shadows */}
      <directionalLight
        position={[70, 52, 45]}
        intensity={3.5}
        color="#fffbf5"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={260}
        shadow-camera-left={-75}
        shadow-camera-right={75}
        shadow-camera-top={75}
        shadow-camera-bottom={-75}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
      />

      {/* Earthshine fill light (soft cool blue-grey from Earth in lunar sky) */}
      <ambientLight intensity={0.34} color="#151d2a" />

      {/* Subtle secondary bounce from illuminated lunar regolith */}
      <hemisphereLight
        color="#ffffff"
        groundColor="#1c1f24"
        intensity={0.16}
      />

      {/* ========================================================= */}
      {/* 1. THE SUN: Small, blindingly bright solar disc (0.53°)   */}
      {/* Matches directional light vector with crisp lunar contrast */}
      {/* ========================================================= */}
      <group position={[sunPos.x, sunPos.y, sunPos.z]}>
        {/* Blinding core solar disc */}
        <mesh>
          <sphereGeometry args={[sunRadius, 32, 32]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        {/* Subtle high-vacuum solar corona edge */}
        <mesh>
          <ringGeometry args={[sunRadius, sunRadius * 1.25, 32]} />
          <meshBasicMaterial
            color="#fff8db"
            transparent
            opacity={0.35}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* ========================================================= */}
      {/* 2. THE EARTH: "The Blue Marble" in the lunar sky (~1.9°)  */}
      {/* Fixed above horizon (Moon is tidally locked to Earth)    */}
      {/* ========================================================= */}
      <group position={[earthPos.x, earthPos.y, earthPos.z]}>
        {/* Rotating Earth sphere */}
        <group ref={earthGroupRef}>
          <mesh>
            <sphereGeometry args={[earthRadius, 48, 48]} />
            <meshStandardMaterial
              map={earthTexture ?? undefined}
              roughness={0.65}
              metalness={0.05}
              emissive="#0d284a"
              emissiveIntensity={0.25}
            />
          </mesh>
        </group>

        {/* Rayleigh atmospheric limb halo (delicate blue edge) */}
        <mesh>
          <sphereGeometry args={[earthRadius * 1.02, 32, 32]} />
          <meshBasicMaterial
            color="#60a5fa"
            transparent
            opacity={0.28}
            side={THREE.BackSide}
          />
        </mesh>
      </group>
    </>
  );
}
