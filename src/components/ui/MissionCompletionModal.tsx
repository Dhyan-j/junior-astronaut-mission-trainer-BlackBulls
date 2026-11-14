import { Award, CheckCircle2, RotateCcw, Compass } from 'lucide-react';
import { playClickBeep } from '../../utils/sound';
import { SPACESUITS } from '../../constants/mission';
import type { SpacesuitId } from '../../types/game';

interface CompletionProps {
  isOpen: boolean;
  selectedSuit: SpacesuitId;
  onRestart: () => void;
  onFreeRoam: () => void;
}

export function MissionCompletionModal({
  isOpen,
  selectedSuit,
  onRestart,
  onFreeRoam,
}: CompletionProps) {
  if (!isOpen) return null;

  const suitMeta = SPACESUITS[selectedSuit];

  return (
    <div className="nasa-modal-backdrop">
      <div className="nasa-modal-card completion-modal-card" role="dialog">
        <div className="nasa-modal-header">
          <div className="nasa-modal-title-row">
            <Award size={20} className="nasa-icon-amber" />
            <h3>MISSION ACCOMPLISHED — CERTIFIED FOR LUNAR EVA</h3>
          </div>
          <span className="nasa-status-badge success">FLIGHT QUALIFIED</span>
        </div>

        <div className="nasa-modal-body">
          <div className="nasa-completion-banner">
            <div className="nasa-cert-badge">
              <CheckCircle2 size={36} className="nasa-icon-green" />
              <div>
                <h4>EVA FLIGHT READINESS LEVEL 1 GRANTED</h4>
                <p>
                  Junior Astronaut Trainee has successfully completed all 10 pre-EVA spacesuit,
                  life support, and airlock ingress qualification procedures.
                </p>
              </div>
            </div>
          </div>

          <div className="nasa-debrief-grid">
            <div className="nasa-debrief-card">
              <span className="label">QUALIFIED SPACESUIT</span>
              <span className="val">{suitMeta.name}</span>
              <span className="sub">{suitMeta.designation}</span>
            </div>

            <div className="nasa-debrief-card">
              <span className="label">PLSS LIFE SUPPORT STATUS</span>
              <span className="val green">MOUNTED & NOMINAL</span>
              <span className="sub">Dual O2 COPVs Pressurized</span>
            </div>

            <div className="nasa-debrief-card">
              <span className="label">SUIT OPERATING PRESSURE</span>
              <span className="val cyan">29.6 kPa (4.3 psi)</span>
              <span className="sub">Zero Delta-P Decay Verified</span>
            </div>

            <div className="nasa-debrief-card">
              <span className="label">TELEMETRY & COMMS</span>
              <span className="val blue">UHF / S-BAND LOCKED</span>
              <span className="sub">Base Net & Gateway Synced</span>
            </div>
          </div>

          <div className="nasa-alert-box info">
            <strong>NEXT MILESTONE READY:</strong> You may now explore the lunar terrain, inspect
            the Space Exploration Vehicle (MMSEV) rover, or restart the training checklist.
          </div>
        </div>

        <div className="nasa-modal-footer">
          <button
            type="button"
            className="nasa-btn-secondary"
            onClick={() => {
              playClickBeep();
              onRestart();
            }}
          >
            <RotateCcw size={14} />
            <span>RESTART TRAINING MISSION</span>
          </button>

          <button
            type="button"
            className="nasa-btn-primary large"
            onClick={() => {
              playClickBeep();
              onFreeRoam();
            }}
          >
            <Compass size={14} />
            <span>CONTINUE LUNAR SURFACE EXPLORATION</span>
          </button>
        </div>
      </div>
    </div>
  );
}

