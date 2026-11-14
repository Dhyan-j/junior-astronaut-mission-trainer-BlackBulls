import { Play, RotateCcw, Video, Eye, X, HelpCircle } from 'lucide-react';
import { playClickBeep } from '../../utils/sound';
import type { CameraMode } from '../../types/game';

interface PauseProps {
  isOpen: boolean;
  cameraMode: CameraMode;
  onToggleCameraMode: () => void;
  onResume: () => void;
  onRestart: () => void;
}

export function PauseMenuModal({
  isOpen,
  cameraMode,
  onToggleCameraMode,
  onResume,
  onRestart,
}: PauseProps) {
  if (!isOpen) return null;

  return (
    <div className="nasa-modal-backdrop" onClick={onResume}>
      <div
        className="nasa-modal-card pause-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <div className="nasa-modal-header">
          <div className="nasa-modal-title-row">
            <Eye size={18} className="nasa-icon-amber" />
            <h3>MISSION SIMULATION PAUSED</h3>
          </div>
          <button
            type="button"
            className="nasa-modal-close"
            onClick={onResume}
            aria-label="Resume"
          >
            <X size={16} />
          </button>
        </div>

        <div className="nasa-modal-body">
          <div className="nasa-pause-actions">
            <button
              type="button"
              className="nasa-btn-primary large full-width"
              onClick={() => {
                playClickBeep();
                onResume();
              }}
            >
              <Play size={16} />
              <span>RESUME TRAINING MISSION</span>
            </button>

            <button
              type="button"
              className="nasa-btn-secondary full-width"
              onClick={() => {
                playClickBeep();
                onToggleCameraMode();
              }}
            >
              <Video size={16} />
              <span>
                TOGGLE CAMERA MODE:{' '}
                <strong>
                  {cameraMode === 'first_person'
                    ? '1ST PERSON HELMET'
                    : cameraMode === 'inspection'
                    ? 'SUIT INSPECTION'
                    : '3RD PERSON CHASE'}
                </strong>
              </span>
            </button>

            <button
              type="button"
              className="nasa-btn-secondary full-width"
              onClick={() => {
                playClickBeep();
                onRestart();
              }}
            >
              <RotateCcw size={16} />
              <span>RESTART MISSION 01 (RESET ALL PROGRESS)</span>
            </button>
          </div>

          <div className="nasa-keybindings-card">
            <div className="title">
              <HelpCircle size={14} className="nasa-icon-amber" /> FLIGHT CONTROLS REFERENCE
            </div>
            <div className="key-grid">
              <div className="key-row">
                <span className="key">W, A, S, D</span>
                <span className="desc">Camera-relative movement</span>
              </div>
              <div className="key-row">
                <span className="key">SHIFT</span>
                <span className="desc">Surface sprint</span>
              </div>
              <div className="key-row">
                <span className="key">SPACE</span>
                <span className="desc">Low-gravity lunar hop (1.62 m/s²)</span>
              </div>
              <div className="key-row">
                <span className="key">V</span>
                <span className="desc">Toggle 1st / 3rd person camera</span>
              </div>
              <div className="key-row">
                <span className="key">Mouse Drag</span>
                <span className="desc">Orbit camera / look around</span>
              </div>
              <div className="key-row">
                <span className="key">Mouse Wheel</span>
                <span className="desc">Camera zoom in / out</span>
              </div>
              <div className="key-row">
                <span className="key">E</span>
                <span className="desc">Interact with equipment stations</span>
              </div>
              <div className="key-row">
                <span className="key">ESC</span>
                <span className="desc">Open / close pause menu</span>
              </div>
            </div>
          </div>
        </div>

        <div className="nasa-modal-footer">
          <button
            type="button"
            className="nasa-btn-secondary"
            onClick={onResume}
          >
            BACK TO MISSION
          </button>
        </div>
      </div>
    </div>
  );
}
