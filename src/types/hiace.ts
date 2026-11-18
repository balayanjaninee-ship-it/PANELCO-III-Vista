export type LayoutMode = 'quad' | '360' | 'single';

export type CameraViewId = 'right' | 'left' | 'front' | 'rear' | 'top';

export type RenderStyle = 'pbr' | 'clay' | 'wireframe';

export type StudioEnvironment = 'obsidian' | 'daylight';

export type TrimSpec = 'cargo-dx' | 'super-gl';

export interface PaintFinish {
  id: string;
  code: string;
  name: string;
  hex: string;
  metalness: number;
  roughness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  flakeStrength: number;
}

export interface HiAceSceneState {
  layoutMode: LayoutMode;
  activeSingleView: CameraViewId;
  paintId: string;
  trimSpec: TrimSpec;
  renderStyle: RenderStyle;
  studioEnv: StudioEnvironment;
  slidingDoorOpen: boolean;
  tailgateOpen: boolean;
  wheelSteerAngled: boolean;
  lightsOn: boolean;
  autoSpin: boolean;
  showDimensions: boolean;
}

export type InteractivePartId = 'slidingDoor' | 'tailgate' | 'headlights';

export interface HoveredPartInfo {
  id: InteractivePartId;
  label: string;
  actionHint: string;
  screenX: number;
  screenY: number;
}

export const HIACE_PAINTS: PaintFinish[] = [
  {
    id: 'solid-white',
    code: '058',
    name: 'White',
    hex: '#f3f5f7',
    metalness: 0.08,
    roughness: 0.17,
    clearcoat: 1.0,
    clearcoatRoughness: 0.035,
    flakeStrength: 0.05,
  },
  {
    id: 'pearl-white',
    code: '070',
    name: 'White Pearl Crystal Shine',
    hex: '#f1efe8',
    metalness: 0.16,
    roughness: 0.19,
    clearcoat: 1.0,
    clearcoatRoughness: 0.035,
    flakeStrength: 0.14,
  },
  {
    id: 'silver-mica',
    code: '1E7',
    name: 'Silver Mica Metallic',
    hex: '#b3bac2',
    metalness: 0.76,
    roughness: 0.21,
    clearcoat: 0.98,
    clearcoatRoughness: 0.045,
    flakeStrength: 0.26,
  },
  {
    id: 'black-mica',
    code: '209',
    name: 'Black Mica',
    hex: '#14171c',
    metalness: 0.42,
    roughness: 0.17,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
    flakeStrength: 0.22,
  },
  {
    id: 'dark-blue',
    code: '8P4',
    name: 'Dark Blue Mica Metallic',
    hex: '#172e4d',
    metalness: 0.62,
    roughness: 0.2,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    flakeStrength: 0.24,
  },
  {
    id: 'beige-metallic',
    code: '4V6',
    name: 'Beige Metallic',
    hex: '#b8a68c',
    metalness: 0.45,
    roughness: 0.25,
    clearcoat: 0.9,
    clearcoatRoughness: 0.06,
    flakeStrength: 0.18,
  },
];

/** Exact factory dimensions of Toyota HiAce H200 Standard Long (meters) */
export const HIACE_DIMENSIONS = {
  length: 4.695,
  width: 1.695,
  height: 1.98,
  wheelbase: 2.57,
  frontAxleZ: 1.255,
  rearAxleZ: -1.315,
  trackHalfWidth: 0.735,
  wheelRadius: 0.346,
  tireWidth: 0.195,
  groundClearance: 0.195,
  beltlineY: 1.28,
  roofY: 1.98,
} as const;
