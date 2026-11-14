import { RotateCcw, Eye, Crosshair } from 'lucide-react';
import { CAMERA_PRESETS } from '../../constants/mission';
import type { CameraTargetId } from '../../types/mission';

interface CameraControlsBarProps {
  activeTarget: CameraTargetId;
  onSelectTarget: (target: CameraTargetId) => void;
  onResetCamera: () => void;
}

export function CameraControlsBar({
  activeTarget,
  onSelectTarget,
  onResetCamera,
}: CameraControlsBarProps) {
  const presetKeys = Object.keys(CAMERA_PRESETS) as CameraTargetId[];

  return (
    <div className="nasa-camera-bar">
      <div className="nasa-camera-bar-left">
        <button
          type="button"
          className="nasa-btn-reset"
          onClick={onResetCamera}
          title="Reset camera to default orbital view"
        >
          <RotateCcw size={14} />
          <span>RESET CAMERA</span>
        </button>
      </div>

      <div className="nasa-camera-targets">
        <div className="nasa-camera-targets-label">
          <Crosshair size={13} className="nasa-icon-amber" />
          <span>FOCUS TARGET:</span>
        </div>
        <div className="nasa-target-btn-group">
          {presetKeys.map((key) => {
            const preset = CAMERA_PRESETS[key];
            const isActive = activeTarget === key;
            return (
              <button
                key={key}
                type="button"
                className={`nasa-btn-target ${isActive ? 'active' : ''}`}
                onClick={() => onSelectTarget(key)}
                title={preset.description}
              >
                {preset.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="nasa-camera-bar-right">
        <div className="nasa-controls-hint">
          <Eye size={12} />
          <span>L-Click: Rotate &bull; R-Click: Pan &bull; Wheel: Zoom</span>
        </div>
      </div>
    </div>
  );
}
