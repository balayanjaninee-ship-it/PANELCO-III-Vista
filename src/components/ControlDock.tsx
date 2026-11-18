import {
  ChevronDown,
  ChevronUp,
  DoorOpen,
  Lightbulb,
  RotateCcw,
  RefreshCw,
  Ruler,
  Sun,
  Moon,
  Layers,
  LayoutGrid,
  Sparkles,
  Disc,
  Rotate3d,
} from 'lucide-react';
import {
  CameraViewId,
  HIACE_PAINTS,
  HiAceSceneState,
  RenderStyle,
} from '../types/hiace';

interface ControlDockProps {
  state: HiAceSceneState;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onSelectQuad: () => void;
  onSelect360: () => void;
  onSelectSingleView: (view: CameraViewId) => void;
  onSelectPaint: (paintId: string) => void;
  onToggleTrimSpec: () => void;
  onToggleSlidingDoor: () => void;
  onToggleTailgate: () => void;
  onToggleWheelSteer: () => void;
  onToggleLights: () => void;
  onToggleDimensions: () => void;
  onCycleRenderStyle: () => void;
  onToggleStudioEnv: () => void;
  onToggleAutoSpin: () => void;
  onReset: () => void;
}

const ELEVATION_BUTTONS: { id: CameraViewId; label: string; keyHint: string }[] = [
  { id: 'right', label: 'Right', keyHint: '1' },
  { id: 'left', label: 'Left', keyHint: '2' },
  { id: 'front', label: 'Front', keyHint: '3' },
  { id: 'rear', label: 'Rear', keyHint: '4' },
  { id: 'top', label: 'Top', keyHint: '5' },
];

const RENDER_STYLE_LABEL: Record<RenderStyle, string> = {
  pbr: 'Studio PBR',
  clay: 'Clay',
  wireframe: 'Wireframe',
};

