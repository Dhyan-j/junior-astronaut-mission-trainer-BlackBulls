import { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { LunarEnvironment } from './components/3d/LunarEnvironment';
import { LunarTerrain } from './components/3d/LunarTerrain';
import { LunarRocks } from './components/3d/LunarRocks';
import { HabitatUnit } from './components/3d/HabitatUnit';
import { BioDomeHabitat } from './components/3d/BioDomeHabitat';
import { AstronautZ2 } from './components/3d/AstronautZ2';
import { LunarRover } from './components/3d/LunarRover';
import { SolarArrays } from './components/3d/SolarArrays';
import { SceneController } from './components/3d/SceneController';
import { ModelErrorBoundary } from './components/3d/ModelErrorBoundary';
import { MissionHUD } from './components/ui/MissionHUD';
import { LoadingScreen } from './components/ui/LoadingScreen';
import type { CameraTargetId } from './types/mission';
import './App.css';

export default function App() {
  const [activeTarget, setActiveTarget] = useState<CameraTargetId>('overview');
  const [resetSignal, setResetSignal] = useState(0);

  const handleResetCamera = () => {
    setActiveTarget('overview');
    setResetSignal((prev) => prev + 1);
  };

  return (
    <div className="lunar-app-root">
      {/* 3D WebGL Canvas Viewport */}
      <Canvas
        shadows
        camera={{
          position: [24, 15, 26],
          fov: 46,
          near: 0.1,
          far: 600,
        }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
          powerPreference: 'high-performance',
        }}
      >
        <Suspense fallback={null}>
          <LunarEnvironment />
          <LunarTerrain />
          <LunarRocks />

          <ModelErrorBoundary fallbackName="Habitat Demonstration Unit">
            <HabitatUnit />
          </ModelErrorBoundary>

          <ModelErrorBoundary fallbackName="Bio-Dome Habitat">
            <BioDomeHabitat />
          </ModelErrorBoundary>

          <ModelErrorBoundary fallbackName="Astronaut Z-2">
            <AstronautZ2 />
          </ModelErrorBoundary>

          <ModelErrorBoundary fallbackName="Space Exploration Vehicle">
            <LunarRover />
          </ModelErrorBoundary>

          <SolarArrays />

          <SceneController
            activeTarget={activeTarget}
            resetSignal={resetSignal}
          />
        </Suspense>
      </Canvas>

      {/* R3F Asset Loading Screen */}
      <LoadingScreen />

      {/* NASA Mission Telemetry HUD */}
      <MissionHUD
        activeTarget={activeTarget}
        onSelectTarget={setActiveTarget}
        onResetCamera={handleResetCamera}
      />
    </div>
  );
}
