import { useState, useEffect } from 'react';
import {
  Radio,
  Pause,
  Shield,
  Zap,
  Wind,
  Gauge,
  AlertTriangle,
  Volume2,
  VolumeX,
  Eye,
  Camera,
  RotateCcw,
  CheckCircle2,
  ListTodo,
  Activity,
  PackageCheck,
  EyeOff,
  Navigation,
} from 'lucide-react';
import { ObjectiveTrackerPanel } from './ObjectiveTrackerPanel';
import { InteractionPrompt } from './InteractionPrompt';
import { SPACESUITS } from '../../constants/mission';
import type { CameraMode, InteractiveTarget, MissionState } from '../../types/game';

interface GameHUDProps {
  missionState: MissionState;
  activeInteractionText: string | null;
  activeStationTitle: string | null;
  cameraMode: CameraMode;
  onSetCameraMode: (mode: CameraMode) => void;
  onResetInspection?: () => void;
  onToggleMute: () => void;
  onOpenPause: () => void;
  onOpenReport: () => void;
  debugCollisions?: boolean;
  onToggleDebugCollisions?: () => void;
  playerPosition?: [number, number, number];
  activeTarget?: InteractiveTarget | null;
}

export function GameHUD({
  missionState,
  activeInteractionText,
  activeStationTitle,
  cameraMode,
  onSetCameraMode,
  onResetInspection,
  onToggleMute,
  onOpenPause,
  onOpenReport,
  debugCollisions = false,
  onToggleDebugCollisions,
  playerPosition,
  activeTarget,
}: GameHUDProps) {
  const currentSuitMeta = SPACESUITS[missionState.selectedSuit];
  const completedCount = missionState.objectives.filter((o) => o.completed).length;
  const totalCount = missionState.objectives.length;
  const progressPct = Math.round((completedCount / totalCount) * 100);
  const activeObjective = missionState.objectives[missionState.currentObjectiveIndex];

  // Collapsible Full-Screen HUD State
  const [showObjectives, setShowObjectives] = useState(false);
  const [showTelemetry, setShowTelemetry] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [isHUDHidden, setIsHUDHidden] = useState(false);

  // Compute live distance and bearing to active target
  let targetDistance: number | null = null;
  let targetBearing: string | null = null;

  if (activeTarget && playerPosition) {
    const dx = activeTarget.position[0] - playerPosition[0];
    const dz = activeTarget.position[2] - playerPosition[2];
    targetDistance = Math.hypot(dx, dz);

    const rad = Math.atan2(dx, -dz);
    let deg = Math.round((rad * 180) / Math.PI);
    if (deg < 0) deg += 360;

    const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const cardIdx = Math.round(deg / 45) % 8;
    targetBearing = `${deg}° ${cardinals[cardIdx]}`;
  }

  // Keyboard shortcut listener for TAB, M, I, H
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        setShowObjectives((prev) => !prev);
      } else if (e.key === 'm' || e.key === 'M') {
        setShowTelemetry((prev) => !prev);
      } else if (e.key === 'i' || e.key === 'I') {
        setShowInventory((prev) => !prev);
      } else if (e.key === 'h' || e.key === 'H') {
        setIsHUDHidden((prev) => !prev);
      } else if (e.key === 'c' || e.key === 'C') {
        onToggleDebugCollisions?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleDebugCollisions]);

  if (isHUDHidden) {
    return (
      <div className="nasa-hud-cinema-toggle" onClick={() => setIsHUDHidden(false)}>
        <button type="button" className="nasa-btn-cinema-restore">
          <Eye size={14} />
          <span>PRESS [H] TO SHOW HUD</span>
        </button>
      </div>
    );
  }

  return (
    <div className="nasa-game-hud">
      {/* =============================================================== */}
      {/* 1. TOP COMPACT STATUS BAR                                       */}
      {/* =============================================================== */}
      <header className="nasa-top-bar">
        {/* Brand & Mission Status Pill */}
        <div className="nasa-brand-group">
          <div className="nasa-insignia">
            <span className="nasa-insignia-text">NASA</span>
          </div>
          <div className="nasa-title-column">
            <div className="nasa-hud-primary-title">
              MISSION 01 &bull; EVA QUALIFICATION
            </div>
            <div className="nasa-hud-subtitles">
              <span className="nasa-hud-item">
                <span className="nasa-label">Step:</span>{' '}
                {activeObjective
                  ? `${activeObjective.stepNumber}/${totalCount}: ${activeObjective.title}`
                  : 'Completed'}
              </span>
              <span className="nasa-sep">&bull;</span>
              <span className="nasa-hud-item">
                <span className="nasa-label">Progress:</span> {completedCount}/{totalCount} ({progressPct}%)
              </span>
              <span className="nasa-sep">&bull;</span>
              <span className="nasa-hud-item">
                <span className="nasa-label">Suit:</span> {currentSuitMeta.name}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Camera Mode Selector */}
        <div className="nasa-camera-mode-bar">
          <button
            type="button"
            className={`nasa-btn-cam ${cameraMode === 'third_person' ? 'active' : ''}`}
            onClick={() => onSetCameraMode('third_person')}
            title="Third-Person Chase Camera [V]"
          >
            <Camera size={13} />
            <span>3RD PERSON [V]</span>
          </button>
          <button
            type="button"
            className={`nasa-btn-cam ${cameraMode === 'first_person' ? 'active' : ''}`}
            onClick={() => onSetCameraMode('first_person')}
            title="First-Person Helmet Visor View [V]"
          >
            <Eye size={13} />
            <span>1ST PERSON [V]</span>
          </button>
          <button
            type="button"
            className={`nasa-btn-cam ${cameraMode === 'inspection' ? 'active' : ''}`}
            onClick={() => onSetCameraMode('inspection')}
            title="360° Suit Inspection Mode"
          >
            <Shield size={13} />
            <span>INSPECT</span>
          </button>
          {cameraMode === 'inspection' && onResetInspection && (
            <button
              type="button"
              className="nasa-btn-cam reset"
              onClick={onResetInspection}
              title="Reset Inspection Camera View"
            >
              <RotateCcw size={12} />
              <span>RESET</span>
            </button>
          )}
        </div>

        {/* Right: Quick Indicators & Drawer Toggles */}
        <div className="nasa-top-right">
          {/* Quick Life Support Status Badges */}
          <div className="nasa-mini-vitals">
            <span
              className={`nasa-vital-badge ${missionState.oxygenChecked ? 'cyan' : 'dim'}`}
              title="Oxygen Supply Status"
            >
              <Wind size={11} />
              <span>{missionState.oxygenChecked ? '100% O₂' : 'O₂ STBY'}</span>
            </span>
            <span
              className={`nasa-vital-badge ${missionState.pressureChecked ? 'green' : 'dim'}`}
              title="Suit Pressure"
            >
              <Gauge size={11} />
              <span>{missionState.pressureChecked ? '29.6 kPa' : '0.0 kPa'}</span>
            </span>
            <span className="nasa-vital-badge green" title="Battery Reserve">
              <Zap size={11} />
              <span>8.5h</span>
            </span>
          </div>

          {/* Drawer Toggles */}
          <button
            type="button"
            className={`nasa-btn-icon-hud ${showObjectives ? 'active' : ''}`}
            onClick={() => setShowObjectives((p) => !p)}
            title="Toggle Objectives Checklist [TAB]"
          >
            <ListTodo size={14} />
            <span className="nasa-btn-text">OBJECTIVES [TAB]</span>
          </button>

          <button
            type="button"
            className={`nasa-btn-icon-hud ${showTelemetry ? 'active' : ''}`}
            onClick={() => setShowTelemetry((p) => !p)}
            title="Toggle Spacesuit Telemetry Drawer [M]"
          >
            <Activity size={14} />
            <span className="nasa-btn-text">TELEMETRY [M]</span>
          </button>

          <button
            type="button"
            className={`nasa-btn-icon-hud ${showInventory ? 'active' : ''}`}
            onClick={() => setShowInventory((p) => !p)}
            title="Toggle Spacesuit Equipment Manifest [I]"
          >
            <PackageCheck size={14} />
            <span className="nasa-btn-text">GEAR [I]</span>
          </button>

          {/* Collision Debug Toggle */}
          <button
            type="button"
            className={`nasa-btn-icon-hud ${debugCollisions ? 'active' : ''}`}
            onClick={onToggleDebugCollisions}
            title="Toggle Collision Geometry Debug Visualization [C]"
          >
            <Shield size={14} />
            <span className="nasa-btn-text">COLLIDERS [C]</span>
          </button>

          {/* Cinema Mode Toggle */}
          <button
            type="button"
            className="nasa-btn-icon-hud"
            onClick={() => setIsHUDHidden(true)}
            title="Hide all HUD for pure cinematic view [H]"
          >
            <EyeOff size={14} className="nasa-icon-amber" />
          </button>

          {/* Mute Audio Toggle */}
          <button
            type="button"
            className={`nasa-btn-icon-hud ${missionState.isMuted ? 'muted' : ''}`}
            onClick={onToggleMute}
            title={missionState.isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {missionState.isMuted ? (
              <VolumeX size={14} className="nasa-icon-amber" />
            ) : (
              <Volume2 size={14} className="nasa-icon-green" />
            )}
          </button>

          <div className="nasa-telemetry-ping">
            <Radio size={12} className="nasa-icon-green pulse" />
            <span className="nasa-mono-time">ARTEMIS-NET</span>
          </div>

          <button
            type="button"
            className="nasa-btn-report-toggle"
            onClick={onOpenReport}
            title="View 3D asset engineering inspection report"
          >
            <AlertTriangle size={13} className="nasa-icon-amber" />
            <span>DIAGNOSTICS</span>
          </button>

          <button
            type="button"
            className="nasa-btn-pause"
            onClick={onOpenPause}
            title="Pause training mission [ESC]"
          >
            <Pause size={14} />
            <span>PAUSE [ESC]</span>
          </button>
        </div>
      </header>

      {/* =============================================================== */}
      {/* 2. LIVE 3D NAVIGATION GUIDANCE BANNER                            */}
      {/* =============================================================== */}
      {activeTarget && (
        <div className="nasa-nav-banner">
          <Navigation size={13} className="nasa-icon-amber" />
          <span className="nasa-nav-target">{activeTarget.title}</span>
          {targetDistance !== null && (
            <>
              <span className="nasa-sep">&bull;</span>
              <span className="nasa-nav-dist">Distance: {targetDistance.toFixed(1)} m</span>
            </>
          )}
          {targetBearing && (
            <>
              <span className="nasa-sep">&bull;</span>
              <span className="nasa-nav-bearing">Heading: {targetBearing}</span>
            </>
          )}
        </div>
      )}

      {/* =============================================================== */}
      {/* 3. TOGGLEABLE LEFT DRAWER: OBJECTIVE TRACKER                    */}
      {/* =============================================================== */}
      {showObjectives && (
        <aside className="nasa-game-sidebar-left">
          <ObjectiveTrackerPanel
            objectives={missionState.objectives}
            currentStepIndex={missionState.currentObjectiveIndex}
          />
        </aside>
      )}

      {/* =============================================================== */}
      {/* 4. TOGGLEABLE RIGHT DRAWER: SPACESUIT TELEMETRY                 */}
      {/* =============================================================== */}
      {showTelemetry && (
        <aside className="nasa-game-sidebar-right">
          <div className="nasa-panel nasa-eva-suit-panel">
            <div className="nasa-panel-header">
              <div className="nasa-panel-title">
                <Shield size={14} className="nasa-icon-cyan" />
                <span>SPACESUIT TELEMETRY</span>
              </div>
              <span className="nasa-badge-simulated">SIMULATED</span>
            </div>

            <div className="nasa-panel-body">
              <div className="nasa-stat-row">
                <span className="nasa-stat-label">Model Designation</span>
                <span className="nasa-stat-value">{currentSuitMeta.designation}</span>
              </div>
              <div className="nasa-stat-row">
                <span className="nasa-stat-label">Historic Era</span>
                <span className="nasa-stat-value">{currentSuitMeta.historicEra}</span>
              </div>
              <div className="nasa-stat-row">
                <span className="nasa-stat-label">Total Mass</span>
                <span className="nasa-stat-value">{currentSuitMeta.massKg} kg</span>
              </div>
              <div className="nasa-stat-row">
                <span className="nasa-stat-label">Nominal Pressure</span>
                <span className="nasa-stat-value">{currentSuitMeta.operatingPressureKPa} kPa</span>
              </div>

              <div className="nasa-divider" />

              <div className="nasa-telemetry-grid">
                <div className="nasa-telemetry-box">
                  <span className="label">PRIMARY O2</span>
                  <span className="val cyan">{missionState.oxygenChecked ? '100%' : 'STBY'}</span>
                </div>
                <div className="nasa-telemetry-box">
                  <span className="label">SUIT DELTA-P</span>
                  <span className="val green">{missionState.pressureChecked ? '29.6 kPa' : '0.0 kPa'}</span>
                </div>
                <div className="nasa-telemetry-box">
                  <span className="label">LOOP CHILLER</span>
                  <span className="val blue">{missionState.coolingInspected ? `${missionState.simulatedCoolingLoopTemp}°C` : 'OFF'}</span>
                </div>
                <div className="nasa-telemetry-box">
                  <span className="label">RADIO LINK</span>
                  <span className="val green">{missionState.commsVerified ? 'UHF LOCK' : 'SILENT'}</span>
                </div>
              </div>

              <p className="nasa-suit-description-text">{currentSuitMeta.description}</p>
            </div>

            <div className="nasa-panel-footer">
              <span className="nasa-footer-note">All values simulated for EVA trainer</span>
            </div>
          </div>
        </aside>
      )}

      {/* =============================================================== */}
      {/* 5. TOGGLEABLE GEAR & INVENTORY MODAL (I KEY)                    */}
      {/* =============================================================== */}
      {showInventory && (
        <div className="nasa-gear-drawer-overlay" onClick={() => setShowInventory(false)}>
          <div className="nasa-gear-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="nasa-gear-header">
              <div className="nasa-panel-title">
                <PackageCheck size={16} className="nasa-icon-green" />
                <span>SPACESUIT & EVA EQUIPMENT MANIFEST</span>
              </div>
              <button
                type="button"
                className="nasa-btn-close-gear"
                onClick={() => setShowInventory(false)}
              >
                &times;
              </button>
            </div>

            <div className="nasa-gear-grid">
              <div className="nasa-gear-card active">
                <div className="nasa-gear-title">SPACESUIT TORSO & LIMBS</div>
                <div className="nasa-gear-val">{currentSuitMeta.name}</div>
                <div className="nasa-gear-desc">{currentSuitMeta.fullName}</div>
                <div className="nasa-gear-stat">Mass: {currentSuitMeta.massKg} kg | Pressure: {currentSuitMeta.operatingPressureKPa} kPa</div>
              </div>

              <div className={`nasa-gear-card ${missionState.helmetInspected ? 'active' : ''}`}>
                <div className="nasa-gear-title">EXTRAVEHICULAR VISOR ASSEMBLY</div>
                <div className="nasa-gear-val">{missionState.helmetInspected ? 'VERIFIED' : 'PENDING CHECK'}</div>
                <div className="nasa-gear-desc">Gold-coated polycarbonate thermal & UV solar visor</div>
                <div className="nasa-gear-stat">Transmittance: 14% | Anti-fog heater: Nominal</div>
              </div>

              <div className={`nasa-gear-card ${missionState.plssInstalled ? 'active' : ''}`}>
                <div className="nasa-gear-title">PORTABLE LIFE SUPPORT SYSTEM</div>
                <div className="nasa-gear-val">{missionState.plssInstalled ? 'ATTACHED' : 'NOT MOUNTED'}</div>
                <div className="nasa-gear-desc">Dual primary O2 tanks, LiOH CO2 scrubbers, sublimation matrix</div>
                <div className="nasa-gear-stat">Capacity: 8.5h EVA | Umbilical: Dual redundant</div>
              </div>

              <div className={`nasa-gear-card ${missionState.coolingInspected ? 'active' : ''}`}>
                <div className="nasa-gear-title">LIQUID COOLING GARMENT (LCVG)</div>
                <div className="nasa-gear-val">{missionState.coolingInspected ? 'CIRCULATING' : 'IDLE'}</div>
                <div className="nasa-gear-desc">84 meters of flexible vinyl tubing circulating chilled water</div>
                <div className="nasa-gear-stat">Temp: {missionState.simulatedCoolingLoopTemp}°C | Flow: 1.1 L/min</div>
              </div>
            </div>

            <div className="nasa-gear-footer">
              <CheckCircle2 size={14} className="nasa-icon-green" />
              <span>Press [I] or click close to return to EVA simulation</span>
            </div>
          </div>
        </div>
      )}

      {/* =============================================================== */}
      {/* 6. INTERACTION PROMPT (CENTER BOTTOM)                           */}
      {/* =============================================================== */}
      <InteractionPrompt
        actionText={activeInteractionText}
        stationTitle={activeStationTitle}
      />

      {/* =============================================================== */}
      {/* 7. BOTTOM HUD KEYBIND CONTROLS HELPER BAR                       */}
      {/* =============================================================== */}
      <footer className="nasa-hud-bottom-bar">
        <div className="nasa-keybind-list">
          <span className="key-item"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> Move</span>
          <span className="key-sep">&bull;</span>
          <span className="key-item"><kbd>SHIFT</kbd> Sprint</span>
          <span className="key-sep">&bull;</span>
          <span className="key-item"><kbd>E</kbd>/<kbd>ENTER</kbd> Interact</span>
          <span className="key-sep">&bull;</span>
          <span className="key-item"><kbd>V</kbd> Camera</span>
          <span className="key-sep">&bull;</span>
          <span className="key-item"><kbd>TAB</kbd> Objectives</span>
          <span className="key-sep">&bull;</span>
          <span className="key-item"><kbd>M</kbd> Telemetry</span>
          <span className="key-sep">&bull;</span>
          <span className="key-item"><kbd>I</kbd> Gear</span>
          <span className="key-sep">&bull;</span>
          <span className="key-item"><kbd>C</kbd> Colliders</span>
          <span className="key-sep">&bull;</span>
          <span className="key-item"><kbd>H</kbd> Cinema</span>
          <span className="key-sep">&bull;</span>
          <span className="key-item"><kbd>ESC</kbd> Pause</span>
        </div>
      </footer>
    </div>
  );
}
