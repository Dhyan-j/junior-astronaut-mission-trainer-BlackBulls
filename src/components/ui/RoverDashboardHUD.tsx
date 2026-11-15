import { useMemo } from 'react';
import type { RoverTelemetry, GeologicalSample } from '../../types/game';

interface RoverDashboardHUDProps {
  telemetry: RoverTelemetry | null;
  roverPosition?: [number, number, number];
  samples?: GeologicalSample[];
  onExitRover: () => void;
}

export function RoverDashboardHUD({
  telemetry,
  roverPosition,
  samples,
  onExitRover,
}: RoverDashboardHUDProps) {
  const speed = telemetry?.speed ?? 0;
  const speedKmh = telemetry?.speedKmh ?? 0;
  const battery = telemetry?.battery ?? 100;
  const totalDistance = telemetry?.totalDistance ?? 0;
  const heading = telemetry?.heading ?? 0;
  const driveMode = telemetry?.driveMode ?? 'PARK';

  // 1. Rover Geological Scanner (detects uncollected specimens within ~26 meters)
  const nearbyScannerSample = useMemo(() => {
    if (!roverPosition || !samples) return null;
    let closest: {
      sample: GeologicalSample;
      distance: number;
      relativeAngle: number;
      directionLabel: string;
    } | null = null;

    for (const s of samples) {
      if (s.collected) continue;
      const dx = s.position[0] - roverPosition[0];
      const dz = s.position[2] - roverPosition[2];
      const dist = Math.hypot(dx, dz);

      if (dist <= 26.0) {
        if (!closest || dist < closest.distance) {
          // In Three.js: +X is East (90 deg), -Z is North (0 deg), +Z is South (180 deg), -X is West (270 deg)
          const sampleAzimuthRad = Math.atan2(dx, -dz);
          let sampleAzimuthDeg = (sampleAzimuthRad * 180) / Math.PI;
          if (sampleAzimuthDeg < 0) sampleAzimuthDeg += 360;

          // Relative angle between rover heading and sample target (-180 to +180)
          const relAngle = ((sampleAzimuthDeg - heading) + 540) % 360 - 180;

          let directionLabel = 'AHEAD';
          if (Math.abs(relAngle) <= 18) {
            directionLabel = 'STRAIGHT AHEAD';
          } else if (relAngle > 18 && relAngle < 75) {
            directionLabel = `RIGHT (+${Math.round(relAngle)}°)`;
          } else if (relAngle >= 75 && relAngle <= 105) {
            directionLabel = 'HARD RIGHT (90°)';
          } else if (relAngle > 105 && relAngle < 165) {
            directionLabel = `REAR RIGHT (+${Math.round(relAngle)}°)`;
          } else if (relAngle < -18 && relAngle > -75) {
            directionLabel = `LEFT (${Math.round(relAngle)}°)`;
          } else if (relAngle <= -75 && relAngle >= -105) {
            directionLabel = 'HARD LEFT (-90°)';
          } else if (relAngle < -105 && relAngle > -165) {
            directionLabel = `REAR LEFT (${Math.round(relAngle)}°)`;
          } else {
            directionLabel = 'BEHIND';
          }

          closest = {
            sample: s,
            distance: dist,
            relativeAngle: Math.round(relAngle),
            directionLabel,
          };
        }
      }
    }
    return closest;
  }, [roverPosition, samples, heading]);

  const cardinal = heading >= 315 || heading < 45 ? 'N' : heading < 135 ? 'E' : heading < 225 ? 'S' : 'W';

  return (
    <div
      className="rover-dashboard-container"
      style={{
        position: 'absolute',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 24px)',
        maxWidth: 640,
        background: 'rgba(10, 15, 26, 0.82)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(56, 189, 248, 0.32)',
        borderRadius: 8,
        padding: '8px 14px',
        color: '#e2e8f0',
        fontFamily: 'monospace, sans-serif',
        boxShadow: '0 6px 24px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        zIndex: 100,
        pointerEvents: 'auto',
        userSelect: 'none',
      }}
    >
      {/* Top Banner: Vehicle Identity & Drive Mode */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
          paddingBottom: 4,
          marginBottom: 6,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              background: '#1d4ed8',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.65rem',
              letterSpacing: 1.2,
              padding: '1px 6px',
              borderRadius: 3,
            }}
          >
            NASA MMSEV
          </span>
          <span style={{ fontSize: '0.72rem', color: '#93c5fd', fontWeight: 600, letterSpacing: 0.8 }}>
            LUNAR EXPLORATION ROVER
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.66rem', color: '#94a3b8' }}>MODE:</span>
          <span
            style={{
              fontSize: '0.70rem',
              fontWeight: 800,
              padding: '1px 7px',
              borderRadius: 3,
              background: driveMode === 'BRAKE' ? '#dc2626' : driveMode === 'REVERSE' ? '#d97706' : '#16a34a',
              color: '#ffffff',
              letterSpacing: 1,
            }}
          >
            {driveMode}
          </span>
        </div>
      </div>

      {/* Geological Rover Scanner Contact Strip (Active within 26m) */}
      {nearbyScannerSample && (
        <div
          className="rover-scanner-notification"
          style={{
            background: 'linear-gradient(90deg, rgba(8, 47, 73, 0.92) 0%, rgba(12, 74, 110, 0.92) 100%)',
            border: '1px solid #38bdf8',
            boxShadow: '0 0 12px rgba(56, 189, 248, 0.25)',
            borderRadius: 6,
            padding: '4px 10px',
            marginBottom: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontFamily: 'monospace, sans-serif',
            fontSize: '0.72rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1rem', filter: 'drop-shadow(0 0 3px #38bdf8)' }}>📡</span>
            <div>
              <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#38bdf8', letterSpacing: 0.8, marginRight: 6 }}>
                SPECIMEN CONTACT:
              </span>
              <strong style={{ color: '#ffffff', fontSize: '0.78rem' }}>
                {nearbyScannerSample.sample.name}
              </strong>{' '}
              <span style={{ color: '#93c5fd', fontSize: '0.68rem' }}>
                ({nearbyScannerSample.sample.rockType})
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div>
              <span style={{ fontSize: '0.60rem', color: '#94a3b8', marginRight: 4 }}>RANGE:</span>
              <strong style={{ fontSize: '0.82rem', color: '#facc15' }}>
                {nearbyScannerSample.distance.toFixed(1)}m
              </strong>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: 'rgba(15, 23, 42, 0.85)',
                padding: '2px 7px',
                borderRadius: 4,
                border: '1px solid rgba(56, 189, 248, 0.35)',
              }}
            >
              <span
                className="rover-scanner-arrow"
                style={{
                  transform: `rotate(${nearbyScannerSample.relativeAngle}deg)`,
                  transition: 'transform 0.15s ease-out',
                  fontSize: '0.75rem',
                  color: '#38bdf8',
                  lineHeight: 1,
                  display: 'inline-block',
                }}
              >
                ▲
              </span>
              <span className="rover-scanner-direction" style={{ fontSize: '0.68rem', fontWeight: 700, color: '#e2e8f0' }}>
                {nearbyScannerSample.directionLabel}
              </span>
            </div>

            <span style={{ fontSize: '0.62rem', color: '#86efac', fontWeight: 600 }}>
              [PARK &amp; DISEMBARK]
            </span>
          </div>
        </div>
      )}

      {/* Main Telemetry Gauges Grid (Compact Horizontal Strip) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 8,
          alignItems: 'stretch',
        }}
      >
        {/* Gauge 1: Velocity */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.60)',
            padding: '6px 10px',
            borderRadius: 6,
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ fontSize: '0.60rem', color: '#94a3b8', letterSpacing: 0.8, textTransform: 'uppercase' }}>
            Velocity
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 1 }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8', lineHeight: 1.1 }}>
              {speedKmh.toFixed(1)}
            </span>
            <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>km/h</span>
          </div>
          <div style={{ fontSize: '0.62rem', color: '#64748b', marginTop: 2 }}>
            {speed.toFixed(1)} m/s
          </div>
        </div>

        {/* Gauge 2: Battery Telemetry */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.60)',
            padding: '6px 10px',
            borderRadius: 6,
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ fontSize: '0.60rem', color: '#94a3b8', letterSpacing: 0.8, textTransform: 'uppercase' }}>
            Battery Pack
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 1 }}>
            <span
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: battery > 25 ? '#4ade80' : '#f87171',
                lineHeight: 1.1,
              }}
            >
              {Math.round(battery)}%
            </span>
            <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Li-Ion</span>
          </div>
          {/* Compact Battery Bar */}
          <div
            style={{
              width: '100%',
              height: 3,
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
              marginTop: 4,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.min(100, Math.max(0, battery))}%`,
                height: '100%',
                background: battery > 25 ? '#22c55e' : '#ef4444',
                borderRadius: 2,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* Gauge 3: Odometer / Total Distance */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.60)',
            padding: '6px 10px',
            borderRadius: 6,
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ fontSize: '0.60rem', color: '#94a3b8', letterSpacing: 0.8, textTransform: 'uppercase' }}>
            Distance
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 1 }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#facc15', lineHeight: 1.1 }}>
              {totalDistance >= 1000 ? (totalDistance / 1000).toFixed(2) : Math.round(totalDistance)}
            </span>
            <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
              {totalDistance >= 1000 ? 'km' : 'm'}
            </span>
          </div>
          <div style={{ fontSize: '0.62rem', color: '#64748b', marginTop: 2 }}>
            Traverse
          </div>
        </div>

        {/* Gauge 4: Heading & Compass */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.60)',
            padding: '6px 10px',
            borderRadius: 6,
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ fontSize: '0.60rem', color: '#94a3b8', letterSpacing: 0.8, textTransform: 'uppercase' }}>
            Compass
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 1 }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#e2e8f0', lineHeight: 1.1 }}>
              {heading}°
            </span>
            <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 700 }}>
              {cardinal}
            </span>
          </div>
          <div style={{ fontSize: '0.62rem', color: '#64748b', marginTop: 2 }}>
            Gyro Lock
          </div>
        </div>
      </div>

      {/* Bottom Controls Bar & Exit Button */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 6,
          paddingTop: 5,
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: '0.68rem',
          color: '#94a3b8',
          flexWrap: 'wrap',
          gap: 6,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span><strong style={{ color: '#e2e8f0' }}>W/S</strong> Drive</span>
          <span>|</span>
          <span><strong style={{ color: '#e2e8f0' }}>A/D</strong> Steer</span>
          <span>|</span>
          <span><strong style={{ color: '#e2e8f0' }}>SHIFT</strong> Boost</span>
          <span>|</span>
          <span><strong style={{ color: '#e2e8f0' }}>SPACE</strong> Brake</span>
        </div>

        <button
          onClick={onExitRover}
          style={{
            background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
            border: 'none',
            borderRadius: 4,
            color: '#ffffff',
            padding: '3px 8px',
            fontSize: '0.68rem',
            fontWeight: 700,
            cursor: 'pointer',
            letterSpacing: 0.6,
            boxShadow: '0 1px 4px rgba(194, 65, 12, 0.4)',
          }}
        >
          [E] DISEMBARK
        </button>
      </div>
    </div>
  );
}
