import { Rocket, ShieldCheck, Play, Crosshair } from 'lucide-react';
import { playClickBeep, playQuindarBeep } from '../../utils/sound';

interface BriefingProps {
  isOpen: boolean;
  onStart: () => void;
}

export function MissionBriefingModal({ isOpen, onStart }: BriefingProps) {
  if (!isOpen) return null;

  const handleStart = () => {
    playClickBeep();
    playQuindarBeep('intro');
    onStart();
  };

  return (
    <div className="nasa-modal-backdrop">
      <div className="nasa-modal-card briefing-modal-card" role="dialog">
        <div className="nasa-modal-header">
          <div className="nasa-modal-title-row">
            <Rocket size={18} className="nasa-icon-amber" />
            <h3>MISSION 01: THE FIRST EVA — BRIEFING</h3>
          </div>
          <span className="nasa-status-badge warn">TRAINING FLIGHT ASSIGNMENT</span>
        </div>

        <div className="nasa-modal-body">
          <div className="nasa-briefing-hero">
            <h4>WELCOME TO THE LUNAR SURFACE TRAINING GROUNDS</h4>
            <p>
              Trainee, you have arrived at the Artemis Lunar Training Outpost in Mare
              Tranquillitatis. Before any astronaut steps onto the lunar regolith for surface
              traversal, they must qualify in full spacesuit preparation, life support integration,
              and enterable habitat airlock procedures.
            </p>
          </div>

          <div className="nasa-briefing-grid">
            <div className="nasa-briefing-card">
              <span className="title">
                <Crosshair size={14} className="nasa-icon-amber" /> PRIMARY OBJECTIVES (12 STEPS)
              </span>
              <ol className="nasa-briefing-steps">
                <li>Start mission briefing</li>
                <li>Enter suit preparation room</li>
                <li>Select spacesuit (Z-2, Mark III, or EMU)</li>
                <li>Inspect suit components (helmet, visor, gloves)</li>
                <li>Install PLSS life support backpack</li>
                <li>Perform oxygen manifold check (5.8 MPa)</li>
                <li>Perform pressure delta-P decay test (29.6 kPa)</li>
                <li>Test UHF & S-band communication loops</li>
                <li>Inspect cooling system (LCVG loop)</li>
                <li>Enter habitat airlock chamber</li>
                <li>Complete simulated airlock depressurization</li>
                <li>Exit onto lunar surface for final qualification</li>
              </ol>
            </div>

            <div className="nasa-briefing-card">
              <span className="title">
                <ShieldCheck size={14} className="nasa-icon-cyan" /> FLIGHT CONTROLS & RULES
              </span>
              <ul className="nasa-briefing-rules">
                <li>
                  <strong>W, A, S, D:</strong> Camera-relative astronaut movement
                </li>
                <li>
                  <strong>SHIFT:</strong> Run across lunar surface
                </li>
                <li>
                  <strong>SPACE:</strong> Low-gravity lunar hop (1.62 m/s²)
                </li>
                <li>
                  <strong>Mouse Drag:</strong> Orbit camera / look around
                </li>
                <li>
                  <strong>Mouse Wheel:</strong> Zoom camera in and out
                </li>
                <li>
                  <strong>V:</strong> Toggle between 1st Person & 3rd Person camera
                </li>
                <li>
                  <strong>E:</strong> Interact with highlighted station when in range
                </li>
                <li>
                  <strong>ESC:</strong> Open pause menu & mission diagnostics
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="nasa-modal-footer">
          <div className="nasa-footer-meta">
            <span>NASA Astronaut Office &bull; Houston Flight Operations</span>
          </div>
          <button type="button" className="nasa-btn-primary large" onClick={handleStart}>
            <Play size={16} />
            <span>START MISSION 01</span>
          </button>
        </div>
      </div>
    </div>
  );
}
