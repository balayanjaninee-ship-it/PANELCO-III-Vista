import { Maximize2, LayoutGrid, Rotate3d } from 'lucide-react';
import {
  CameraViewId,
  HIACE_PAINTS,
  HiAceSceneState,
  HoveredPartInfo,
} from '../types/hiace';

interface ViewportOverlaysProps {
  state: HiAceSceneState;
  azimuthDeg: number;
  hoveredPart: HoveredPartInfo | null;
  dockCollapsed: boolean;
  onFocusSingleView: (view: CameraViewId) => void;
  onSelect360: () => void;
  onReturnToQuad: () => void;
}

const SINGLE_VIEW_TITLES: Record<CameraViewId, { label: string; spec: string }> = {
  right: { label: 'Right Side View', spec: 'Length 4,695 mm · Wheelbase 2,570 mm · Orthographic' },
  left: { label: 'Left Side View', spec: 'Length 4,695 mm · Wheelbase 2,570 mm · Orthographic' },
  front: { label: 'Front View', spec: 'Width 1,695 mm · Height 1,980 mm · Orthographic' },
  rear: { label: 'Rear View', spec: 'Width 1,695 mm · Height 1,980 mm · Orthographic' },
  top: { label: 'Top Plan View', spec: 'Length 4,695 mm · Width 1,695 mm · Orthographic' },
};

