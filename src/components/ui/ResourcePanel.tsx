import { useState, useEffect } from 'react';
import { Wind, Zap, Droplets, Activity, Gauge } from 'lucide-react';
import type { SimulatedTelemetry } from '../../types/mission';

export function ResourcePanel() {
  const [telemetry, setTelemetry] = useState<SimulatedTelemetry>({
    oxygenPercent: 98.4,
    oxygenPressureKPa: 21.3,
    powerOutputKW: 87.6,
    batteryReservePercent: 96.2,
    waterReservePercent: 94.1,
    waterReserveLiters: 482,
    habitatPressureKPa: 101.3,
    cabinTempCelsius: 21.5,
    surfaceTempCelsius: -130.4,
    radiationUSvH: 0.38,
    isSimulated: true,
  });

  // Subtle telemetry jitter to simulate real-time sensor feedback
  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetry((prev) => ({
        ...prev,
        oxygenPercent: Number((98.2 + Math.random() * 0.4).toFixed(1)),
        powerOutputKW: Number((87.2 + Math.random() * 0.9).toFixed(1)),
        batteryReservePercent: Number((96.0 + Math.random() * 0.4).toFixed(1)),
        waterReservePercent: Number((94.0 + Math.random() * 0.3).toFixed(1)),
        habitatPressureKPa: Number((101.2 + Math.random() * 0.2).toFixed(1)),
      }));
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="nasa-panel nasa-resource-panel">
      <div className="nasa-panel-header">
        <div className="nasa-panel-title">
          <Activity size={14} className="nasa-icon-amber" />
          <span>LIFE SUPPORT & RESOURCES</span>
        </div>
        <span className="nasa-badge-simulated">SIMULATED VALUES</span>
      </div>

      <div className="nasa-resource-grid">
        {/* Oxygen System */}
        <div className="nasa-resource-card">
          <div className="nasa-resource-label">
            <Wind size={13} className="nasa-icon-cyan" />
            <span>OXYGEN (O₂)</span>
            <span className="nasa-tag-sim">SIM</span>
          </div>
          <div className="nasa-resource-val-row">
            <span className="nasa-resource-value">{telemetry.oxygenPercent}%</span>
            <span className="nasa-resource-sub">{telemetry.oxygenPressureKPa} kPa</span>
          </div>
          <div className="nasa-meter-bg">
            <div
              className="nasa-meter-fill cyan"
              style={{ width: `${telemetry.oxygenPercent}%` }}
            />
          </div>
        </div>

        {/* Electrical Power Grid */}
        <div className="nasa-resource-card">
          <div className="nasa-resource-label">
            <Zap size={13} className="nasa-icon-amber" />
            <span>POWER GRID</span>
            <span className="nasa-tag-sim">SIM</span>
          </div>
          <div className="nasa-resource-val-row">
            <span className="nasa-resource-value">{telemetry.powerOutputKW} kW</span>
            <span className="nasa-resource-sub">BAT {telemetry.batteryReservePercent}%</span>
          </div>
          <div className="nasa-meter-bg">
            <div
              className="nasa-meter-fill amber"
              style={{ width: `${(telemetry.powerOutputKW / 100) * 100}%` }}
            />
          </div>
        </div>

        {/* Water Reserves */}
        <div className="nasa-resource-card">
          <div className="nasa-resource-label">
            <Droplets size={13} className="nasa-icon-blue" />
            <span>WATER (H₂O)</span>
            <span className="nasa-tag-sim">SIM</span>
          </div>
          <div className="nasa-resource-val-row">
            <span className="nasa-resource-value">{telemetry.waterReservePercent}%</span>
            <span className="nasa-resource-sub">{telemetry.waterReserveLiters} L</span>
          </div>
          <div className="nasa-meter-bg">
            <div
              className="nasa-meter-fill blue"
              style={{ width: `${telemetry.waterReservePercent}%` }}
            />
          </div>
        </div>

        {/* Habitat Pressure & Cabin Temp */}
        <div className="nasa-resource-card">
          <div className="nasa-resource-label">
            <Gauge size={13} className="nasa-icon-silver" />
            <span>HAB PRESSURE</span>
            <span className="nasa-tag-sim">SIM</span>
          </div>
          <div className="nasa-resource-val-row">
            <span className="nasa-resource-value">{telemetry.habitatPressureKPa} kPa</span>
            <span className="nasa-resource-sub">{telemetry.cabinTempCelsius}°C</span>
          </div>
          <div className="nasa-meter-bg">
            <div className="nasa-meter-fill silver" style={{ width: `98%` }} />
          </div>
        </div>
      </div>

      <div className="nasa-panel-footer">
        <span className="nasa-footer-alert">&bull; CLOSED-LOOP ECLSS NOMINAL</span>
        <span className="nasa-footer-note">All training values computed virtually</span>
      </div>
    </div>
  );
}

