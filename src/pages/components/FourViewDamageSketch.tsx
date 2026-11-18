import { useCallback, useEffect, useRef, useState } from 'react';
import { HiAceViewportEngine } from '@/scene/HiAceViewportEngine';
import { HiAceSceneState, CameraViewId } from '@/types/hiace';

type DamageMark = {
  id: string;
  view: 'front' | 'rear' | 'left' | 'right';
  x: number; // 0-1 normalized within the view canvas
  y: number; // 0-1 normalized within the view canvas
};

type ViewKey = 'front' | 'rear' | 'left' | 'right';

const VIEW_CONFIG: Record<ViewKey, { label: string }> = {
  front: { label: 'FRONT VIEW' },
  rear: { label: 'REAR VIEW' },
  left: { label: 'LEFT-SIDE VIEW' },
  right: { label: 'RIGHT-SIDE VIEW' },
};

const MARK_COLOR = '#ef4444';

interface FourViewDamageSketchProps {
  initialMarks?: DamageMark[];
  onMarksChange?: (marks: DamageMark[]) => void;
  vehiclePlate?: string;
  vehicleModel?: string;
}

export default function FourViewDamageSketch({
  initialMarks = [],
  onMarksChange,
  vehiclePlate = 'NCR 7218',
  vehicleModel = 'Toyota HiAce Commuter Deluxe',
}: FourViewDamageSketchProps) {
  const [damageMarks, setDamageMarks] = useState<DamageMark[]>(initialMarks);
  const [selectedView, setSelectedView] = useState<ViewKey>('front');
  const [azimuthDeg, setAzimuthDeg] = useState(0);
  const [is360, setIs360] = useState(false);
  const [printMode, setPrintMode] = useState(false);
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<HiAceViewportEngine | null>(null);

  const INITIAL_STATE: HiAceSceneState = {
    layoutMode: 'single',
    activeSingleView: 'front',
    paintId: 'solid-white',
    trimSpec: 'cargo-dx',
    renderStyle: 'pbr',
    studioEnv: 'daylight',
    slidingDoorOpen: false,
    tailgateOpen: false,
    wheelSteerAngled: false,
    lightsOn: false,
    autoSpin: false,
    showDimensions: false,
  };

  // Initialize Three.js engine — no auto-spin, user controls orbit manually
  useEffect(() => {
    const mountEl = canvasMountRef.current;
    if (!mountEl) return;

    let engine: HiAceViewportEngine | null = null;
    try {
      engine = new HiAceViewportEngine(mountEl, INITIAL_STATE, {
        onPartClick: () => {},
        onPartHover: () => {},
        onAzimuthChange: (deg) => setAzimuthDeg(deg),
        onContextLost: () => {},
      });
      engineRef.current = engine;
    } catch {
      // WebGL unavailable — 3D viewer will be blank, 2D sketch still works
    }

    return () => {
      engine?.dispose();
      engineRef.current = null;
    };
  }, []);

  // Sync engine state — never auto-rotate; user drives the camera
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    const nextState: HiAceSceneState = {
      ...INITIAL_STATE,
      layoutMode: is360 ? '360' : 'single',
      activeSingleView: selectedView,
      autoSpin: false, // always false — user controls rotation
    };
    engineRef.current?.updateState(nextState);
  }, [selectedView, is360]);

  // Determine which orthographic view a click belongs to based on current azimuth
  const getViewFromAzimuth = useCallback((deg: number): ViewKey => {
    // Normalize to 0-360
    let a = ((deg % 360) + 360) % 360;

    // Front: ~345°-15°  |  Rear: ~165°-195°  |  Right: ~255°-285°  |  Left: ~75°-105°
    if (a >= 345 || a < 15) return 'front';
    if (a >= 165 && a <= 195) return 'rear';
    if (a >= 75 && a <= 105) return 'left';
    if (a >= 255 && a <= 285) return 'right';
    // Fallback: closest cardinal direction
    if (a > 15 && a < 75) return 'front';
    if (a > 105 && a < 165) return 'left';
    if (a > 195 && a < 255) return 'rear';
    return 'right';
  }, []);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = overlayRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      const view = getViewFromAzimuth(azimuthDeg);

      const newMark: DamageMark = {
        id: crypto.randomUUID(),
        view,
        x: Math.max(0, Math.min(1, x)),
        y: Math.max(0, Math.min(1, y)),
      };

      setDamageMarks((prev) => [...prev, newMark]);
      onMarksChange?.([...damageMarks, newMark]);
    },
    [azimuthDeg, getViewFromAzimuth, damageMarks, onMarksChange]
  );

  const removeMark = useCallback((id: string) => {
    setDamageMarks((prev) => {
      const next = prev.filter((m) => m.id !== id);
      onMarksChange?.(next);
      return next;
    });
  }, [onMarksChange]);

  const clearAllMarks = useCallback(() => {
    setDamageMarks([]);
    onMarksChange?.([]);
  }, [onMarksChange]);

  const marksForView = useCallback(
    (view: ViewKey) => damageMarks.filter((m) => m.view === view),
    [damageMarks]
  );

  const handlePrint = useCallback(() => {
    setPrintMode(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.print();
        setPrintMode(false);
      });
    });
  }, []);

  // ---- Print view: project damage marks onto four orthographic canvases ----
  useEffect(() => {
    if (!printMode) return;

    const drawMarks = (canvasId: string, view: ViewKey) => {
      const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      const marks = marksForView(view);

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = MARK_COLOR;
      ctx.lineWidth = 3;

      for (const m of marks) {
        const cx = m.x * w;
        const cy = m.y * h;
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    drawMarks('print-front', 'front');
    drawMarks('print-rear', 'rear');
    drawMarks('print-left', 'left');
    drawMarks('print-right', 'right');
  }, [printMode, marksForView]);

  if (printMode) {
    return (
      <div className="four-view-print" style={{ padding: '20px', background: '#ffffff' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px', borderBottom: '2px solid #11151b', paddingBottom: '16px' }}>
          <div style={{ fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: '#666', marginBottom: '8px' }}>
            PANELCO III · VehicleHub
          </div>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#11151b' }}>Four-View Vehicle Sketch</h1>
          <p style={{ margin: '4px 0 0', color: '#666', fontSize: '13px' }}>
            Vehicle: {vehicleModel} · Plate: {vehiclePlate} · Damage Inspection Record
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          <div style={{ pageBreakInside: 'avoid' }}>
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <strong style={{ fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase' }}>{VIEW_CONFIG.front.label}</strong>
            </div>
            <div
              style={{
                width: '100%',
                aspectRatio: '4 / 3',
                border: '2px solid #11151b',
                background: '#f5f6f3',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <canvas id="print-front" style={{ width: '100%', height: '100%', display: 'block' }} />
            </div>
          </div>
          <div style={{ pageBreakInside: 'avoid' }}>
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <strong style={{ fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase' }}>{VIEW_CONFIG.rear.label}</strong>
            </div>
            <div
              style={{
                width: '100%',
                aspectRatio: '4 / 3',
                border: '2px solid #11151b',
                background: '#f5f6f3',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <canvas id="print-rear" style={{ width: '100%', height: '100%', display: 'block' }} />
            </div>
          </div>
          <div style={{ pageBreakInside: 'avoid' }}>
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <strong style={{ fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase' }}>{VIEW_CONFIG.left.label}</strong>
            </div>
            <div
              style={{
                width: '100%',
                aspectRatio: '4 / 3',
                border: '2px solid #11151b',
                background: '#f5f6f3',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <canvas id="print-left" style={{ width: '100%', height: '100%', display: 'block' }} />
            </div>
          </div>
          <div style={{ pageBreakInside: 'avoid' }}>
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <strong style={{ fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase' }}>{VIEW_CONFIG.right.label}</strong>
            </div>
            <div
              style={{
                width: '100%',
                aspectRatio: '4 / 3',
                border: '2px solid #11151b',
                background: '#f5f6f3',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <canvas id="print-right" style={{ width: '100%', height: '100%', display: 'block' }} />
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #ccc', marginTop: '24px', paddingTop: '16px', fontSize: '10px', color: '#666' }}>
          <p>Damage Legend: ● Damage mark</p>
          <p>Total damage marks recorded: {damageMarks.length}</p>
          <p>Inspector: ____________________ &nbsp;|&nbsp; Date: ____________________</p>
        </div>

        <style>{`
          @media print {
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .four-view-print { width: 100%; }
            button, .no-print { display: none !important; }
          }
        `}</style>
      </div>
    );
  }

  // ---- Edit mode: 3D inspection + four-view sketch panels ----
  return (
    <div className="four-view-damage-sketch" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', color: '#11151b' }}>Vehicle Damage Inspection</h3>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#666' }}>
            {vehicleModel} · Plate: {vehiclePlate} — Inspect the 360° view, click to mark damage
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={clearAllMarks}
            disabled={damageMarks.length === 0}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              background: damageMarks.length === 0 ? '#e5e7eb' : '#fca5a5',
              color: damageMarks.length === 0 ? '#9ca3af' : '#991b1b',
              border: 'none',
              borderRadius: '6px',
              cursor: damageMarks.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            Clear All Marks
          </button>
          <button
            onClick={handlePrint}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              background: '#176B3A',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Print Four Views
          </button>
        </div>
      </div>

      {/* 3D Inspection Viewer (360° — user-controlled, no auto-spin) */}
      <div style={{ border: '1px solid #e1e6e1', borderRadius: '12px', overflow: 'hidden', background: '#11151b' }}>
        <div
          ref={canvasMountRef}
          style={{ width: '100%', height: '340px', minHeight: 0, position: 'relative' }}
        >
          {/* Click overlay — captures clicks on the 360° view to place damage markers */}
          <div
            ref={overlayRef}
            onClick={handleOverlayClick}
            style={{
              position: 'absolute',
              inset: 0,
              cursor: 'crosshair',
              zIndex: 5,
              background: 'transparent',
            }}
          />
        </div>
        <div style={{ padding: '10px', background: '#0e1218', borderTop: '1px solid #1a1f24', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
          <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            360° Three-D Inspection · Click to mark damage
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setIs360(false)}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                background: !is360 ? '#176B3A' : '#161b24',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Single View
            </button>
            <button
              onClick={() => setIs360(true)}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                background: is360 ? '#176B3A' : '#161b24',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              360° View
            </button>
            <button
              onClick={() => {
                const engine = engineRef.current;
                engine?.updateState({ ...INITIAL_STATE, autoSpin: false, slidingDoorOpen: false, tailgateOpen: false });
              }}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                background: '#161b24',
                color: '#9ca3af',
                border: '1px solid #2a2e33',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Reset
            </button>
          </div>
          <div style={{ fontSize: '11px', color: '#666', fontFamily: 'monospace' }}>
            Azimuth: {Math.round(azimuthDeg)}°
          </div>
        </div>
      </div>

      {/* Four-View Sketch Grid — marks appear here based on view assigned during 3D click */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
        {['front', 'rear', 'left', 'right'].map((viewKey) => {
          const view = viewKey as ViewKey;
          const config = VIEW_CONFIG[view];
          const marks = marksForView(view);
          const isActive = selectedView === view;

          return (
            <div
              key={viewKey}
              style={{
                border: `2px solid ${isActive ? '#176B3A' : '#e1e6e1'}`,
                borderRadius: '10px',
                overflow: 'hidden',
                background: '#ffffff',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f5f6f3', borderBottom: '1px solid #e1e6e1' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#11151b' }}>{config.label}</span>
                <button
                  onClick={() => setSelectedView(view)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '10px',
                    background: isActive ? '#176B3A' : '#ffffff',
                    color: isActive ? '#ffffff' : '#666',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  {isActive ? 'Active' : 'Select'}
                </button>
              </div>

              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '4 / 3',
                  background: '#f8faf9',
                }}
              >
                {/* Car silhouette */}
                <svg
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '70%',
                    height: '70%',
                    display: 'block',
                    pointerEvents: 'none',
                  }}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#9ca3af"
                  strokeWidth="1.5"
                >
                  <path d="M2 4h20v14H2z" />
                  <path d="M4 4h16v2H4z" />
                  <path d="M3 18h18v-2H3z" />
                  <circle cx="6" cy="16" r="1.5" stroke="#6b7280" strokeWidth="1" fill="none" />
                  <circle cx="18" cy="16" r="1.5" stroke="#6b7280" strokeWidth="1" fill="none" />
                </svg>

                {/* Damage markers — simple circles, no center dot */}
                {marks.map((mark) => (
                  <div
                    key={mark.id}
                    style={{
                      position: 'absolute',
                      left: `${mark.x * 100}%`,
                      top: `${mark.y * 100}%`,
                      transform: 'translate(-50%, -50%)',
                      width: '22px',
                      height: '22px',
                      pointerEvents: 'none',
                      zIndex: 10,
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="22" height="22" style={{ display: 'block' }}>
                      <circle cx="12" cy="12" r="9" fill="none" stroke={MARK_COLOR} strokeWidth="2.5" />
                    </svg>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeMark(mark.id);
                      }}
                      style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-6px',
                        width: '16px',
                        height: '16px',
                        background: '#dc2626',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '50%',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        lineHeight: '1',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                      }}
                      title="Remove damage mark"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f5f6f3', borderTop: '1px solid #e1e6e1' }}>
                <span style={{ fontSize: '11px', color: '#666' }}>
                  {marks.length} mark{marks.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Damage summary */}
      {damageMarks.length > 0 && (
        <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '12px' }}>
          <div style={{ fontWeight: 600, color: '#991b1b', marginBottom: '6px' }}>{damageMarks.length} Damage Mark{damageMarks.length !== 1 ? 's' : ''} Recorded</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {marksForView('front').map((m) => (
              <span
                key={m.id}
                style={{
                  fontSize: '11px',
                  color: '#991b1b',
                  background: '#fee2e2',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: '1px solid #fecaca',
                }}
              >
                Front
              </span>
            ))}
            {marksForView('rear').map((m) => (
              <span
                key={m.id}
                style={{
                  fontSize: '11px',
                  color: '#991b1b',
                  background: '#fee2e2',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: '1px solid #fecaca',
                }}
              >
                Rear
              </span>
            ))}
            {marksForView('left').map((m) => (
              <span
                key={m.id}
                style={{
                  fontSize: '11px',
                  color: '#991b1b',
                  background: '#fee2e2',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: '1px solid #fecaca',
                }}
              >
                Left Side
              </span>
            ))}
            {marksForView('right').map((m) => (
              <span
                key={m.id}
                style={{
                  fontSize: '11px',
                  color: '#991b1b',
                  background: '#fee2e2',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: '1px solid #fecaca',
                }}
              >
                Right Side
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
