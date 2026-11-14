import { useState, useEffect } from 'react';
import { DoorOpen, AlertTriangle, ArrowRight, X } from 'lucide-react';
import { playClickBeep, playAirlockHiss, playSuccessChime } from '../../utils/sound';

interface AirlockModalProps {
  isOpen: boolean;
  canEnter: boolean;
  onCycleComplete: () => void;
  onClose: () => void;
}

export function AirlockCyclingModal({
  isOpen,
  canEnter,
  onCycleComplete,
  onClose,
}: AirlockModalProps) {
  const [isCycling, setIsCycling] = useState(false);
  const [countdown, setCountdown] = useState(4);
  const [pressure, setPressure] = useState(101.3);
  const [hatchOpen, setHatchOpen] = useState(false);

  useEffect(() => {
    if (!isCycling || countdown <= 0) return;
    const timer = setTimeout(() => {
      const next = countdown - 1;
      setCountdown(next);
      setPressure((p) => Math.max(0, Number((p - 25.3).toFixed(1))));
      if (next === 0) {
        setHatchOpen(true);
        playSuccessChime();
        setTimeout(() => {
          onCycleComplete();
        }, 1200);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [isCycling, countdown, onCycleComplete]);

  if (!isOpen) return null;

  const handleStartCycle = () => {
    playClickBeep();
    playAirlockHiss();
    setIsCycling(true);
  };

  return (
    <div className="nasa-modal-backdrop" onClick={onClose}>
      <div
        className="nasa-modal-card airlock-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <div className="nasa-modal-header">
          <div className="nasa-modal-title-row">
            <DoorOpen size={18} className="nasa-icon-amber" />
            <h3>HABITAT AIRLOCK ENTRY & DEPRESSURIZATION</h3>
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
          {!canEnter ? (
            <div className="nasa-alert-box warn">
              <div className="nasa-alert-title-row">
                <AlertTriangle size={16} />
                <strong>AIRLOCK INTERLOCK LOCKED</strong>
              </div>
              <p>
                Cannot cycle airlock until all prior spacesuit preparation and life support
                diagnostics (Steps 1 through 9) have been executed and verified. Please complete
                the outstanding checklist tasks.
              </p>
            </div>
          ) : (
            <div className="nasa-airlock-content">
              <p className="nasa-report-desc">
                The Habitat Demonstration Unit outer airlock chamber depressurizes from 101.3 kPa
                (habitat cabin atmosphere) to vacuum (0.0 kPa) before equalizing with the lunar
                surface environment.
              </p>

              <div className="nasa-airlock-status-box">
                <div className="nasa-airlock-metric">
                  <span className="label">CHAMBER PRESSURE</span>
                  <span className="val">{pressure} kPa</span>
                  <span className="sub">
                    {pressure > 1 ? 'PRESSURIZED' : 'VACUUM EQUALIZED'}
                  </span>
                </div>
                <div className="nasa-airlock-metric">
                  <span className="label">OUTER HATCH STATUS</span>
                  <span className={`val ${hatchOpen ? 'green' : 'amber'}`}>
                    {hatchOpen ? 'UNLOCKED / OPEN' : 'SEALED & DOGGED'}
                  </span>
                  <span className="sub">
                    {isCycling ? `CYCLING IN PROGRESS: ${countdown}s` : 'READY TO CYCLE'}
                  </span>
                </div>
              </div>

              <div className="nasa-modal-action-bar">
                <button
                  type="button"
                  className="nasa-btn-primary"
                  onClick={handleStartCycle}
                  disabled={isCycling || hatchOpen}
                >
                  <DoorOpen size={14} />
                  <span>
                    {isCycling
                      ? `DEPRESSURIZING AIRLOCK (${countdown}s)...`
                      : hatchOpen
                      ? 'AIRLOCK OPENED - ENTERING BASE...'
                      : 'INITIATE AIRLOCK DEPRESSURIZATION CYCLE'}
                  </span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="nasa-modal-footer">
          <div className="nasa-footer-meta">
            <span>Air evacuation pump rate: 25.3 kPa/sec</span>
          </div>
          <button type="button" className="nasa-btn-secondary" onClick={onClose}>
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}
