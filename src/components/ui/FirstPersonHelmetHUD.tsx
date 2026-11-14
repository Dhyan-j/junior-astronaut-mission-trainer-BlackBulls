import type { MissionState } from '../../types/game';

interface FirstPersonHelmetHUDProps {
  missionState: MissionState;
}

export function FirstPersonHelmetHUD({ missionState }: FirstPersonHelmetHUDProps) {
  return (
    <div className="nasa-helmet-hud-container" style={{ pointerEvents: 'none' }}>
      {/* Visor Vignette and Curved Glass Reflection */}
      <div className="nasa-visor-vignette nasa-helmet-visor-frame" />
      <div className="nasa-visor-glass-overlay" />

      {/* Reticle / Targeting Crosshair */}
      <div className="nasa-hud-crosshair">
        <div className="nasa-reticle-circle" />
        <div className="nasa-reticle-line h-left" />
        <div className="nasa-reticle-line h-right" />
        <div className="nasa-reticle-line v-top" />
        <div className="nasa-reticle-line v-bottom" />
      </div>

      {/* Compass / Heading Tape */}
      <div className="nasa-hud-heading-tape">
        <span className="nasa-heading-mark">270° W</span>
        <span className="nasa-heading-mark main">300° NW</span>
        <span className="nasa-heading-mark">330°</span>
        <span className="nasa-heading-mark main">000° N</span>
        <span className="nasa-heading-mark">030° NE</span>
      </div>

      {/* Visor Telemetry Heads-Up Overlay */}
      <div className="nasa-visor-telemetry-left">
        <div className="nasa-visor-telemetry-item">
          <span className="label">O2 SUPPLY</span>
          <span className="val cyan">{missionState.simulatedOxygenPercent}%</span>
        </div>
        <div className="nasa-visor-telemetry-item">
          <span className="label">SUIT DELTA-P</span>
          <span className="val amber">{missionState.simulatedPressureKPa} kPa</span>
        </div>
        <div className="nasa-visor-telemetry-item">
          <span className="label">LCVG TEMP</span>
          <span className="val blue">{missionState.simulatedCoolingLoopTemp}°C</span>
        </div>
      </div>

      <div className="nasa-visor-telemetry-right">
        <div className="nasa-visor-telemetry-item">
          <span className="label">BATTERY</span>
          <span className="val green">{missionState.simulatedBatteryHours} HR</span>
        </div>
        <div className="nasa-visor-telemetry-item">
          <span className="label">PLSS STATUS</span>
          <span className={`val ${missionState.plssInstalled ? 'green' : 'amber'}`}>
            {missionState.plssInstalled ? 'ENGAGED' : 'UNMOUNTED'}
          </span>
        </div>
      </div>

      {/* First-Person EVA Spacesuit Glove Cuffs */}
      <div className="nasa-first-person-gloves">
        <div className="nasa-fp-glove left">
          <div className="nasa-glove-wrist-ring" />
          <div className="nasa-glove-cuff">
            <span className="nasa-glove-label">PHASE-VI EVA L</span>
          </div>
        </div>
        <div className="nasa-fp-glove right">
          <div className="nasa-glove-wrist-ring" />
          <div className="nasa-glove-cuff">
            <span className="nasa-glove-label">PHASE-VI EVA R</span>
          </div>
        </div>
      </div>

      {/* Bottom Hint */}
      <div className="nasa-visor-bottom-hint">
        <span>EVA HEADS-UP DISPLAY ACTIVE • PRESS [V] TO SWITCH TO THIRD PERSON</span>
      </div>
    </div>
  );
}

