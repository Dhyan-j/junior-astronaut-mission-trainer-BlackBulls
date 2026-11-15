import { useState, useCallback, useEffect, useRef } from 'react';
import { MISSION_01_OBJECTIVES } from '../constants/mission';
import { SuitSelectionModal } from '../components/ui/SuitSelectionModal';
import { PLSSInstallationModal } from '../components/ui/PLSSInstallationModal';
import { ComponentInspectionModal, type InspectionMode } from '../components/ui/ComponentInspectionModal';
import { AirlockCyclingModal } from '../components/ui/AirlockCyclingModal';
import { MissionBriefingModal } from '../components/ui/MissionBriefingModal';
import { MissionCompletionModal } from '../components/ui/MissionCompletionModal';
import { PauseMenuModal } from '../components/ui/PauseMenuModal';
import {
  playSuccessChime,
  playQuindarBeep,
  playSuitEquippedSound,
  playEquipmentLatchSound,
  playPneumaticDoorSound,
  playAirlockAlarm,
  playAirlockHiss,
  startHabitatAmbientHum,
  stopHabitatAmbientHum,
  setMuted,
  getMuted,
} from '../utils/sound';
import type {
  CameraMode,
  GameEnvironment,
  InteractiveTarget,
  MissionObjective,
  MissionState,
  SpacesuitId,
} from '../types/game';

const STORAGE_KEY = 'junior_astronaut_mission_state_v4';

export interface UseMissionManagerReturn {
  missionState: MissionState;
  isModalActive: boolean;
  activeInteractionText: string | null;
  activeStationTitle: string | null;
  currentEnvironment: GameEnvironment;
  isTransitioning: boolean;
  playerSpawnPosition: [number, number, number];
  teleportTrigger: number;
  debugCollisions: boolean;
  airlockDoorOpen: boolean;
  innerDoorOpen: boolean;
  triggerInteraction: () => void;
  completeObjective: (stepIndex: number) => void;
  openPauseMenu: () => void;
  toggleMute: () => void;
  toggleDebugCollisions: () => void;
  transitionToEnvironment: (nextEnv: GameEnvironment) => void;
  handleSelectSuit: (id: SpacesuitId) => void;
  handleOxygenCheck: () => void;
  handlePressureCheck: () => void;
  handleCommsCheck: () => void;
  handleCoolingCheck: () => void;
  handleAirlockCycle: () => void;
  modalsElement: React.ReactNode;
}

