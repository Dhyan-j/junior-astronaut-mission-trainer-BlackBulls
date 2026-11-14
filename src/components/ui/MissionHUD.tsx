import { useState, useEffect } from 'react';
import { Radio, AlertTriangle } from 'lucide-react';
import { ResourcePanel } from './ResourcePanel';
import { CameraControlsBar } from './CameraControlsBar';
import { AlignmentReportModal } from './AlignmentReportModal';
import type { CameraTargetId } from '../../types/mission';

interface MissionHUDProps {
  activeTarget: CameraTargetId;
  onSelectTarget: (target: CameraTargetId) => void;
  onResetCamera: () => void;
}

export function MissionHUD({
  activeTarget,
  onSelectTarget,
  onResetCamera,
}: MissionHUDProps) {
  const [utcTime, setUtcTime] = useState<string>('');
  const [isReportOpen, setIsReportOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toISOString().slice(0, 19).replace('T', ' ') + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="nasa-hud-overlay">
      {/* Top Mission Header Bar */}
      <header className="nasa-top-bar">
        <div className="nasa-brand-group">
          <div className="nasa-insignia">
            <span className="nasa-insignia-text">NASA</span>
          </div>
          <div className="nasa-title-column">
            <div className="nasa-hud-primary-title">LUNAR TRAINING BASE</div>
            <div className="nasa-hud-subtitles">
              <span className="nasa-hud-item">
                <span className="nasa-label">Mission:</span> First Lunar Deployment
              </span>
              <span className="nasa-sep">&bull;</span>
              <span className="nasa-hud-item">
                <span className="nasa-label">Location:</span> Lunar Surface
              </span>
              <span className="nasa-sep">&bull;</span>
              <span className="nasa-hud-item nasa-status-tag">
                <span className="nasa-label">Status:</span> Training Environment
              </span>
            </div>
          </div>
        </div>

        <div className="nasa-top-right">
          <div className="nasa-telemetry-ping">
            <Radio size={12} className="nasa-icon-green pulse" />
            <span className="nasa-mono-time">{utcTime}</span>
          </div>

          <button
            type="button"
            className="nasa-btn-report-toggle"
            onClick={() => setIsReportOpen(true)}
            title="Inspect 3D model alignment & telemetry report"
          >
            <AlertTriangle size={13} className="nasa-icon-amber" />
            <span>DIAGNOSTIC REPORT</span>
          </button>
        </div>
      </header>

      {/* Floating Life Support / Resources Telemetry Panel */}
      <aside className="nasa-hud-sidebar">
        <ResourcePanel />
      </aside>

      {/* Bottom Camera Exploration Controls Bar */}
      <footer className="nasa-bottom-bar">
        <CameraControlsBar
          activeTarget={activeTarget}
          onSelectTarget={onSelectTarget}
          onResetCamera={onResetCamera}
        />
      </footer>

      {/* Engineering Diagnostic Inspection Modal */}
      <AlignmentReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />
    </div>
  );
}

