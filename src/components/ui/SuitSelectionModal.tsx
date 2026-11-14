import { Check, Shield, Award, Compass, X } from 'lucide-react';
import { SPACESUITS } from '../../constants/mission';
import { playClickBeep, playSuccessChime } from '../../utils/sound';
import type { SpacesuitId } from '../../types/game';

interface SuitModalProps {
  isOpen: boolean;
  currentSuit: SpacesuitId;
  onSelectSuit: (suitId: SpacesuitId) => void;
  onClose: () => void;
}

export function SuitSelectionModal({
  isOpen,
  currentSuit,
  onSelectSuit,
  onClose,
}: SuitModalProps) {
  if (!isOpen) return null;

  const suits = Object.values(SPACESUITS);

  const handleEquip = (id: SpacesuitId) => {
    playClickBeep();
    playSuccessChime();
    onSelectSuit(id);
    onClose();
  };

  return (
    <div className="nasa-modal-backdrop" onClick={onClose}>
      <div
        className="nasa-modal-card suit-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <div className="nasa-modal-header">
          <div className="nasa-modal-title-row">
            <Shield size={18} className="nasa-icon-amber" />
            <h3>SPACESUIT SELECTION & RIGGING STATION</h3>
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
          <p className="nasa-modal-subtitle">
            Select an approved NASA extravehicular spacesuit for lunar surface training.
            Geometry and material properties are preserved from original models.
          </p>

          <div className="nasa-suits-grid">
            {suits.map((suit) => {
              const isSelected = suit.id === currentSuit;
              return (
                <div
                  key={suit.id}
                  className={`nasa-suit-card ${isSelected ? 'selected' : ''}`}
                >
                  <div className="nasa-suit-card-header">
                    <div className="nasa-suit-title-block">
                      <span className="nasa-suit-badge">{suit.designation}</span>
                      <h4>{suit.name}</h4>
                    </div>
                    {isSelected && (
                      <span className="nasa-equipped-tag">
                        <Check size={12} /> EQUIPPED
                      </span>
                    )}
                  </div>

                  <p className="nasa-suit-desc">{suit.description}</p>

                  <div className="nasa-suit-specs">
                    <div className="nasa-spec-item">
                      <span className="label">Dry Mass:</span>
                      <span className="val">{suit.massKg} kg</span>
                    </div>
                    <div className="nasa-spec-item">
                      <span className="label">Operating Pressure:</span>
                      <span className="val">{suit.operatingPressureKPa} kPa</span>
                    </div>
                    <div className="nasa-spec-item">
                      <span className="label">Design Era:</span>
                      <span className="val">{suit.historicEra}</span>
                    </div>
                    <div className="nasa-spec-item">
                      <span className="label">Suitport Interlock:</span>
                      <span className={`val ${suit.suitportCompatible ? 'accent' : ''}`}>
                        {suit.suitportCompatible ? 'Compatible (MMSEV)' : 'Independent'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`nasa-btn-equip ${isSelected ? 'active' : ''}`}
                    onClick={() => handleEquip(suit.id)}
                  >
                    {isSelected ? (
                      <>
                        <Check size={14} />
                        <span>CURRENTLY EQUIPPED</span>
                      </>
                    ) : (
                      <>
                        <Compass size={14} />
                        <span>EQUIP THIS SUIT</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="nasa-modal-footer">
          <div className="nasa-footer-meta">
            <Award size={13} className="nasa-icon-amber" />
            <span>Rigged exploration avatar active (astronaut_rigged.glb). Suit selection sets life support specs & telemetry.</span>
          </div>
          <button type="button" className="nasa-btn-primary" onClick={onClose}>
            <span>CLOSE STATION</span>
          </button>
        </div>
      </div>
    </div>
  );
}

