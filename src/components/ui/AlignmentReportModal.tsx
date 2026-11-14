import { AlertTriangle, CheckCircle2, X, FileCode } from 'lucide-react';
import { HDU_ALIGNMENT_INFO, ASTRONAUT_ANIMATION_INFO, ROVER_PERFORMANCE_INFO } from '../../constants/mission';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function AlignmentReportModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div className="nasa-modal-backdrop" onClick={onClose}>
      <div
        className="nasa-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="nasa-modal-header">
          <div className="nasa-modal-title-row">
            <AlertTriangle size={18} className="nasa-icon-amber" />
            <h3>ENGINEERING INSPECTION REPORT</h3>
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
          {/* Habitat Demonstration Unit Alignment Findings */}
          <div className="nasa-report-section">
            <div className="nasa-section-title-row">
              <span className="nasa-status-badge warn">ALIGNMENT DISCREPANCY DETECTED</span>
              <h4>Habitat Demonstration Unit (Parts 1 & 2)</h4>
            </div>
            <p className="nasa-report-desc">
              Visual and structural inspection of the two raw glTF models confirms that they do
              <strong> NOT</strong> form a seamless sealed module when original geometries are preserved:
            </p>
            <ul className="nasa-report-list">
              <li>
                <strong>Part 1 Node Scale:</strong>{' '}
                <code>[{HDU_ALIGNMENT_INFO.part1Scale.join(', ')}]</code>
              </li>
              <li>
                <strong>Part 2 Node Scale:</strong>{' '}
                <code>[{HDU_ALIGNMENT_INFO.part2Scale.join(', ')}]</code>
              </li>
              <li>
                <strong>Part 1 Bounding Extents:</strong> {HDU_ALIGNMENT_INFO.part1Bounds}
              </li>
              <li>
                <strong>Part 2 Bounding Extents:</strong> {HDU_ALIGNMENT_INFO.part2Bounds}
              </li>
            </ul>
            <div className="nasa-alert-box warn">
              <strong>Technical Assessment:</strong> {HDU_ALIGNMENT_INFO.notes}
            </div>
          </div>

          {/* Astronaut Z-2 Spacesuit Animation Status */}
          <div className="nasa-report-section">
            <div className="nasa-section-title-row">
              <span className="nasa-status-badge info">STATIC MESH VERIFIED</span>
              <h4>Astronaut Model (Z2 Spacesuit.glb)</h4>
            </div>
            <ul className="nasa-report-list">
              <li>
                <strong>Skeletal Animation Tracks:</strong>{' '}
                {ASTRONAUT_ANIMATION_INFO.animationCount} (None)
              </li>
              <li>
                <strong>Skins / Armature Deformers:</strong>{' '}
                {ASTRONAUT_ANIMATION_INFO.skinCount} (None)
              </li>
              <li>
                <strong>Geometry Status:</strong> Single unified static mesh with baked 4K PBR maps
                (BaseColor, Normal, Specular).
              </li>
            </ul>
            <div className="nasa-alert-box info">
              <strong>Verification Result:</strong> {ASTRONAUT_ANIMATION_INFO.details}
            </div>
          </div>

          {/* Lunar Rover (SEV) Performance Check */}
          <div className="nasa-report-section">
            <div className="nasa-section-title-row">
              <span className="nasa-status-badge success">SCALE & TEXTURES VALID</span>
              <h4>Lunar Rover (Space Exploration Vehicle.glb)</h4>
            </div>
            <ul className="nasa-report-list">
              <li>
                <strong>Geometric Complexity:</strong>{' '}
                {ROVER_PERFORMANCE_INFO.triangleCount.toLocaleString()} triangles (
                {ROVER_PERFORMANCE_INFO.vertexCount.toLocaleString()} vertices)
              </li>
              <li>
                <strong>World Scale:</strong> {ROVER_PERFORMANCE_INFO.dimensions} (True 1:1 SI metric)
              </li>
              <li>
                <strong>Shadow Quality:</strong> 2048×2048 PCF filtered map with -0.0004 bias
              </li>
            </ul>
          </div>
        </div>

        <div className="nasa-modal-footer">
          <div className="nasa-footer-meta">
            <FileCode size={13} />
            <span>Telemetry validated against public/models/* manifests</span>
          </div>
          <button type="button" className="nasa-btn-primary" onClick={onClose}>
            <CheckCircle2 size={14} />
            <span>ACKNOWLEDGE REPORT</span>
          </button>
        </div>
      </div>
    </div>
  );
}
