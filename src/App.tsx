import { useState, Suspense, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { LunarEnvironment } from './components/3d/LunarEnvironment';
import { LunarTerrain } from './components/3d/LunarTerrain';
import { LunarRocks } from './components/3d/LunarRocks';
import { HabitatUnit } from './components/3d/HabitatUnit';
import { BioDomeHabitat } from './components/3d/BioDomeHabitat';
import { LunarRover } from './components/3d/LunarRover';
import { SolarArrays } from './components/3d/SolarArrays';
import { HabitatInteriorModule } from './components/3d/HabitatInteriorModule';
import { CollisionDebugVisualizer } from './components/3d/CollisionDebugVisualizer';
import { ModelErrorBoundary } from './components/3d/ModelErrorBoundary';
import { PlayerController } from './components/game/PlayerController';
import { CameraController } from './components/game/CameraController';
import { InteractionManager } from './components/game/InteractionManager';
import { useMissionManager } from './hooks/useMissionManager';
import { GameHUD } from './components/ui/GameHUD';
import { FirstPersonHelmetHUD } from './components/ui/FirstPersonHelmetHUD';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { AlignmentReportModal } from './components/ui/AlignmentReportModal';
import type { CameraMode, InteractiveTarget } from './types/game';
import './App.css';

export default function App() {
  // Camera & Player State
  const [cameraMode, setCameraMode] = useState<CameraMode>('third_person');
  const [playerPosition, setPlayerPosition] = useState<[number, number, number]>([-11.0, 0, -5.0]);
  const [cameraResetSignal, setCameraResetSignal] = useState(0);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Active interaction target in range
  const [activeTarget, setActiveTarget] = useState<InteractiveTarget | null>(null);

  // Toggle between First Person and Third Person ('V' shortcut)
  const handleToggleFirstThirdCamera = useCallback(() => {
    setCameraMode((prev) => (prev === 'third_person' ? 'first_person' : 'third_person'));
  }, []);

  const handleResetInspection = useCallback(() => {
    setCameraResetSignal((s) => s + 1);
  }, []);

  const {
    missionState,
    isModalActive,
    activeInteractionText,
    activeStationTitle,
    currentEnvironment,
    isTransitioning,
    playerSpawnPosition,
    teleportTrigger,
    debugCollisions,
    airlockDoorOpen,
    triggerInteraction,
    completeObjective,
    openPauseMenu,
    toggleMute,
    toggleDebugCollisions,
    handleSelectSuit,
    handleOxygenCheck,
    handlePressureCheck,
    handleCommsCheck,
    handleCoolingCheck,
    handleAirlockCycle,
    modalsElement,
  } = useMissionManager(
    activeTarget,
    cameraMode,
    setCameraMode
  );

  return (
    <div className="lunar-app-root">
      {/* 3D WebGL Canvas Viewport */}
      <Canvas
        shadows
        camera={{
          position: [-11.0, 4.2, 0.0],
          fov: 46,
          near: 0.05,
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
          {/* ========================================================= */}
          {/* ENVIRONMENT A: EXTERIOR LUNAR SURFACE                     */}
          {/* ========================================================= */}
          {currentEnvironment === 'exterior' && (
            <>
              {/* Starfield, Sun & Earth */}
              <LunarEnvironment />
              {/* Procedural Terrain & Rocks */}
              <LunarTerrain />
              <LunarRocks />

              {/* Exterior NASA Habitat Demonstration Unit */}
              <ModelErrorBoundary fallbackName="Habitat Demonstration Unit">
                <HabitatUnit />
              </ModelErrorBoundary>

              {/* Large Domed Habitat with Functional Entrance Airlock */}
              <ModelErrorBoundary fallbackName="Bio-Dome Habitat">
                <BioDomeHabitat airlockDoorOpen={airlockDoorOpen} />
              </ModelErrorBoundary>

              <ModelErrorBoundary fallbackName="Space Exploration Vehicle">
                <LunarRover />
              </ModelErrorBoundary>

              <SolarArrays />
            </>
          )}

          {/* ========================================================= */}
          {/* ENVIRONMENT B: INTERIOR PRESSURIZED HABITAT (7 ROOMS)     */}
          {/* ========================================================= */}
          {currentEnvironment === 'interior' && (
            <ModelErrorBoundary fallbackName="Habitat Interior Module">
              <HabitatInteriorModule
                selectedSuit={missionState.selectedSuit}
                plssInstalled={missionState.plssInstalled}
                oxygenChecked={missionState.oxygenChecked}
                pressureChecked={missionState.pressureChecked}
                commsVerified={missionState.commsVerified}
                coolingInspected={missionState.coolingInspected}
                airlockCycled={missionState.airlockCycled}
                airlockDoorOpen={airlockDoorOpen}
                onSelectSuit={handleSelectSuit}
                onInteractOxygen={handleOxygenCheck}
                onInteractPressure={handlePressureCheck}
                onInteractComms={handleCommsCheck}
                onInteractCooling={handleCoolingCheck}
                onInteractAirlockConsole={handleAirlockCycle}
              />
            </ModelErrorBoundary>
          )}

          {/* ========================================================= */}
          {/* PLAYABLE ASTRONAUT & UNIFIED CAMERA (SINGLE ACTIVE AVATAR)*/}
          {/* ========================================================= */}
          <PlayerController
            selectedSuit={missionState.selectedSuit}
            plssInstalled={missionState.plssInstalled}
            cameraMode={cameraMode}
            environment={currentEnvironment}
            isPaused={isModalActive}
            spawnPosition={playerSpawnPosition}
            teleportTrigger={teleportTrigger}
            onPositionChange={setPlayerPosition}
            onInteractPressed={triggerInteraction}
            onPausePressed={openPauseMenu}
            onToggleCameraMode={handleToggleFirstThirdCamera}
          />

          {/* Unified Camera Controller */}
          <CameraController
            mode={cameraMode}
            environment={currentEnvironment}
            targetPosition={playerPosition}
            isPaused={isModalActive}
            resetSignal={cameraResetSignal}
          />

          {/* Centralized Proximity & 3D Target Marker Manager */}
          <InteractionManager
            playerPosition={playerPosition}
            currentEnvironment={currentEnvironment}
            objectives={missionState.objectives}
            currentObjectiveIndex={missionState.currentObjectiveIndex}
            onActiveTargetChange={setActiveTarget}
            onObjectiveCompleted={completeObjective}
          />

          {/* Visual Collision & Interaction Debugger */}
          <CollisionDebugVisualizer
            environment={currentEnvironment}
            targets={[]}
            visible={debugCollisions}
          />
        </Suspense>
      </Canvas>

      {/* Screen Fade Transition Overlay for Smooth Environment Switching */}
      <div
        className={`nasa-screen-transition-overlay ${isTransitioning ? 'active' : ''}`}
        aria-hidden="true"
      />

      {/* First-Person Helmet Visor Heads-Up Display (Only active in First-Person) */}
      {cameraMode === 'first_person' && (
        <FirstPersonHelmetHUD missionState={missionState} />
      )}

      {/* 2D NASA Game HUD Overlay (Outside Canvas) */}
      <GameHUD
        missionState={missionState}
        activeInteractionText={activeInteractionText}
        activeStationTitle={activeStationTitle}
        cameraMode={cameraMode}
        onSetCameraMode={setCameraMode}
        onResetInspection={cameraMode === 'inspection' ? handleResetInspection : undefined}
        onToggleMute={toggleMute}
        onOpenPause={openPauseMenu}
        onOpenReport={() => setIsReportOpen(true)}
        debugCollisions={debugCollisions}
        onToggleDebugCollisions={toggleDebugCollisions}
        playerPosition={playerPosition}
        activeTarget={activeTarget}
      />

      {/* 2D Mission Modals Overlay (Outside Canvas) */}
      {modalsElement}

      {/* R3F Asset Loading Screen */}
      <LoadingScreen />

      {/* Engineering Diagnostic Inspection Modal */}
      <AlignmentReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />
    </div>
  );
}
