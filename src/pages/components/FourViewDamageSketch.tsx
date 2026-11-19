import { useCallback, useEffect, useRef, useState } from 'react';
import { HiAceViewportEngine } from '@/scene/HiAceViewportEngine';
import { HiAceSceneState, CameraViewId } from '@/types/hiace';
import ToyotaHiAceViewer from '@/components/ToyotaHiAceViewer';

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
  const [rotateMode, setRotateMode] = useState(false);
  const [selectedMarkId, setSelectedMarkId] = useState<string | null>(null);

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

  const placeMarkAt = useCallback(
    (clientX: number, clientY: number) => {
      if (rotateMode) return;
      const el = overlayRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const fallbackX = (clientX - rect.left) / rect.width;
      const fallbackY = (clientY - rect.top) / rect.height;

      let view: ViewKey;
      let nx: number;
      let ny: number;

      if (is360) {
        const resolved = engineRef.current?.resolveDamageMark(clientX, clientY);
        if (resolved) {
          view = resolved.view;
          nx = resolved.x;
          ny = resolved.y;
        } else {
          view = getViewFromAzimuth(azimuthDeg);
          nx = Math.max(0, Math.min(1, fallbackX));
          ny = Math.max(0, Math.min(1, fallbackY));
        }
      } else {
        view = selectedView;
        nx = Math.max(0, Math.min(1, fallbackX));
        ny = Math.max(0, Math.min(1, fallbackY));
      }

      const newMark: DamageMark = {
        id: crypto.randomUUID(),
        view,
        x: nx,
        y: ny,
      };

      setDamageMarks((prev) => {
        const next = [...prev, newMark];
        onMarksChange?.(next);
        return next;
      });
    },
    [azimuthDeg, getViewFromAzimuth, is360, selectedView, rotateMode, onMarksChange]
  );

  // Native touch listeners (React's synthetic touch events are passive on some
  // browsers, which prevents preventDefault and breaks tap-to-mark on mobile).
  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (rotateMode) return;
      e.preventDefault();
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (rotateMode) return;
      const t = e.changedTouches && e.changedTouches[0];
      if (t) {
        e.preventDefault();
        placeMarkAt(t.clientX, t.clientY);
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: false });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [rotateMode, placeMarkAt]);

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
    <div
      className="four-view-damage-sketch"
      style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
      onClick={() => setSelectedMarkId(null)}
    >
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
          {/* Click overlay — captures clicks to place damage markers (disabled while rotating) */}
          <div
            ref={overlayRef}
            onClick={(e) => placeMarkAt(e.clientX, e.clientY)}
            onPointerDown={(e) => {
              (e.currentTarget as HTMLDivElement).dataset.downX = String(e.clientX);
              (e.currentTarget as HTMLDivElement).dataset.downY = String(e.clientY);
            }}
            onPointerUp={(e) => {
              if (rotateMode) return;
              const downX = Number((e.currentTarget as HTMLDivElement).dataset.downX || e.clientX);
              const downY = Number((e.currentTarget as HTMLDivElement).dataset.downY || e.clientY);
              const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
              if (moved < 12) {
                placeMarkAt(e.clientX, e.clientY);
              }
            }}
            style={{
              position: 'absolute',
              inset: 0,
              cursor: rotateMode ? 'grab' : 'crosshair',
              zIndex: 5,
              background: 'transparent',
              pointerEvents: rotateMode ? 'none' : 'auto',
              touchAction: 'none',
            }}
          />
        </div>
        <div style={{ padding: '10px', background: '#0e1218', borderTop: '1px solid #1a1f24', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
          <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {rotateMode
              ? 'Rotate/Pan Mode — drag to orbit the vehicle'
              : is360
              ? `360° Inspection — marks go to ${getViewFromAzimuth(azimuthDeg).toUpperCase()} view`
              : `Single View — marks go to ${selectedView.toUpperCase()} view`}
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
              onClick={() => setRotateMode((r) => !r)}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                background: rotateMode ? '#b45309' : '#161b24',
                color: '#ffffff',
                border: rotateMode ? '1px solid #f59e0b' : '1px solid #2a2e33',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
              title={rotateMode ? 'Click to switch back to marking damages' : 'Click to rotate/pan the vehicle without placing marks'}
            >
              {rotateMode ? 'Rotate Mode' : 'Mark Mode'}
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

      {/* Four-View Sketch Grid — single quad 3D view + overlaid damage marks */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '4 / 3',
          borderRadius: '10px',
          overflow: 'hidden',
          border: '2px solid #e1e6e1',
          background: '#11151b',
        }}
      >
        <ToyotaHiAceViewer height="100%" layoutMode="quad" hideControls />

        {/* Quadrant divider lines */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2 }}>
          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.25)' }} />
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'rgba(255,255,255,0.25)' }} />
        </div>

        {/* Quadrant labels */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3 }}>
          {([
            { view: 'right', label: 'RIGHT SIDE VIEW', x: '25%', y: '8px' },
            { view: 'left', label: 'LEFT SIDE VIEW', x: '75%', y: '8px' },
            { view: 'front', label: 'FRONT VIEW', x: '25%', y: '50%' },
            { view: 'rear', label: 'REAR VIEW', x: '75%', y: '50%' },
          ] as const).map((q) => (
            <span
              key={q.view}
              style={{
                position: 'absolute',
                left: q.x,
                top: q.y,
                transform: 'translateX(-50%)',
                fontSize: '10px',
                fontWeight: 700,
                color: '#ffffff',
                textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                letterSpacing: '0.5px',
              }}
            >
              {q.label}
            </span>
          ))}
        </div>

        {/* Damage marks overlaid on each quadrant */}
        {(['front', 'rear', 'left', 'right'] as ViewKey[]).map((view) => {
          const qOrigin: Record<ViewKey, { x: number; y: number }> = {
            right: { x: 0, y: 0 },
            left: { x: 0.5, y: 0 },
            front: { x: 0, y: 0.5 },
            rear: { x: 0.5, y: 0.5 },
          };
          const origin = qOrigin[view];
          return marksForView(view).map((mark) => (
            <div
              key={mark.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedMarkId((prev) => (prev === mark.id ? null : mark.id));
              }}
              style={{
                position: 'absolute',
                left: `${(origin.x + mark.x * 0.5) * 100}%`,
                top: `${(origin.y + mark.y * 0.5) * 100}%`,
                transform: 'translate(-50%, -50%)',
                width: '22px',
                height: '22px',
                pointerEvents: 'auto',
                zIndex: 10,
                cursor: 'pointer',
              }}
            >
              <svg viewBox="0 0 24 24" width="22" height="22" style={{ display: 'block' }}>
                <circle cx="12" cy="12" r="9" fill="none" stroke={MARK_COLOR} strokeWidth="2.5" />
              </svg>
              {selectedMarkId === mark.id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeMark(mark.id);
                    setSelectedMarkId(null);
                  }}
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    width: '18px',
                    height: '18px',
                    background: '#dc2626',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '50%',
                    fontSize: '11px',
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
              )}
            </div>
          ));
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
