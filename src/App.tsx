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
import { LunarBaseInterior } from './components/3d/LunarBaseInterior';
import { CollisionDebugVisualizer } from './components/3d/CollisionDebugVisualizer';
import { ModelErrorBoundary } from './components/3d/ModelErrorBoundary';
import { GeologicalSamples } from './components/3d/GeologicalSamples';
import { PlayerController } from './components/game/PlayerController';
import { CameraController } from './components/game/CameraController';
import { InteractionManager } from './components/game/InteractionManager';
import { useMissionManager } from './hooks/useMissionManager';
import { GameHUD } from './components/ui/GameHUD';
import { FirstPersonHelmetHUD } from './components/ui/FirstPersonHelmetHUD';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { AlignmentReportModal } from './components/ui/AlignmentReportModal';
import { RoverDashboardHUD } from './components/ui/RoverDashboardHUD';
import { SampleInspectionModal } from './components/ui/SampleInspectionModal';
import { SpecimenNotificationBadge } from './components/ui/SpecimenNotificationBadge';
import { LunarSampleTrackerHUD } from './components/ui/LunarSampleTrackerHUD';
import { INITIAL_GEOLOGICAL_SAMPLES } from './constants/samples';
import type { CameraMode, InteractiveTarget, RoverTelemetry, GeologicalSample } from './types/game';
import './App.css';

