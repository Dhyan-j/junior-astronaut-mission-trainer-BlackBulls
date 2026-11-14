import { useState } from 'react';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Crosshair } from 'lucide-react';
import { playClickBeep } from '../../utils/sound';
import type { MissionObjective } from '../../types/game';

interface TrackerProps {
  objectives: MissionObjective[];
  currentStepIndex: number;
}

export function ObjectiveTrackerPanel({ objectives, currentStepIndex }: TrackerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const completedCount = objectives.filter((o) => o.completed).length;
  const currentObj = objectives[currentStepIndex] || objectives[objectives.length - 1];

  return (
    <div className="nasa-panel nasa-objective-panel">
      <div
        className="nasa-objective-header"
        onClick={() => {
          playClickBeep();
          setIsExpanded(!isExpanded);
        }}
      >
        <div className="nasa-obj-title-row">
          <Crosshair size={14} className="nasa-icon-amber" />
          <span className="nasa-obj-title">MISSION OBJECTIVES</span>
          <span className="nasa-obj-count">
            {completedCount}/{objectives.length}
          </span>
        </div>
        <button
          type="button"
          className="nasa-btn-icon-subtle"
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Primary Active Objective Highlight */}
      <div className="nasa-active-obj-card">
        <div className="nasa-active-obj-badge">
          CURRENT TASK (STEP {currentObj.stepNumber} OF {objectives.length})
        </div>
        <div className="nasa-active-obj-title">{currentObj.title}</div>
        <div className="nasa-active-obj-desc">{currentObj.shortDescription}</div>
        <div className="nasa-active-obj-target">
          <span>Target:</span> <strong>{currentObj.targetStation}</strong>
        </div>
      </div>

      {/* Expanded Full Checklist */}
      {isExpanded && (
        <div className="nasa-obj-checklist">
          {objectives.map((obj, idx) => {
            const isDone = obj.completed;
            const isCurrent = idx === currentStepIndex;

            return (
              <div
                key={obj.id}
                className={`nasa-checklist-row ${isDone ? 'done' : ''} ${
                  isCurrent ? 'current' : ''
                }`}
              >
                {isDone ? (
                  <CheckCircle2 size={13} className="nasa-icon-green" />
                ) : (
                  <Circle size={13} className={isCurrent ? 'nasa-icon-amber' : 'nasa-icon-muted'} />
                )}
                <span className="nasa-checklist-text">
                  <span className="step-num">{obj.stepNumber}.</span> {obj.title}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

