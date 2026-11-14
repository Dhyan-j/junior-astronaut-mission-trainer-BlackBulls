import { useProgress } from '@react-three/drei';

export function LoadingScreen() {
  const { active, progress, item } = useProgress();

  if (!active && progress === 100) return null;

  const displayItem = item ? item.split('/').pop()?.split('?')[0] : 'Telemetry & Terrain';

  return (
    <div className="nasa-loading-overlay">
      <div className="nasa-loading-box">
        <div className="nasa-loading-badge">JUNIOR ASTRONAUT MISSION TRAINER</div>
        <h2 className="nasa-loading-title">INITIALIZING LUNAR ENVIRONMENT</h2>

        <div className="nasa-progress-bar-container">
          <div
            className="nasa-progress-bar-fill"
            style={{ width: `${Math.min(100, Math.round(progress))}%` }}
          />
        </div>

        <div className="nasa-loading-status">
          <span className="nasa-loading-pct">{Math.round(progress)}%</span>
          <span className="nasa-loading-asset">Loading: {displayItem}</span>
        </div>

        <div className="nasa-loading-hint">
          Draco WASM Decoder active &bull; Loading NASA 3D Assets &bull; Synthesizing Regolith
        </div>
      </div>
    </div>
  );
}

