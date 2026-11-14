import { useState } from 'react';
import { Zap, Droplets, CheckCircle2, Lock, X } from 'lucide-react';
import { playClickBeep, playSuccessChime } from '../../utils/sound';

interface PLSSModalProps {
  isOpen: boolean;
  mode: 'install' | 'cooling';
  isInstalled: boolean;
  onInstallComplete: () => void;
  onCoolingComplete: () => void;
  onClose: () => void;
}

export function PLSSInstallationModal({
  isOpen,
  mode,
  isInstalled,
  onInstallComplete,
  onCoolingComplete,
  onClose,
}: PLSSModalProps) {
  const [step1Checked, setStep1Checked] = useState(false);
  const [step2Checked, setStep2Checked] = useState(false);
  const [step3Checked, setStep3Checked] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleInstall = () => {
    playClickBeep();
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      playSuccessChime();
      onInstallComplete();
      onClose();
    }, 700);
  };

  const handleCoolingTest = () => {
    playClickBeep();
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      playSuccessChime();
      onCoolingComplete();
      onClose();
    }, 700);
  };

  const allInstallStepsReady = step1Checked && step2Checked && step3Checked;

  return (
    <div className="nasa-modal-backdrop" onClick={onClose}>
      <div
        className="nasa-modal-card plss-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <div className="nasa-modal-header">
          <div className="nasa-modal-title-row">
            <Zap size={18} className="nasa-icon-amber" />
            <h3>
              {mode === 'install'
                ? 'PORTABLE LIFE SUPPORT SYSTEM (PLSS) MOUNTING'
                : 'LIQUID COOLING & VENTILATION GARMENT (LCVG) DIAGNOSTICS'}
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
            <strong>NOTICE:</strong> Procedural life support equipment model rendered for
            interactive simulation. All parameters are simulated.
          </div>

          {mode === 'install' ? (
            <div className="nasa-plss-content">
              <p className="nasa-report-desc">
                The Portable Life Support System supplies primary oxygen, regulates suit pressure,
                circulates cooling water, scrubs carbon dioxide, and houses VHF/UHF transceivers.
              </p>

              <div className="nasa-checklist-group">
                <label className="nasa-checklist-item">
                  <input
                    type="checkbox"
                    checked={step1Checked}
                    onChange={(e) => {
                      playClickBeep();
                      setStep1Checked(e.target.checked);
                    }}
                  />
                  <div>
                    <strong>Step 1: Guide Flange Mating</strong>
                    <span>Align backpack alignment pins with Upper Torso guide brackets.</span>
                  </div>
                </label>

                <label className="nasa-checklist-item">
                  <input
                    type="checkbox"
                    checked={step2Checked}
                    onChange={(e) => {
                      playClickBeep();
                      setStep2Checked(e.target.checked);
                    }}
                  />
                  <div>
                    <strong>Step 2: Dual Latch Lock</strong>
                    <span>Engage primary and secondary mechanical toggle locks.</span>
                  </div>
                </label>

                <label className="nasa-checklist-item">
                  <input
                    type="checkbox"
                    checked={step3Checked}
                    onChange={(e) => {
                      playClickBeep();
                      setStep3Checked(e.target.checked);
                    }}
                  />
                  <div>
                    <strong>Step 3: Connect Umbilical Manifold</strong>
                    <span>Lock O2 supply, water cooling loop, and telemetry electrical bus.</span>
                  </div>
                </label>
              </div>

              <div className="nasa-modal-action-bar">
                <button
                  type="button"
                  className={`nasa-btn-primary ${!allInstallStepsReady || isProcessing ? 'disabled' : ''}`}
                  disabled={!allInstallStepsReady || isProcessing}
                  onClick={handleInstall}
                >
                  <Lock size={14} />
                  <span>
                    {isInstalled
                      ? 'RE-VERIFY & LOCK PLSS'
                      : isProcessing
                      ? 'LOCKING LATCHES...'
                      : 'COMPLETE PLSS INSTALLATION'}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className="nasa-plss-content">
              <p className="nasa-report-desc">
                The Liquid Cooling and Ventilation Garment (LCVG) removes metabolic heat during EVA
                by circulating chilled water through 91 meters of flexible tubing woven into the
                undergarment.
              </p>

              <div className="nasa-telemetry-readout-grid">
                <div className="nasa-readout-card">
                  <span className="label">Circulation Flow Rate</span>
                  <span className="val cyan">1.82 L/min</span>
                  <span className="sub">Nominal Range: 1.5 - 2.0 L/min</span>
                </div>
                <div className="nasa-readout-card">
                  <span className="label">Loop Temperature</span>
                  <span className="val green">14.2°C</span>
                  <span className="sub">Target: 12 - 16°C</span>
                </div>
                <div className="nasa-readout-card">
                  <span className="label">Sublimator Water Feed</span>
                  <span className="val amber">4.5 kg</span>
                  <span className="sub">100% Reserve Capacity</span>
                </div>
                <div className="nasa-readout-card">
                  <span className="label">Sublimation Matrix</span>
                  <span className="val blue">Porous Plate Active</span>
                  <span className="sub">Delta-T: Nominal</span>
                </div>
              </div>

              <div className="nasa-modal-action-bar">
                <button
                  type="button"
                  className="nasa-btn-primary"
                  onClick={handleCoolingTest}
                  disabled={isProcessing}
                >
                  <Droplets size={14} />
                  <span>
                    {isProcessing ? 'CIRCULATING WATER LOOP...' : 'CONFIRM COOLING LOOP NOMINAL'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="nasa-modal-footer">
          <div className="nasa-footer-meta">
            <CheckCircle2 size={13} className="nasa-icon-green" />
            <span>Simulated PLSS Telemetry Nominal</span>
          </div>
          <button type="button" className="nasa-btn-secondary" onClick={onClose}>
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}