export function useMissionManager(
  activeTarget: InteractiveTarget | null,
  cameraMode: CameraMode,
  onSetCameraMode: (mode: CameraMode) => void
): UseMissionManagerReturn {
  // Load initial state from LocalStorage if available
  const [objectives, setObjectives] = useState<MissionObjective[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          Array.isArray(parsed.objectives) &&
          parsed.objectives.length === MISSION_01_OBJECTIVES.length &&
          parsed.objectives[0]?.id === MISSION_01_OBJECTIVES[0]?.id
        ) {
          return parsed.objectives;
        }
      }
    } catch {
      // Ignore JSON parse errors
    }
    return MISSION_01_OBJECTIVES;
  });

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.currentStepIndex === 'number') {
          return Math.min(parsed.currentStepIndex, MISSION_01_OBJECTIVES.length - 1);
        }
      }
    } catch {
      // Ignore
    }
    return 0; // Step 1 is approach habitat
  });

  const [selectedSuit, setSelectedSuit] = useState<SpacesuitId>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.selectedSuit) return parsed.selectedSuit;
      }
    } catch {
      // Ignore
    }
    return 'z2';
  });

  // Environment & Transition State
  const [currentEnvironment, setCurrentEnvironment] = useState<GameEnvironment>('exterior');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [playerSpawnPosition, setPlayerSpawnPosition] = useState<[number, number, number]>([-11.0, 0, -5.0]);
  const [teleportTrigger, setTeleportTrigger] = useState(0);
  const [debugCollisions, setDebugCollisions] = useState(false);

  // Equipment & Diagnostic States
  const [plssInstalled, setPlssInstalled] = useState(false);
  const [oxygenChecked, setOxygenChecked] = useState(false);
  const [pressureChecked, setPressureChecked] = useState(false);
  const [commsVerified, setCommsVerified] = useState(false);
  const [coolingInspected, setCoolingInspected] = useState(false);
  const [helmetInspected, setHelmetInspected] = useState(false);
  const [glovesBootsInspected, setGlovesBootsInspected] = useState(false);
  const [airlockEntered, setAirlockEntered] = useState(false);
  const [airlockCycled, setAirlockCycled] = useState(false);
  const [surfaceExited, setSurfaceExited] = useState(false);
  const [missionCompleted, setMissionCompleted] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(getMuted());

  // Habitat door states
  const [airlockDoorOpen, setAirlockDoorOpen] = useState(false);
  const [innerDoorOpen, setInnerDoorOpen] = useState(false);

  // Modal display states
  const [isBriefingOpen, setIsBriefingOpen] = useState(true);
  const [isPauseOpen, setIsPauseOpen] = useState(false);
  const [isSuitModalOpen, setIsSuitModalOpen] = useState(false);
  const [isPLSSModalOpen, setIsPLSSModalOpen] = useState(false);
  const [plssModalMode] = useState<'install' | 'cooling'>('install');
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [inspectionMode, setInspectionMode] = useState<InspectionMode>('helmet');
  const [isAirlockModalOpen, setIsAirlockModalOpen] = useState(false);
  const [isCompletionOpen, setIsCompletionOpen] = useState(false);

  // Save progress to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          currentStepIndex,
          selectedSuit,
          objectives,
        })
      );
    } catch {
      // Ignore storage errors
    }
  }, [currentStepIndex, selectedSuit, objectives]);

  const toggleMute = useCallback(() => {
    setIsAudioMuted((prev) => {
      const next = !prev;
      setMuted(next);
      return next;
    });
  }, []);

  const toggleDebugCollisions = useCallback(() => {
    setDebugCollisions((prev) => !prev);
  }, []);

  // Complete an objective strictly by step index
  const completeObjective = useCallback((stepIndex: number) => {
    setObjectives((prev) => {
      const updated = [...prev];
      if (updated[stepIndex] && !updated[stepIndex].completed) {
        updated[stepIndex] = { ...updated[stepIndex], completed: true };
        playSuccessChime();
      }
      return updated;
    });

    setCurrentStepIndex((prev) => Math.max(prev, Math.min(stepIndex + 1, MISSION_01_OBJECTIVES.length - 1)));
  }, []);

  // Smooth screen fade transition manager
  const transitionToEnvironment = useCallback((nextEnv: GameEnvironment) => {
    console.log('[useMissionManager] transitionToEnvironment called with:', nextEnv);
    setIsTransitioning(true);
    playPneumaticDoorSound();

    // Teleport while screen is completely black (at 280ms)
    setTimeout(() => {
      console.log('[useMissionManager] executing teleport inside timeout to:', nextEnv);
      setCurrentEnvironment(nextEnv);
      if (nextEnv === 'interior') {
        // Spawn inside dedicated EVA airlock module facing North into base
        setPlayerSpawnPosition([0, 1.14, 21.0]);
        startHabitatAmbientHum();
      } else {
        // Spawn outside on the Large Domed Habitat entrance ramp
        setPlayerSpawnPosition([-13.5, 0.04, -11.5]);
        stopHabitatAmbientHum();
      }
      setTeleportTrigger((s) => s + 1);

      // Fade back in
      setTimeout(() => {
        setIsTransitioning(false);
      }, 350);
    }, 280);
  }, []);

  // Interaction debounce guard & active target ref to prevent stale closure dispatch
  const isInteractingRef = useRef(false);
  const activeTargetRef = useRef<InteractiveTarget | null>(activeTarget);
  useEffect(() => {
    activeTargetRef.current = activeTarget;
  }, [activeTarget]);

  // Handle Suit Selection (Step 4, index: 3)
  const handleSelectSuit = useCallback((id: SpacesuitId) => {
    setSelectedSuit(id);
    playSuitEquippedSound();
    completeObjective(3);
  }, [completeObjective]);

  // Handle Inspection completions (Step 5, index: 4)
  const handleInspectionComplete = useCallback((mode: InspectionMode) => {
    switch (mode) {
      case 'helmet':
      case 'gloves_boots':
        setHelmetInspected(true);
        setGlovesBootsInspected(true);
        playEquipmentLatchSound();
        completeObjective(4);
        break;
      case 'oxygen':
        setOxygenChecked(true);
        playQuindarBeep('intro');
        completeObjective(6);
        break;
      case 'pressure':
        setPressureChecked(true);
        playSuccessChime();
        completeObjective(7);
        break;
      case 'comms':
        setCommsVerified(true);
        playQuindarBeep('intro');
        completeObjective(8);
        break;
    }
  }, [completeObjective]);

  // Handle PLSS installation (Step 6, index: 5)
  const handlePLSSInstallComplete = useCallback(() => {
    setPlssInstalled(true);
    playEquipmentLatchSound();
    completeObjective(5);
  }, [completeObjective]);

  // Handle Cooling LCVG completion (Step 10, index: 9)
  const handleCoolingComplete = useCallback(() => {
    setCoolingInspected(true);
    playEquipmentLatchSound();
    completeObjective(9);
  }, [completeObjective]);

  // Handle direct 3D clicks or interactions
  const handleOxygenCheck = useCallback(() => {
    setOxygenChecked(true);
    playQuindarBeep('intro');
    completeObjective(6);
  }, [completeObjective]);

  const handlePressureCheck = useCallback(() => {
    setPressureChecked(true);
    playSuccessChime();
    completeObjective(7);
  }, [completeObjective]);

  const handleCommsCheck = useCallback(() => {
    setCommsVerified(true);
    playQuindarBeep('intro');
    completeObjective(8);
  }, [completeObjective]);

  const handleCoolingCheck = useCallback(() => {
    setCoolingInspected(true);
    playEquipmentLatchSound();
    completeObjective(9);
  }, [completeObjective]);

  // Handle Airlock cycle completion (Step 12, index: 11)
  const handleAirlockCycle = useCallback(() => {
    playAirlockAlarm();
    playAirlockHiss();
    setAirlockCycled(true);
    setAirlockDoorOpen(true);
    completeObjective(11);
    setIsAirlockModalOpen(false);
  }, [completeObjective]);

  // Centralized interaction dispatcher (E or Enter)
  const triggerInteraction = useCallback(() => {
    const currentTarget = activeTargetRef.current;
    console.log('[useMissionManager] triggerInteraction called! currentTarget is:', currentTarget?.id, 'stationType:', currentTarget?.stationType);
    if (!currentTarget || isInteractingRef.current) return;

    isInteractingRef.current = true;
    setTimeout(() => {
      isInteractingRef.current = false;
    }, 400);

    switch (currentTarget.stationType) {
      case 'habitat_airlock_entry':
        // Approach & Enter habitat
        completeObjective(0); // Step 1: approach
        completeObjective(1); // Step 2: enter habitat
        setAirlockDoorOpen(true);
        transitionToEnvironment('interior');
        break;

      case 'habitat_prep_bench':
        completeObjective(2); // Step 3: prep astronaut
        playSuccessChime();
        break;

      case 'suit_selection':
        setIsSuitModalOpen(true);
        break;

      case 'helmet_inspection':
      case 'gloves_boots_inspection':
        setInspectionMode('helmet');
        setIsInspectionModalOpen(true);
        break;

      case 'plss_station':
        handlePLSSInstallComplete();
        break;

      case 'oxygen_check':
        handleOxygenCheck();
        break;

      case 'pressure_check':
        handlePressureCheck();
        break;

      case 'comms_check':
        handleCommsCheck();
        break;

      case 'cooling_inspection':
        handleCoolingCheck();
        break;

      case 'airlock_chamber':
        completeObjective(10); // Step 11: enter airlock
        setAirlockEntered(true);
        setInnerDoorOpen(false);
        playPneumaticDoorSound();
        break;

      case 'airlock_cycle_console':
        setIsAirlockModalOpen(true);
        break;

      case 'habitat_exit':
        // Step 13: Egress onto lunar surface
        if (currentStepIndex >= 11) {
          completeObjective(12); // Step 13
          setSurfaceExited(true);
          setMissionCompleted(true);
          transitionToEnvironment('exterior');
          setTimeout(() => {
            setIsCompletionOpen(true);
            playQuindarBeep('outro');
          }, 1200);
        }
        break;
    }
  }, [
    currentStepIndex,
    completeObjective,
    transitionToEnvironment,
    handlePLSSInstallComplete,
    handleOxygenCheck,
    handlePressureCheck,
    handleCommsCheck,
    handleCoolingCheck,
  ]);

  // Restart mission progression
  const handleRestartMission = useCallback(() => {
    const fresh = MISSION_01_OBJECTIVES.map((o) => ({
      ...o,
      completed: false,
    }));
    setObjectives(fresh);
    setCurrentStepIndex(0);
    setCurrentEnvironment('exterior');
    setPlayerSpawnPosition([-3.5, 0, 3.5]);
    setPlayerSpawnPosition([-11.0, 0, -5.0]);
    setTeleportTrigger((s) => s + 1);
    setPlssInstalled(false);
    setOxygenChecked(false);
    setPressureChecked(false);
    setCommsVerified(false);
    setCoolingInspected(false);
    setHelmetInspected(false);
    setGlovesBootsInspected(false);
    setAirlockEntered(false);
    setAirlockCycled(false);
    setSurfaceExited(false);
    setMissionCompleted(false);
    setAirlockDoorOpen(false);
    setInnerDoorOpen(false);
    setIsPauseOpen(false);
    setIsCompletionOpen(false);
    stopHabitatAmbientHum();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  const isModalActive =
    isBriefingOpen ||
    isPauseOpen ||
    isSuitModalOpen ||
    isPLSSModalOpen ||
    isInspectionModalOpen ||
    isAirlockModalOpen ||
    isCompletionOpen ||
    isTransitioning;

  const missionState: MissionState = {
    currentObjectiveIndex: currentStepIndex,
    objectives,
    selectedSuit,
    plssInstalled,
    oxygenChecked,
    pressureChecked,
    commsVerified,
    coolingInspected,
    helmetInspected,
    glovesBootsInspected,
    airlockEntered,
    airlockCycled,
    surfaceExited,
    missionCompleted,
    simulatedOxygenPercent: oxygenChecked ? 100 : 0,
    simulatedPressureKPa: pressureChecked ? 29.6 : 0,
    simulatedCoolingLoopTemp: coolingInspected ? 14.2 : 21.0,
    simulatedBatteryHours: 8.5,
    isMuted: isAudioMuted,
    currentEnvironment,
  };

  const activeInteractionText = isModalActive ? null : activeTarget?.actionText || null;
  const activeStationTitle = isModalActive ? null : activeTarget?.title || null;

  const modalsElement = (
    <>
      <MissionBriefingModal
        isOpen={isBriefingOpen}
        onStart={() => {
          setIsBriefingOpen(false);
          playQuindarBeep('intro');
        }}
      />

      <PauseMenuModal
        isOpen={isPauseOpen}
        cameraMode={cameraMode}
        onToggleCameraMode={() =>
          onSetCameraMode(cameraMode === 'third_person' ? 'first_person' : 'third_person')
        }
        onResume={() => setIsPauseOpen(false)}
        onRestart={handleRestartMission}
      />

      <SuitSelectionModal
        isOpen={isSuitModalOpen}
        currentSuit={selectedSuit}
        onSelectSuit={(suitId) => {
          handleSelectSuit(suitId);
          setIsSuitModalOpen(false);
        }}
        onClose={() => setIsSuitModalOpen(false)}
      />

      <PLSSInstallationModal
        isOpen={isPLSSModalOpen}
        mode={plssModalMode}
        isInstalled={plssInstalled}
        onInstallComplete={() => {
          handlePLSSInstallComplete();
          setIsPLSSModalOpen(false);
        }}
        onCoolingComplete={() => {
          handleCoolingComplete();
          setIsPLSSModalOpen(false);
        }}
        onClose={() => setIsPLSSModalOpen(false)}
      />

      <ComponentInspectionModal
        isOpen={isInspectionModalOpen}
        mode={inspectionMode}
        onComplete={(mode) => {
          handleInspectionComplete(mode);
          setIsInspectionModalOpen(false);
        }}
        onClose={() => setIsInspectionModalOpen(false)}
      />

      <AirlockCyclingModal
        isOpen={isAirlockModalOpen}
        canEnter={currentStepIndex >= 10}
        onCycleComplete={handleAirlockCycle}
        onClose={() => setIsAirlockModalOpen(false)}
      />

      <MissionCompletionModal
        isOpen={isCompletionOpen}
        selectedSuit={selectedSuit}
        onRestart={handleRestartMission}
        onFreeRoam={() => setIsCompletionOpen(false)}
      />
    </>
  );

  return {
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
    innerDoorOpen,
    triggerInteraction,
    completeObjective,
    openPauseMenu: () => setIsPauseOpen(true),
    toggleMute,
    toggleDebugCollisions,
    transitionToEnvironment,
    handleSelectSuit,
    handleOxygenCheck,
    handlePressureCheck,
    handleCommsCheck,
    handleCoolingCheck,
    handleAirlockCycle,
    modalsElement,
  };
}