export function ViewportOverlays({
  state,
  azimuthDeg,
  hoveredPart,
  dockCollapsed,
  onFocusSingleView,
  onSelect360,
  onReturnToQuad,
}: ViewportOverlaysProps) {
  const isLight = state.studioEnv === 'daylight';
  const activePaint = HIACE_PAINTS.find((p) => p.id === state.paintId) ?? HIACE_PAINTS[0];
  const trimLabel = state.trimSpec === 'cargo-dx' ? 'Cargo DX' : 'Super GL';
  const formattedHeading = `${String(azimuthDeg).padStart(3, '0')}°`;

  const primaryText = isLight ? 'text-slate-900' : 'text-slate-100';
  const mutedText = isLight ? 'text-slate-600' : 'text-slate-400';
  const dividerColor = isLight ? 'bg-slate-900/12' : 'bg-white/12';
  const actionBtnClass = isLight
    ? 'text-slate-700 hover:text-slate-950 bg-white/95 hover:bg-white border border-slate-900/14'
    : 'text-slate-200 hover:text-white bg-[#141820]/95 hover:bg-[#1c222d] border border-white/14';
  const primaryActionBtnClass = isLight
    ? 'text-white bg-[#007030] hover:bg-[#005b26] border border-[#007030]'
    : 'text-slate-950 bg-sky-400 hover:bg-sky-300 border border-sky-400';

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden select-none">
      {/* FULL-SCREEN 360° VIEW HEADER */}
      {state.layoutMode === '360' && (
        <div className="absolute top-4 left-5 right-5 flex items-start justify-between gap-6">
          <div className="flex flex-col gap-0.5">
            <h1 className={`text-base font-semibold tracking-tight leading-tight ${primaryText}`}>
              Toyota HiAce H200
            </h1>
            <div className={`flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs ${mutedText}`}>
              <span>PANELCO III #75</span>
              <span aria-hidden="true">·</span>
              <span>URO 582</span>
              <span aria-hidden="true">·</span>
              <span>{trimLabel}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">360° View · {formattedHeading}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onReturnToQuad}
            className={`pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ${actionBtnClass}`}
            title="Switch to Four-View Elevation Sheet (Q)"
          >
            <LayoutGrid className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Four Views</span>
          </button>
        </div>
      )}

      {/* SINGLE ORTHOGRAPHIC ELEVATION HEADER */}
      {state.layoutMode === 'single' && (
        <div className="absolute top-4 left-5 right-5 flex items-start justify-between gap-6">
          <div className="flex flex-col gap-0.5">
            <h1 className={`text-base font-semibold tracking-tight leading-tight ${primaryText}`}>
              Toyota HiAce H200
            </h1>
            <div className={`flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs ${mutedText}`}>
              <span>PANELCO III #75</span>
              <span aria-hidden="true">·</span>
              <span>{trimLabel}</span>
              <span aria-hidden="true">·</span>
              <span>{activePaint.name} ({activePaint.code})</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {SINGLE_VIEW_TITLES[state.activeSingleView].label}
              </span>
            </div>
          </div>

          <div className="pointer-events-auto flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onSelect360}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ${primaryActionBtnClass}`}
              title="Open Interactive 360° Showcase View (0)"
            >
              <Rotate3d className="w-3.5 h-3.5" aria-hidden="true" />
              <span>360° View</span>
            </button>
            <button
              type="button"
              onClick={onReturnToQuad}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ${actionBtnClass}`}
              title="Return to Four-View Sheet (Q)"
            >
              <LayoutGrid className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Four Views</span>
            </button>
          </div>
        </div>
      )}

      {/* QUAD-VIEW SYNCHRONIZED FOUR-VIEW SHEET (Right, Left, Front, Rear — Matching Sketch!) */}
      {state.layoutMode === 'quad' && (
        <>
          {/* Center vertical hairline */}
          <div
            className={`absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2 ${dividerColor}`}
            aria-hidden="true"
          />
          {/* Center horizontal hairline */}
          <div
            className={`absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 ${dividerColor}`}
            aria-hidden="true"
          />

          {/* Quadrant 1 (Top-Left): Right Side View */}
          <div className="absolute top-0 left-0 w-1/2 h-1/2 p-3.5 sm:p-4 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-0.5">
                <div className={`flex items-center gap-2 text-xs sm:text-sm font-semibold tracking-tight ${primaryText}`}>
                  <span>Toyota HiAce H200</span>
                  <span className={`font-normal ${mutedText}`} aria-hidden="true">·</span>
                  <span className={`font-medium ${mutedText}`}>01. Right Side View</span>
                </div>
                <div className={`text-[11px] sm:text-xs ${mutedText}`}>
                  <span>PANELCO III #75</span>
                  <span className="mx-1.5" aria-hidden="true">·</span>
                  <span>URO 582</span>
                  <span className="mx-1.5" aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">L 4,695 mm</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onFocusSingleView('right')}
                className={`pointer-events-auto p-1.5 rounded-md transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-500 ${actionBtnClass}`}
                aria-label="Maximize Right Side View"
                title="Maximize Right Side View (1)"
              >
                <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Quadrant 2 (Top-Right): Left Side View + Prominent 360° View Switch */}
          <div className="absolute top-0 left-1/2 w-1/2 h-1/2 p-3.5 sm:p-4 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-0.5">
                <span className={`text-xs sm:text-sm font-semibold tracking-tight ${primaryText}`}>
                  02. Left Side View
                </span>
                <span className={`text-[11px] font-mono tabular-nums ${mutedText}`}>
                  L 4,695 mm · WB 2,570 mm · Orthographic
                </span>
              </div>
              <div className="pointer-events-auto flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={onSelect360}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-500 ${primaryActionBtnClass}`}
                  title="Switch to Interactive 360° View (0)"
                >
                  <Rotate3d className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>360° View</span>
                </button>
                <button
                  type="button"
                  onClick={() => onFocusSingleView('left')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-500 ${actionBtnClass}`}
                  aria-label="Maximize Left Side View"
                  title="Maximize Left Side View (2)"
                >
                  <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          {/* Quadrant 3 (Bottom-Left): Front View */}
          <div className="absolute top-1/2 left-0 w-1/2 h-1/2 p-3.5 sm:p-4 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-0.5">
                <span className={`text-xs sm:text-sm font-semibold tracking-tight ${primaryText}`}>
                  03. Front View
                </span>
                <span className={`text-[11px] font-mono tabular-nums ${mutedText}`}>
                  W 1,695 mm · H 1,980 mm · Orthographic
                </span>
              </div>
              <button
                type="button"
                onClick={() => onFocusSingleView('front')}
                className={`pointer-events-auto p-1.5 rounded-md transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-500 ${actionBtnClass}`}
                aria-label="Maximize Front View"
                title="Maximize Front View (3)"
              >
                <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Quadrant 4 (Bottom-Right): Rear View */}
          <div className="absolute top-1/2 left-1/2 w-1/2 h-1/2 p-3.5 sm:p-4 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-0.5">
                <span className={`text-xs sm:text-sm font-semibold tracking-tight ${primaryText}`}>
                  04. Rear View
                </span>
                <span className={`text-[11px] font-mono tabular-nums ${mutedText}`}>
                  W 1,695 mm · H 1,980 mm · Orthographic
                </span>
              </div>
              <button
                type="button"
                onClick={() => onFocusSingleView('rear')}
                className={`pointer-events-auto p-1.5 rounded-md transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-500 ${actionBtnClass}`}
                aria-label="Maximize Rear View"
                title="Maximize Rear View (4)"
              >
                <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* SUBTLE FOOTER SPEC HINT WHEN DOCK IS COLLAPSED */}
      {dockCollapsed && state.layoutMode !== 'quad' && (
        <div
          className={`absolute bottom-5 left-5 text-xs font-mono tabular-nums ${mutedText}`}
        >
          {state.layoutMode === '360'
            ? 'Drag to orbit 360° · Scroll to zoom · Click doors or headlamps'
            : SINGLE_VIEW_TITLES[state.activeSingleView].spec}
        </div>
      )}

      {/* INTERACTIVE PART RAYCAST TOOLTIP (SOLID/RGBA SURFACE, ZERO BACKDROP-BLUR) */}
      {hoveredPart && (
        <div
          className="fixed z-30 pointer-events-none px-2.5 py-1.5 rounded-md border text-xs shadow-lg"
          style={{
            left: Math.min(hoveredPart.screenX + 14, window.innerWidth - 200),
            top: Math.max(hoveredPart.screenY - 46, 12),
            backgroundColor: isLight ? 'rgba(255, 255, 255, 0.96)' : 'rgba(17, 21, 27, 0.96)',
            borderColor: isLight ? 'rgba(15, 23, 42, 0.14)' : 'rgba(255, 255, 255, 0.14)',
          }}
        >
          <div className={`font-semibold leading-tight ${primaryText}`}>{hoveredPart.label}</div>
          <div className={`text-[11px] leading-tight mt-0.5 ${mutedText}`}>
            {hoveredPart.actionHint}
          </div>
        </div>
      )}
    </div>
  );
}