export function ControlDock({
  state,
  collapsed,
  onToggleCollapse,
  onSelectQuad,
  onSelect360,
  onSelectSingleView,
  onSelectPaint,
  onToggleTrimSpec,
  onToggleSlidingDoor,
  onToggleTailgate,
  onToggleWheelSteer,
  onToggleLights,
  onToggleDimensions,
  onCycleRenderStyle,
  onToggleStudioEnv,
  onToggleAutoSpin,
  onReset,
}: ControlDockProps) {
  const isLight = state.studioEnv === 'daylight';

  const dockSurface = isLight
    ? 'bg-[#f8fafc]/95 border-slate-900/14 text-slate-900 shadow-lg shadow-slate-900/10'
    : 'bg-[#141820]/95 border-white/12 text-slate-100 shadow-xl shadow-black/50';

  const tabSurface = isLight
    ? 'bg-[#f8fafc]/95 border-slate-900/14 text-slate-700 hover:text-slate-950'
    : 'bg-[#141820]/95 border-white/12 text-slate-300 hover:text-white';

  const segmentBg = isLight ? 'bg-slate-200/80' : 'bg-white/6';
  const activeSegBtn = isLight
    ? 'bg-[#007030] text-white'
    : 'bg-sky-500 text-slate-950 font-semibold';
  const idleSegBtn = isLight
    ? 'text-slate-600 hover:text-slate-950'
    : 'text-slate-300 hover:text-white';

  const dividerClass = isLight ? 'bg-slate-900/12' : 'bg-white/10';

  const toggleBtnClass = (active: boolean) =>
    active
      ? isLight
        ? 'bg-[#007030] text-white border-[#007030]'
        : 'bg-sky-500/20 text-sky-300 border-sky-400/45'
      : isLight
        ? 'bg-transparent text-slate-700 border-transparent hover:bg-slate-200/80 hover:text-slate-950'
        : 'bg-transparent text-slate-300 border-transparent hover:bg-white/8 hover:text-white';

  return (
    <div
      className="fixed bottom-4 left-1/2 z-20 flex flex-col items-center pointer-events-none transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
      style={{
        transform: collapsed
          ? 'translate(-50%, calc(100% - 14px))'
          : 'translate(-50%, 0)',
        maxWidth: 'min(1260px, 96vw)',
      }}
    >
      {/* Attached Collapse / Expand Zen Mode Tab */}
      <button
        type="button"
        onClick={onToggleCollapse}
        className={`pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-t-lg border border-b-0 text-[11px] font-medium tracking-wide transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-sky-500 ${tabSurface}`}
        aria-expanded={!collapsed}
        title="Toggle Control Dock (H)"
      >
        {collapsed ? (
          <>
            <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Show Controls</span>
          </>
        ) : (
          <>
            <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Hide Controls</span>
          </>
        )}
      </button>

      {/* Main Compact Horizontal Control Dock (NO backdrop-filter over WebGL) */}
      <div
        className={`pointer-events-auto w-full rounded-xl border px-3 py-2 flex items-center gap-2.5 overflow-x-auto ${dockSurface}`}
      >
        {/* 1. 4-View Sheet, 360° Showcase & Elevation Switcher */}
        <div
          className={`inline-flex items-center gap-0.5 p-0.5 rounded-lg shrink-0 ${segmentBg}`}
          role="group"
          aria-label="Camera Views"
        >
          <button
            type="button"
            onClick={onSelectQuad}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-500 ${
              state.layoutMode === 'quad' ? activeSegBtn : idleSegBtn
            }`}
            title="Four-View Elevation Sheet: Right, Left, Front & Rear (Q)"
          >
            <LayoutGrid className="w-3.5 h-3.5" aria-hidden="true" />
            <span>4-View</span>
          </button>

          <button
            type="button"
            onClick={onSelect360}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-500 ${
              state.layoutMode === '360' ? activeSegBtn : idleSegBtn
            }`}
            title="Interactive 360° Showcase View (0)"
          >
            <Rotate3d className="w-3.5 h-3.5" aria-hidden="true" />
            <span>360°</span>
          </button>

          {ELEVATION_BUTTONS.map((v) => {
            const isActive =
              state.layoutMode === 'single' && state.activeSingleView === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => onSelectSingleView(v.id)}
                className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-500 ${
                  isActive ? activeSegBtn : idleSegBtn
                }`}
                title={`${v.label} Elevation (${v.keyHint})`}
              >
                {v.label}
              </button>
            );
          })}
        </div>

        <div className={`w-px h-6 shrink-0 ${dividerClass}`} aria-hidden="true" />

        {/* 2. Toyota H200 Factory Paint Swatches */}
        <div
          className="inline-flex items-center gap-1.5 shrink-0"
          role="group"
          aria-label="Factory Body Paint"
        >
          {HIACE_PAINTS.map((paint) => {
            const active = state.paintId === paint.id && state.renderStyle === 'pbr';
            return (
              <button
                key={paint.id}
                type="button"
                onClick={() => onSelectPaint(paint.id)}
                className={`w-5 h-5 rounded-full transition-transform cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ${
                  active
                    ? isLight
                      ? 'ring-2 ring-offset-2 ring-[#007030] ring-offset-[#f8fafc] scale-105'
                      : 'ring-2 ring-offset-2 ring-sky-400 ring-offset-[#141820] scale-105'
                    : 'hover:scale-110'
                }`}
                style={{
                  backgroundColor: paint.hex,
                  boxShadow: 'inset 0 0 0 1px rgba(128,128,128,0.45)',
                }}
                aria-label={`${paint.name} (${paint.code})`}
                title={`${paint.name} (${paint.code})`}
              />
            );
          })}
        </div>

        <div className={`w-px h-6 shrink-0 ${dividerClass}`} aria-hidden="true" />

        {/* 3. Trim Package, Kinematics & 360° Turntable Controls */}
        <div className="inline-flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onToggleTrimSpec}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-500 ${toggleBtnClass(
              state.trimSpec === 'super-gl',
            )}`}
            title="Switch Trim: Cargo DX / Super GL (M)"
          >
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{state.trimSpec === 'cargo-dx' ? 'Cargo DX' : 'Super GL'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleSlidingDoor}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-500 ${toggleBtnClass(
              state.slidingDoorOpen,
            )}`}
            title="Toggle Left Sliding Door (D)"
          >
            <DoorOpen className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Slide Door</span>
          </button>

          <button
            type="button"
            onClick={onToggleTailgate}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-500 ${toggleBtnClass(
              state.tailgateOpen,
            )}`}
            title="Toggle Rear Tailgate (T)"
          >
            <span>Tailgate</span>
          </button>

          <button
            type="button"
            onClick={onToggleWheelSteer}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-500 ${toggleBtnClass(
              state.wheelSteerAngled,
            )}`}
            title="Toggle Front Wheel Steering Angle (S)"
          >
            <Disc className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Steer</span>
          </button>

          <button
            type="button"
            onClick={onToggleLights}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-500 ${toggleBtnClass(
              state.lightsOn,
            )}`}
            title="Toggle Headlamps and Taillights (L)"
          >
            <Lightbulb className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Lights</span>
          </button>

          <button
            type="button"
            onClick={onToggleAutoSpin}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-500 ${toggleBtnClass(
              state.layoutMode === '360' && state.autoSpin,
            )}`}
            title="Toggle Continuous 360° Turntable Spin (Space)"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Spin 360°</span>
          </button>

          <button
            type="button"
            onClick={onToggleDimensions}
            className={`inline-flex items-center justify-center p-1.5 rounded-md border text-xs font-medium transition-colors shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-500 ${toggleBtnClass(
              state.showDimensions,
            )}`}
            title="Toggle 3D Dimension Guides"
            aria-label="Toggle 3D Dimension Guides"
          >
            <Ruler className="w-3.5 h-3.5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={onCycleRenderStyle}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-500 ${toggleBtnClass(
              state.renderStyle !== 'pbr',
            )}`}
            title="Switch Render Mode: Studio PBR / Clay / Wireframe"
          >
            <Layers className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{RENDER_STYLE_LABEL[state.renderStyle]}</span>
          </button>

          <button
            type="button"
            onClick={onToggleStudioEnv}
            className={`inline-flex items-center justify-center p-1.5 rounded-md border text-xs transition-colors shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-500 ${toggleBtnClass(
              false,
            )}`}
            title={
              isLight ? 'Switch to Obsidian Showroom' : 'Switch to White Gallery Studio'
            }
            aria-label={
              isLight ? 'Switch to Obsidian Showroom' : 'Switch to White Gallery Studio'
            }
          >
            {isLight ? (
              <Moon className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <Sun className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={onReset}
            className={`inline-flex items-center justify-center p-1.5 rounded-md border text-xs transition-colors shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-500 ${toggleBtnClass(
              false,
            )}`}
            title="Reset Viewports & Doors (R)"
            aria-label="Reset Viewports and Doors"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