export default function App() {
  // Camera & Player State
  const [cameraMode, setCameraMode] = useState<CameraMode>('third_person');
  const [playerPosition, setPlayerPosition] = useState<[number, number, number]>([-11.0, 0, -5.0]);
  const [cameraResetSignal, setCameraResetSignal] = useState(0);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Active interaction target in range
  const [activeTarget, setActiveTarget] = useState<InteractiveTarget | null>(null);

  // Lunar Rover Driving State
  const [isDrivingRover, setIsDrivingRover] = useState(false);
  const [roverPosition, setRoverPosition] = useState<[number, number, number]>([2.5, 0, 4.0]);
  const [disembarkPosition, setDisembarkPosition] = useState<[number, number, number] | null>(null);
  const [disembarkTrigger, setDisembarkTrigger] = useState(0);
  const [roverTelemetry, setRoverTelemetry] = useState<RoverTelemetry>({
    speed: 0,
    speedKmh: 0,
    battery: 100,
    totalDistance: 0,
    heading: 295,
    isBraking: false,
    isReversing: false,
    driveMode: 'PARK',
  });

  // Geological Sample Collection State (persisted in localStorage)
  const [geologicalSamples, setGeologicalSamples] = useState<GeologicalSample[]>(() => {
    try {
      const saved = localStorage.getItem('nasa_lunar_samples_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return INITIAL_GEOLOGICAL_SAMPLES.map((initS) => {
            const found = parsed.find((p: { id: string; collected?: boolean }) => p.id === initS.id);
            return found ? { ...initS, collected: !!found.collected } : initS;
          });
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_GEOLOGICAL_SAMPLES;
  });

  const [inspectingSample, setInspectingSample] = useState<GeologicalSample | null>(null);
  const [justCollectedSampleName, setJustCollectedSampleName] = useState<string | null>(null);

  // Toggle between First Person and Third Person ('V' shortcut)
  const handleToggleFirstThirdCamera = useCallback(() => {
    setCameraMode((prev) => (prev === 'third_person' ? 'first_person' : 'third_person'));
  }, []);

  const handleResetInspection = useCallback(() => {
    setCameraResetSignal((s) => s + 1);
  }, []);

  const handleCollectSample = useCallback((sampleId: string) => {
    setGeologicalSamples((prev) => {
      const existing = prev.find((s) => s.id === sampleId);
      if (existing?.collected) {
        return prev; // Prevent duplicate collection
      }
      const next = prev.map((s) => (s.id === sampleId ? { ...s, collected: true } : s));
      try {
        localStorage.setItem('nasa_lunar_samples_v1', JSON.stringify(next));
      } catch {
        // ignore
      }
      if (existing) {
        setJustCollectedSampleName(existing.name);
        setTimeout(() => {
          setJustCollectedSampleName((cur) => (cur === existing.name ? null : cur));
        }, 4000);
      }
      return next;
    });
    setInspectingSample(null);
  }, []);

  const handleRoverPositionChange = useCallback((pos: [number, number, number]) => {
    setRoverPosition(pos);
    if (isDrivingRover) {
      setPlayerPosition(pos);
    }
  }, [isDrivingRover]);

  const handleEnterRover = useCallback(() => {
    setIsDrivingRover(true);
    setPlayerPosition(roverPosition);
  }, [roverPosition]);

  const handleExitRover = useCallback((exitPos: [number, number, number]) => {
    setIsDrivingRover(false);
    setDisembarkPosition(exitPos);
    setPlayerPosition(exitPos);
    setDisembarkTrigger((t) => t + 1);
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

  // Distance to Rover and Samples
  const distToRover = Math.hypot(playerPosition[0] - roverPosition[0], playerPosition[2] - roverPosition[2]);
  const isNearRover = currentEnvironment === 'exterior' && !isDrivingRover && distToRover < 3.8;

  // Proximity to Geological Samples (active on foot or driving rover)
  const evalPosition = isDrivingRover ? roverPosition : playerPosition;
  const nearbySample =
    currentEnvironment === 'exterior'
      ? geologicalSamples.find(
          (s) =>
            Math.hypot(evalPosition[0] - s.position[0], evalPosition[2] - s.position[2]) < 4.2
        ) || null
      : null;

  const distToSample = nearbySample
    ? Math.hypot(playerPosition[0] - nearbySample.position[0], playerPosition[2] - nearbySample.position[2])
    : Infinity;

  // Prioritize sample inspection when player is closer to sample than to rover (or right by the specimen)
  const sampleHasPriority = nearbySample && (!isNearRover || distToSample <= distToRover);

  // Intercept triggerInteraction for rover and samples
  const handleInteract = useCallback(() => {
    if (currentEnvironment === 'exterior' && !isDrivingRover) {
      if (sampleHasPriority && nearbySample) {
        setInspectingSample(nearbySample);
        return;
      }
      if (isNearRover) {
        handleEnterRover();
        return;
      }
    }
    triggerInteraction();
  }, [currentEnvironment, isDrivingRover, sampleHasPriority, nearbySample, isNearRover, handleEnterRover, triggerInteraction]);

  // Priority interaction prompt text
  let effectiveInteractionText = activeInteractionText;
  let effectiveStationTitle = activeStationTitle;
  if (currentEnvironment === 'exterior' && !isDrivingRover) {
    if (sampleHasPriority && nearbySample) {
      effectiveInteractionText = nearbySample.collected
        ? `PRESS [E] TO VIEW ${nearbySample.name.toUpperCase()} (CATALOGED)`
        : `PRESS [E] TO INSPECT ${nearbySample.name.toUpperCase()}`;
      effectiveStationTitle = `Geological Specimen Site: ${nearbySample.rockType}`;
    } else if (isNearRover) {
      effectiveInteractionText = 'PRESS [E] TO ENTER LUNAR ROVER';
      effectiveStationTitle = 'Space Exploration Vehicle (MMSEV)';
    }
  }

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
                <LunarRover
                  isDriving={isDrivingRover}
                  isPaused={isModalActive || inspectingSample !== null}
                  onEnterRover={handleEnterRover}
                  onExitRover={handleExitRover}
                  onRoverPositionChange={handleRoverPositionChange}
                  onTelemetryChange={setRoverTelemetry}
                />
              </ModelErrorBoundary>

              {/* Collectible Lunar Geological Samples with Holographic Science Beacons */}
              <GeologicalSamples
                samples={geologicalSamples}
                activeSampleId={nearbySample?.id}
                onInspectSample={setInspectingSample}
              />

              <SolarArrays />
            </>
          )}

          {/* ========================================================= */}
          {/* ENVIRONMENT B: INTERIOR PRESSURIZED BASE (28m x 41m GLB)  */}
          {/* ========================================================= */}
          {currentEnvironment === 'interior' && (
            <ModelErrorBoundary fallbackName="Lunar Base Interior">
              <LunarBaseInterior
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
            isPaused={isModalActive || inspectingSample !== null}
            isDrivingRover={isDrivingRover}
            spawnPosition={disembarkTrigger > 0 && disembarkPosition ? disembarkPosition : playerSpawnPosition}
            teleportTrigger={teleportTrigger + disembarkTrigger}
            onPositionChange={setPlayerPosition}
            onInteractPressed={handleInteract}
            onPausePressed={openPauseMenu}
            onToggleCameraMode={handleToggleFirstThirdCamera}
          />

          {/* Unified Camera Controller */}
          <CameraController
            mode={cameraMode}
            environment={currentEnvironment}
            targetPosition={playerPosition}
            isPaused={isModalActive || inspectingSample !== null}
            isDrivingRover={isDrivingRover}
            teleportTrigger={teleportTrigger + disembarkTrigger}
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
        activeInteractionText={effectiveInteractionText}
        activeStationTitle={effectiveStationTitle}
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

      {/* NASA Lunar Exploration Rover Driving Dashboard & Surface Scanner */}
      {isDrivingRover && (
        <RoverDashboardHUD
          telemetry={roverTelemetry}
          roverPosition={roverPosition}
          samples={geologicalSamples}
          onExitRover={() => handleExitRover(playerPosition)}
        />
      )}

      {/* Compact Mission Geological Exploration Tracker (Exterior Mode) */}
      {currentEnvironment === 'exterior' && (
        <LunarSampleTrackerHUD
          samples={geologicalSamples}
          playerPosition={isDrivingRover ? roverPosition : playerPosition}
          justCollectedSampleName={justCollectedSampleName}
        />
      )}

      {/* Compact Geological Specimen Notification Badge (Lower-Right) */}
      {nearbySample && !inspectingSample && (
        <SpecimenNotificationBadge
          sample={nearbySample}
          onInspect={setInspectingSample}
        />
      )}

      {/* Geological Rock Specimen Inspection Modal */}
      {inspectingSample && (
        <SampleInspectionModal
          sample={inspectingSample}
          onCollect={handleCollectSample}
          onClose={() => setInspectingSample(null)}
        />
      )}

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
