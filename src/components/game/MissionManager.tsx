import { useMissionManager } from '../../hooks/useMissionManager';
import type { CameraMode, InteractiveTarget, MissionState } from '../../types/game';

interface MissionManagerProps {
  cameraMode: CameraMode;
  activeTarget: InteractiveTarget | null;
  onSetCameraMode: (mode: CameraMode) => void;
  renderUI: (props: {
    missionState: MissionState;
    activeInteractionText: string | null;
    activeStationTitle: string | null;
    onOpenPause: () => void;
    onTriggerInteraction: () => void;
    onCompleteObjective: (stepIndex: number) => void;
  }) => React.ReactNode;
}

export function MissionManager({
  cameraMode,
  activeTarget,
  onSetCameraMode,
  renderUI,
}: MissionManagerProps) {
  const {
    missionState,
    activeInteractionText,
    activeStationTitle,
    triggerInteraction,
    completeObjective,
    openPauseMenu,
    modalsElement,
  } = useMissionManager(activeTarget, cameraMode, onSetCameraMode);

  return (
    <>
      {renderUI({
        missionState,
        activeInteractionText,
        activeStationTitle,
        onOpenPause: openPauseMenu,
        onTriggerInteraction: triggerInteraction,
        onCompleteObjective: completeObjective,
      })}
      {modalsElement}
    </>
  );
}
