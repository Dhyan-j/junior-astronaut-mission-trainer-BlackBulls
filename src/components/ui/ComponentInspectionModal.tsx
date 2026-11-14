import { useState } from 'react';
import {
  Eye,
  CheckCircle2,
  Radio,
  Wind,
  Gauge,
  Sparkles,
  X,
} from 'lucide-react';
import { playClickBeep, playSuccessChime, playQuindarBeep } from '../../utils/sound';

export type InspectionMode =
  | 'helmet'
  | 'gloves_boots'
  | 'oxygen'
  | 'pressure'
  | 'comms';

interface ComponentInspectionModalProps {
  isOpen: boolean;
  mode: InspectionMode;
  onComplete: (mode: InspectionMode) => void;
  onClose: () => void;
}

export function ComponentInspectionModal({
  isOpen,
  mode,
  onComplete,
  onClose,
}: ComponentInspectionModalProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  if (!isOpen) return null;

  const handleAction = () => {
    playClickBeep();
    setIsVerifying(true);

    if (mode === 'comms') {
      playQuindarBeep('intro');
    }

    setTimeout(() => {
      setIsVerifying(false);
      setVerified(true);
      playSuccessChime();
      if (mode === 'comms') {
        playQuindarBeep('outro');
      }
      setTimeout(() => {
        onComplete(mode);
        onClose();
        setVerified(false);
      }, 500);
    }, 800);
  };

  return (
    <div className="nasa-modal-backdrop" onClick={onClose}>
      <div
        className="nasa-modal-card inspection-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <div className="nasa-modal-header">
          <div className="nasa-modal-title-row">
            {mode === 'helmet' && <Eye size={18} className="nasa-icon-amber" />}
            {mode === 'gloves_boots' && <Sparkles size={18} className="nasa-icon-amber" />}
            {mode === 'oxygen' && <Wind size={18} className="nasa-icon-cyan" />}
            {mode === 'pressure' && <Gauge size={18} className="nasa-icon-amber" />}
            {mode === 'comms' && <Radio size={18} className="nasa-icon-green" />}

            <h3>
              {mode === 'helmet' && 'HELMET & SOLAR VISOR EXAMINATION'}
              {mode === 'gloves_boots' && 'EVA GLOVE & LUNAR OVERBOOT INSPECTION'}
              {mode === 'oxygen' && 'PRIMARY & EMERGENCY O2 MANIFOLD TEST'}
              {mode === 'pressure' && 'SUIT PRESSURE REGULATION & LEAK DECAY'}
              {mode === 'comms' && 'UHF / S-BAND TRANSCEIVER VERIFICATION'}
            </h3>
          </div>
          <button
            type="button"
            className="nasa-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="nasa-modal-body">
          <div className="nasa-alert-box info">
            <strong>SIMULATED PROCEDURE:</strong> All diagnostic metrics and telemetry feedback are
            virtual for lunar astronaut mission training.
          </div>

          {/* Helmet Mode */}
          {mode === 'helmet' && (
            <div className="nasa-inspection-details">
              <p className="nasa-report-desc">
                The Extravehicular Visor Assembly (EVVA) shields the astronaut from blinding solar
                glare and ultraviolet/infrared radiation. The gold-coated sun visor reflects 95% of
                solar thermal energy.
              </p>
              <div className="nasa-telemetry-readout-grid">
                <div className="nasa-readout-card">
                  <span className="label">Neck Ring O-Ring Seal</span>
                  <span className="val green">Dual Viton Sealed</span>
                  <span className="sub">Leak Rate: 0.00 kPa/min</span>
                </div>
                <div className="nasa-readout-card">
                  <span className="label">Gold Visor Actuation</span>
                  <span className="val amber">Smooth Detent Lock</span>
                  <span className="sub">Reflectance: 95.2%</span>
                </div>
                <div className="nasa-readout-card">
                  <span className="label">Heads-Up Display</span>
                  <span className="val cyan">HUD Calibrated</span>
                  <span className="sub">Optical Parallax: 0.0°</span>
                </div>
                <div className="nasa-readout-card">
                  <span className="label">Emergency Drink Port</span>
                  <span className="val blue">Bite Valve Closed</span>
                  <span className="sub">32 oz Water Reserve</span>
                </div>
              </div>
            </div>
          )}

          {/* Gloves & Boots Mode */}
          {mode === 'gloves_boots' && (
            <div className="nasa-inspection-details">
              <p className="nasa-report-desc">
                Phase VI EVA gloves utilize thermal silicone palm grips and rotary wrist disconnect
                bearings. Lunar overboots incorporate high-traction tread designed for jagged lunar
                regolith and thermal protection from -150°C to +120°C.
              </p>
              <div className="nasa-telemetry-readout-grid">
                <div className="nasa-readout-card">
                  <span className="label">Wrist Rotary Bearings</span>
                  <span className="val green">360° Low-Friction</span>
                  <span className="sub">Double Pressure Seal OK</span>
                </div>
                <div className="nasa-readout-card">
                  <span className="label">Fingertip Heaters</span>
                  <span className="val amber">Resistive Heat Active</span>
                  <span className="sub">Current Draw: 0.4 A</span>
                </div>
                <div className="nasa-readout-card">
                  <span className="label">Lunar Overboot Treads</span>
                  <span className="val cyan">Silicon Tread 100%</span>
                  <span className="sub">Regolith Grip Nominal</span>
                </div>
                <div className="nasa-readout-card">
                  <span className="label">Ankle Joint Gimbal</span>
                  <span className="val blue">Pitch/Roll Freely</span>
                  <span className="sub">3-Axis Mobility Cleared</span>
                </div>
              </div>
            </div>
          )}

          {/* Oxygen Test Mode */}
          {mode === 'oxygen' && (
            <div className="nasa-inspection-details">
              <p className="nasa-report-desc">
                High-pressure gaseous oxygen is stored in dual composite-overwrapped pressure
                vessels (COPV) at 5.8 MPa. A dual-stage regulator reduces pressure to suit
                operating levels.
              </p>
              <div className="nasa-telemetry-readout-grid">
                <div className="nasa-readout-card">
                  <span className="label">Primary O2 Tank</span>
                  <span className="val cyan">5.82 MPa (100%)</span>
                  <span className="sub">Capacity: 0.54 kg pure O2</span>
                </div>
                <div className="nasa-readout-card">
                  <span className="label">Emergency O2 Tank</span>
                  <span className="val cyan">5.80 MPa (100%)</span>
                  <span className="sub">Reserve: 30-min Abort</span>
                </div>
                <div className="nasa-readout-card">
                  <span className="label">Dual-Stage Regulator</span>
                  <span className="val green">Manifold Balanced</span>
                  <span className="sub">Delta-P: 0.00 kPa</span>
                </div>
                <div className="nasa-readout-card">
                  <span className="label">CO2 Scrubber Cannister</span>
                  <span className="val amber">LiOH / Metal Oxide</span>
                  <span className="sub">Absorption: 8.0 hr rating</span>
                </div>
              </div>
            </div>
          )}

          {/* Pressure Test Mode */}
          {mode === 'pressure' && (
            <div className="nasa-inspection-details">
              <p className="nasa-report-desc">
                NASA EVA suits operate at a nominal internal pure O2 pressure of 29.6 kPa
                (4.3 psi). Executing a 1-minute delta-P decay test confirms zero puncture or
                seal leakage before entering the airlock.
              </p>
              <div className="nasa-telemetry-readout-grid">
                <div className="nasa-readout-card">
                  <span className="label">Suit Target Pressure</span>
                  <span className="val amber">29.6 kPa (4.3 psi)</span>
                  <span className="sub">Pure Oxygen Environment</span>
                </div>
                <div className="nasa-readout-card">
                  <span className="label">Delta-P Decay Rate</span>
                  <span className="val green">0.00 kPa/min</span>
                  <span className="sub">Max Allowed: 0.15 kPa/min</span>
                </div>
                <div className="nasa-readout-card">
                  <span className="label">Suit Relief Valve</span>
                  <span className="val blue">Crack Point 36.5 kPa</span>
                  <span className="sub">Overpressure Protection OK</span>
                </div>
                <div className="nasa-readout-card">
                  <span className="label">Structural Bladder</span>
                  <span className="val silver">Urethane Coated Nylon</span>
                  <span className="sub">Tensile Integrity 100%</span>
                </div>
              </div>
            </div>
          )}

          {/* Comms Mode */}
          {mode === 'comms' && (
            <div className="nasa-inspection-details">
              <p className="nasa-report-desc">
                Testing dual redundant voice transceivers and medical biomedical telemetry channels
                with the Lunar Habitat and Orbital Gateway relay satellite network.
              </p>
              <div className="nasa-telemetry-readout-grid">
                <div className="nasa-readout-card">
                  <span className="label">UHF Transceiver A</span>
                  <span className="val green">414.2 MHz / Locked</span>
                  <span className="sub">Signal Quality: 99.4%</span>
                </div>
                <div className="nasa-readout-card">
                  <span className="label">S-Band Gateway Uplink</span>
                  <span className="val cyan">2.2 GHz / Active</span>
                  <span className="sub">Telemetry Ping: 8 ms</span>
                </div>
                <div className="nasa-readout-card">
                  <span className="label">Biomedical Telemetry</span>
                  <span className="val amber">Heart Rate 74 BPM</span>
                  <span className="sub">Metabolic Rate: 120 W</span>
                </div>
                <div className="nasa-readout-card">
                  <span className="label">Communications Loop</span>
                  <span className="val blue">Audio Echo Nominal</span>
                  <span className="sub">Quindar Sync: Locked</span>
                </div>
              </div>
            </div>
          )}

          <div className="nasa-modal-action-bar">
            <button
              type="button"
              className="nasa-btn-primary"
              onClick={handleAction}
              disabled={isVerifying || verified}
            >
              <CheckCircle2 size={14} />
              <span>
                {isVerifying
                  ? 'EXECUTING DIAGNOSTIC VERIFICATION...'
                  : verified
                  ? 'VERIFIED & CERTIFIED'
                  : 'VERIFY & COMPLETE TEST'}
              </span>
            </button>
          </div>
        </div>

        <div className="nasa-modal-footer">
          <div className="nasa-footer-meta">
            <CheckCircle2 size={13} className="nasa-icon-green" />
            <span>Inspection sequence certified for EVA qualification</span>
          </div>
          <button type="button" className="nasa-btn-secondary" onClick={onClose}>
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}

