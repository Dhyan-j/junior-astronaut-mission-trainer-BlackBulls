import { useEffect } from 'react';
import type { GeologicalSample } from '../../types/game';

interface SampleInspectionModalProps {
  sample: GeologicalSample;
  onCollect: (sampleId: string) => void;
  onClose: () => void;
}

export function SampleInspectionModal({
  sample,
  onCollect,
  onClose,
}: SampleInspectionModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        onClose();
      } else if (e.code === 'KeyE' && !sample.collected) {
        onCollect(sample.id);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sample, onCollect, onClose]);

  return (
    <div
      className="nasa-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 8, 15, 0.82)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        className="nasa-modal-card"
        style={{
          width: '100%',
          maxWidth: 620,
          background: 'linear-gradient(180deg, rgba(17, 24, 39, 0.96) 0%, rgba(11, 15, 25, 0.98) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.5)',
          borderRadius: 12,
          padding: 28,
          color: '#f1f5f9',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.2)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ background: '#0284c7', color: '#ffffff', fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: 4, letterSpacing: 1 }}>
                NASA LUNAR SAMPLE RETURN
              </span>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                SPECIMEN ID: {sample.id.toUpperCase()}
              </span>
            </div>
            <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 700, color: '#f8fafc' }}>
              {sample.name}
            </h2>
            <div style={{ fontSize: '0.85rem', color: '#38bdf8', marginTop: 2 }}>
              {sample.scientificName}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '1.4rem',
              cursor: 'pointer',
              padding: '0 4px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Specimen Key Meta Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, margin: '18px 0', fontFamily: 'monospace' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '8px 12px', borderRadius: 6, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>ROCK CLASS</div>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#e2e8f0', marginTop: 2 }}>{sample.rockType}</div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '8px 12px', borderRadius: 6, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>SAMPLE MASS</div>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#facc15', marginTop: 2 }}>{sample.massGrams.toFixed(1)} g</div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '8px 12px', borderRadius: 6, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>GEOLOGICAL ERA</div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#4ade80', marginTop: 3 }}>{sample.era}</div>
          </div>
        </div>

        {/* Description */}
        <div style={{ fontSize: '0.88rem', lineHeight: 1.55, color: '#cbd5e1', marginBottom: 14 }}>
          {sample.description}
        </div>

        {/* Scientific Significance Alert */}
        <div style={{ background: 'rgba(30, 58, 138, 0.35)', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Scientific Value
          </div>
          <div style={{ fontSize: '0.82rem', color: '#e2e8f0', marginTop: 4 }}>
            {sample.significance}
          </div>
        </div>

        {/* Mineral Composition Breakdown */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
            Assayed Mineral Composition
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {sample.composition.map((item) => (
              <div key={item.mineral}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: 2, fontFamily: 'monospace' }}>
                  <span>{item.mineral}</span>
                  <span style={{ fontWeight: 700, color: '#38bdf8' }}>{item.percentage}%</span>
                </div>
                <div style={{ width: '100%', height: 5, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${item.percentage}%`, height: '100%', background: '#38bdf8', borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: 16 }}>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 6,
              color: '#94a3b8',
              padding: '8px 18px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            CLOSE
          </button>

          {!sample.collected ? (
            <button
              onClick={() => onCollect(sample.id)}
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                border: 'none',
                borderRadius: 6,
                color: '#ffffff',
                padding: '8px 22px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: 0.8,
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.45)',
              }}
            >
              [E] COLLECT & STORE IN ROVER
            </button>
          ) : (
            <button
              disabled
              style={{
                background: 'rgba(34, 197, 94, 0.2)',
                border: '1px solid #22c55e',
                borderRadius: 6,
                color: '#4ade80',
                padding: '8px 22px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'default',
              }}
            >
              ✓ STORED IN ROVER INVENTORY
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
