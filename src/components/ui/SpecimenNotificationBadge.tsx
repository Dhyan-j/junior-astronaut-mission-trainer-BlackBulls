import React from 'react';
import type { GeologicalSample } from '../../types/game';

interface SpecimenNotificationBadgeProps {
  sample: GeologicalSample | null;
  onInspect: (sample: GeologicalSample) => void;
}

export const SpecimenNotificationBadge: React.FC<SpecimenNotificationBadgeProps> = ({
  sample,
  onInspect,
}) => {
  if (!sample) return null;

  return (
    <div
      className="specimen-notification-badge"
      onClick={() => onInspect(sample)}
      style={{
        position: 'fixed',
        bottom: '96px',
        right: '24px',
        zIndex: 85,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 16px',
        background: 'rgba(10, 15, 26, 0.92)',
        border: sample.collected ? '1px solid #22c55e' : '1px solid #38bdf8',
        boxShadow: sample.collected
          ? '0 0 16px rgba(34, 197, 94, 0.35), 0 8px 24px rgba(0, 0, 0, 0.65)'
          : '0 0 16px rgba(56, 189, 248, 0.35), 0 8px 24px rgba(0, 0, 0, 0.65)',
        borderRadius: '8px',
        backdropFilter: 'blur(10px)',
        cursor: 'pointer',
        maxWidth: '340px',
        fontFamily: "'Share Tech Mono', monospace, sans-serif",
        color: '#f8fafc',
        transition: 'all 0.25s ease-in-out',
        animation: 'slideInBadge 0.3s ease-out',
      }}
    >
      <style>{`
        @keyframes slideInBadge {
          from {
            opacity: 0;
            transform: translateY(14px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes greenPulseBadge {
          0%, 100% {
            box-shadow: 0 0 12px rgba(34, 197, 94, 0.4);
          }
          50% {
            box-shadow: 0 0 22px rgba(34, 197, 94, 0.8);
          }
        }
        .specimen-notification-badge.is-collected {
          animation: greenPulseBadge 2.2s infinite ease-in-out;
        }
        .specimen-notification-badge:hover {
          transform: translateY(-2px);
          filter: brightness(1.08);
        }
      `}</style>

      {/* Mineral Specimen Icon / Chip */}
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '6px',
          background: sample.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 0 10px ${sample.color}88`,
          flexShrink: 0,
          border: '1px solid rgba(255, 255, 255, 0.3)',
        }}
      >
        <span style={{ fontSize: '18px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }}>
          {sample.collected ? '✓' : '💎'}
        </span>
      </div>

      {/* Specimen Details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '9.5px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: sample.collected ? '#4ade80' : '#38bdf8',
            fontWeight: 700,
          }}
        >
          {sample.collected ? 'GEOLOGICAL SAMPLE SECURED' : 'PROXIMITY: LUNAR SPECIMEN'}
        </div>
        <div
          style={{
            fontSize: '12.5px',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: '#ffffff',
            marginTop: '2px',
          }}
        >
          {sample.name}
        </div>
        <div
          style={{
            fontSize: '10px',
            color: '#94a3b8',
            marginTop: '1px',
          }}
        >
          {sample.rockType} • {sample.massGrams >= 1000 ? `${(sample.massGrams / 1000).toFixed(2)} kg` : `${sample.massGrams} g`}
        </div>
      </div>

      {/* Action / Status Pill */}
      <div
        style={{
          background: sample.collected ? 'rgba(34, 197, 94, 0.2)' : 'rgba(56, 189, 248, 0.2)',
          border: sample.collected ? '1px solid #22c55e' : '1px solid #38bdf8',
          color: sample.collected ? '#4ade80' : '#38bdf8',
          borderRadius: '4px',
          padding: '4px 8px',
          fontSize: '10.5px',
          fontWeight: 700,
          letterSpacing: '0.8px',
          flexShrink: 0,
        }}
      >
        {sample.collected ? 'STORED' : '[E] INSPECT'}
      </div>
    </div>
  );
};
