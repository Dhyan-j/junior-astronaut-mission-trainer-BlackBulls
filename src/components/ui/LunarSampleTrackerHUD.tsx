import React from 'react';
import type { GeologicalSample } from '../../types/game';

interface LunarSampleTrackerHUDProps {
  samples: GeologicalSample[];
  playerPosition: [number, number, number];
  justCollectedSampleName?: string | null;
}

export const LunarSampleTrackerHUD: React.FC<LunarSampleTrackerHUDProps> = ({
  samples,
  playerPosition,
  justCollectedSampleName,
}) => {
  const collectedCount = samples.filter((s) => s.collected).length;
  const totalCount = samples.length;
  const isComplete = collectedCount === totalCount;

  // Next target is the first uncollected sample
  const nextTarget = samples.find((s) => !s.collected) || null;

  let liveDistance: number | null = null;
  if (nextTarget && playerPosition) {
    const dx = nextTarget.position[0] - playerPosition[0];
    const dz = nextTarget.position[2] - playerPosition[2];
    liveDistance = Math.hypot(dx, dz);
  }

  return (
    <div
      className="lunar-sample-tracker-card"
      style={{
        position: 'fixed',
        top: '74px',
        left: '20px',
        zIndex: 80,
        background: 'rgba(10, 15, 26, 0.90)',
        backdropFilter: 'blur(10px)',
        border: isComplete ? '1px solid #22c55e' : '1px solid rgba(56, 189, 248, 0.45)',
        boxShadow: isComplete
          ? '0 4px 20px rgba(34, 197, 94, 0.25)'
          : '0 4px 20px rgba(0, 0, 0, 0.65)',
        borderRadius: '8px',
        padding: '10px 14px',
        fontFamily: "'Share Tech Mono', monospace, sans-serif",
        color: '#f8fafc',
        width: '280px',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      {/* Tracker Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '9.5px', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase' }}>
          GEOLOGICAL EXPEDITION
        </div>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 800,
            color: isComplete ? '#4ade80' : '#38bdf8',
            letterSpacing: '0.8px',
          }}
        >
          SAMPLES: {collectedCount}/{totalCount}
        </div>
      </div>

      {/* Progress Pip Row */}
      <div style={{ display: 'flex', gap: '4px', margin: '6px 0 8px 0' }}>
        {samples.map((s, idx) => (
          <div
            key={s.id || idx}
            style={{
              flex: 1,
              height: '4px',
              borderRadius: '2px',
              background: s.collected ? '#22c55e' : 'rgba(255, 255, 255, 0.15)',
              boxShadow: s.collected ? '0 0 6px rgba(34, 197, 94, 0.6)' : 'none',
              transition: 'background 0.3s ease',
            }}
          />
        ))}
      </div>

      {/* Target & Distance Readout */}
      {nextTarget ? (
        <div style={{ fontSize: '11px', lineHeight: 1.35 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8' }}>NEXT TARGET:</span>
            <strong style={{ color: '#ffffff' }}>{nextTarget.name}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
            <span style={{ color: '#94a3b8' }}>DISTANCE:</span>
            <span style={{ color: '#facc15', fontWeight: 700 }}>
              {liveDistance !== null ? `${liveDistance.toFixed(1)} m` : '--'}
            </span>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: '11px', color: '#4ade80', fontWeight: 700, textAlign: 'center', padding: '2px 0' }}>
          ✓ ALL 4 SPECIMENS SECURED IN ROVER
        </div>
      )}

      {/* Clean Green Confirmation Toast when a sample is collected */}
      {justCollectedSampleName && (
        <div
          className="sample-collected-toast"
          style={{
            marginTop: '8px',
            padding: '5px 8px',
            background: 'rgba(34, 197, 94, 0.2)',
            border: '1px solid #22c55e',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 700,
            color: '#4ade80',
            textAlign: 'center',
            animation: 'fadeInOut 4s ease forwards',
          }}
        >
          ✓ {justCollectedSampleName.toUpperCase()} SECURED
        </div>
      )}
    </div>
  );
};
