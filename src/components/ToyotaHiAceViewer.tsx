import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CameraViewId,
  HiAceSceneState,
  HoveredPartInfo,
  InteractivePartId,
  RenderStyle,
} from '../types/hiace';
import { HiAceViewportEngine } from '../scene/HiAceViewportEngine';

const INITIAL_STATE: HiAceSceneState = {
  layoutMode: 'quad',
  activeSingleView: 'right',
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

const RENDER_CYCLE: RenderStyle[] = ['pbr', 'clay', 'wireframe'];

interface ToyotaHiAceViewerProps {
  height?: string;
  modelScale?: number;
  initialView?: CameraViewId;
  layoutMode?: LayoutMode;
  hideControls?: boolean;
}

export default function ToyotaHiAceViewer({
  height = '450px',
  initialView,
  layoutMode,
  hideControls = false,
}: ToyotaHiAceViewerProps) {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<HiAceViewportEngine | null>(null);

  const initialState: HiAceSceneState = {
    ...INITIAL_STATE,
    layoutMode: layoutMode ?? INITIAL_STATE.layoutMode,
    activeSingleView: initialView ?? INITIAL_STATE.activeSingleView,
  };

  const [sceneState, setSceneState] = useState<HiAceSceneState>(initialState);
  const [azimuthDeg, setAzimuthDeg] = useState(43);
  const [contextError, setContextError] = useState<string | null>(null);

  const handlePartClick = useCallback((part: InteractivePartId) => {
    setSceneState((prev: HiAceSceneState) => {
      if (part === 'slidingDoor') {
        return { ...prev, slidingDoorOpen: !prev.slidingDoorOpen };
      }
      if (part === 'tailgate') {
        return { ...prev, tailgateOpen: !prev.tailgateOpen };
      }
      return { ...prev, lightsOn: !prev.lightsOn };
    });
  }, []);

  const handlePartClickRef = useRef(handlePartClick);
  handlePartClickRef.current = handlePartClick;

  // Mount Three.js engine exactly once inside isolated DOM ref container
  useEffect(() => {
    const mountEl = canvasMountRef.current;
    if (!mountEl) return;

    let engine: HiAceViewportEngine | null = null;
    try {
      engine = new HiAceViewportEngine(mountEl, initialState, {
        onPartClick: (part) => handlePartClickRef.current(part),
        onPartHover: (info) => {},
        onAzimuthChange: (deg) => setAzimuthDeg(deg),
        onContextLost: (lost) => {
          setContextError(
            lost
              ? 'WebGL graphics context was interrupted. Restore to resume 3D rendering.'
              : null,
          );
        },
      });
      engineRef.current = engine;
    } catch {
      setContextError('WebGL2 is unavailable in this browser environment.');
    }

    return () => {
      engine?.dispose();
      engineRef.current = null;
    };
  }, []);

  // Push React state transitions to engine without ever remounting the canvas
  useEffect(() => {
    engineRef.current?.updateState(sceneState);
  }, [sceneState]);

  const handleSelectQuad = useCallback(() => {
    setSceneState((prev: HiAceSceneState) => ({
      ...prev,
      layoutMode: 'quad',
      autoSpin: false,
    }));
  }, []);

  const handleSelect360 = useCallback(() => {
    setSceneState((prev: HiAceSceneState) => {
      const next: HiAceSceneState = {
        ...prev,
        layoutMode: '360',
      };
      engineRef.current?.updateState(next, prev.layoutMode === '360');
      return next;
    });
  }, []);

  const handleSelectSingleView = useCallback((view: CameraViewId) => {
    setSceneState((prev: HiAceSceneState) => ({
      ...prev,
      layoutMode: 'single',
      activeSingleView: view,
      autoSpin: false,
    }));
  }, []);

  const handleToggleAutoSpin = useCallback(() => {
    const engine = engineRef.current;
    setSceneState((prev: HiAceSceneState) => {
      if (prev.layoutMode !== '360') {
        return { ...prev, layoutMode: '360', autoSpin: true };
      }
      if (engine?.isSoftwareGl) {
        engine.stepOrbit360(45);
        return prev;
      }
      return { ...prev, autoSpin: !prev.autoSpin };
    });
  }, []);

  const handleReset = useCallback(() => {
    setSceneState((prev: HiAceSceneState) => ({
      ...prev,
      slidingDoorOpen: false,
      tailgateOpen: false,
      wheelSteerAngled: false,
      autoSpin: false,
      showDimensions: false,
    }));
    engineRef.current?.resetAllCameras();
  }, []);

  if (contextError) {
    return (
      <div
        style={{
          width: '100%',
          height,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#11151b',
          color: '#f1f5f9',
          fontFamily:
            'Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          borderRadius: 12,
          border: '1px solid #e1e6e1',
        }}
      >
        <p style={{ marginBottom: 12 }}>3D Viewport Unavailable</p>
        <p style={{ marginBottom: 12, fontSize: 12, opacity: 0.7 }}>
          {contextError}
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '6px 12px',
            background: '#176B3A',
            color: '#ffffff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          Reload
        </button>
      </div>
    );
  }

  const viewButtons = [
    { label: 'Quad', action: handleSelectQuad },
    { label: '360°', action: handleSelect360 },
    { label: 'Front', action: () => handleSelectSingleView('front') },
    { label: 'Rear', action: () => handleSelectSingleView('rear') },
    { label: 'Left', action: () => handleSelectSingleView('left') },
    { label: 'Right', action: () => handleSelectSingleView('right') },
  ];

  return (
    <div
      style={{
        width: '100%',
        height,
        background: '#11151b',
        borderRadius: 12,
        border: '1px solid #e1e6e1',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {!hideControls && (
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          padding: 8,
          justifyContent: 'center',
          background: '#0e1218',
          borderBottom: '1px solid #1a1f24',
        }}
      >
        {viewButtons.map(({ label, action }) => (
          <button
            key={label}
            type="button"
            onClick={action}
            style={{
              padding: '4px 10px',
              border: '1px solid #2a2e33',
              borderRadius: 6,
              background: '#161b24',
              color: '#f1f5f9',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 600,
              fontFamily:
                'Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              transition: 'all 0.2s',
            }}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={handleToggleAutoSpin}
          style={{
            padding: '4px 10px',
            border: '1px solid #176B3A',
            borderRadius: 6,
            background: '#176B3A',
            color: '#ffffff',
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 600,
            fontFamily:
              'Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          }}
        >
          Spin
        </button>
        <button
          type="button"
          onClick={handleReset}
          style={{
            padding: '4px 10px',
            border: '1px solid #2a2e33',
            borderRadius: 6,
            background: '#161b24',
            color: '#f1f5f9',
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 600,
            fontFamily:
              'Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            marginLeft: 'auto',
          }}
        >
          Reset
        </button>
      </div>

      )}
<div ref={canvasMountRef} style={{ flex: 1, width: '100%', minHeight: 0 }} />
    </div>
  );
}
