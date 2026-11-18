import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {
  CameraViewId,
  HiAceSceneState,
  HoveredPartInfo,
  InteractivePartId,
} from '../types/hiace';
import { createProceduralTextures, ProceduralTextureSet } from './textures';
import { buildToyotaHiAceModel, HiAceModelController } from './buildHiAce';
import { createCycloramaStudio, CycloramaStudioRig } from './studioEnvironment';

export interface EngineCallbacks {
  onPartClick: (part: InteractivePartId) => void;
  onPartHover: (info: HoveredPartInfo | null) => void;
  onAzimuthChange?: (degrees: number) => void;
  onContextLost: (lost: boolean) => void;
}

interface OrthoViewConfig {
  zoom: number;
  targetZoom: number;
  panX: number;
  panY: number;
  targetPanX: number;
  targetPanY: number;
  reqW: number;
  reqH: number;
}

type OrthoKey = CameraViewId;
type ViewportPane = '360' | OrthoKey;

// Pre-allocated scratch math helpers (zero per-frame GC allocations)
const _mouseNdc = new THREE.Vector2();
const _targetPos = new THREE.Vector3();
const _targetLook = new THREE.Vector3();
const _orbitOffset = new THREE.Vector3();

const HERO_360_PRESET: { pos: [number, number, number]; target: [number, number, number] } = {
  pos: [4.45, 1.54, 4.72],
  target: [0, 0.92, -0.02],
};

const PART_LABELS: Record<InteractivePartId, { label: string; hint: string }> = {
  slidingDoor: { label: 'Side Sliding Door', hint: 'Click to toggle slide' },
  tailgate: { label: 'Rear Tailgate', hint: 'Click to lift / close' },
  headlights: { label: 'Crystal Multi-Reflector Headlamps', hint: 'Click to toggle lights' },
};

function detectSoftwareWebGL(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export class HiAceViewportEngine {
  public readonly isSoftwareGl: boolean;

  private readonly container: HTMLElement;
  private readonly callbacks: EngineCallbacks;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene: THREE.Scene;
  private readonly textures: ProceduralTextureSet;
  private readonly studio: CycloramaStudioRig;
  private readonly model: HiAceModelController;

  // Cameras: 1 Interactive 360° Perspective Camera + 5 True Orthographic Elevations (Right, Left, Front, Rear, Top)
  private readonly perspCamera: THREE.PerspectiveCamera;
  private readonly orthoCameras: Record<OrthoKey, THREE.OrthographicCamera>;
  private readonly orthoState: Record<OrthoKey, OrthoViewConfig>;
  private readonly controls: OrbitControls;

  // Studio Lighting & Horizon Fog
  private readonly keyLight: THREE.DirectionalLight;
  private readonly hemiLight: THREE.HemisphereLight;
  private readonly rimLight: THREE.DirectionalLight;
  private readonly fillLight: THREE.DirectionalLight;
  private readonly fog: THREE.Fog;

  // Raycasting
  private readonly raycaster = new THREE.Raycaster();
  private lastHoverRaycastMs = 0;
  private hoveredPartId: InteractivePartId | null = null;
  private lastReportedAzimuth = -1;

  // Smooth 360° camera transition state
  private cameraTransitionActive = false;
  private transitionGoalPos = new THREE.Vector3();
  private transitionGoalTarget = new THREE.Vector3();

  // Orthographic pane pan interaction
  private activeOrthoDrag: {
    key: OrthoKey;
    startX: number;
    startY: number;
    startPanX: number;
    startPanY: number;
    viewportW: number;
    viewportH: number;
  } | null = null;
  private pointerDownPos = { x: 0, y: 0 };

  // State & On-Demand Render Loop Pacing
  private state: HiAceSceneState;
  private width = 1;
  private height = 1;
  private frameId = 0;
  private renderBusy = false;
  private renderDirty = false;
  private lastTickTime = performance.now();
  private disposed = false;

  // Bound listeners for clean unmount
  private readonly resizeObserver: ResizeObserver;
  private readonly boundPointerDown: (e: PointerEvent) => void;
  private readonly boundPointerMove: (e: PointerEvent) => void;
  private readonly boundPointerUp: (e: PointerEvent) => void;
  private readonly boundWheel: (e: WheelEvent) => void;
  private readonly boundDblClick: (e: MouseEvent) => void;
  private readonly boundContextLost: (e: Event) => void;
  private readonly boundContextRestored: () => void;

  constructor(
    container: HTMLElement,
    initialState: HiAceSceneState,
    callbacks: EngineCallbacks,
  ) {
    this.container = container;
    this.state = { ...initialState };
    this.callbacks = callbacks;
    this.isSoftwareGl = detectSoftwareWebGL();

    this.width = Math.max(container.clientWidth, 1);
    this.height = Math.max(container.clientHeight, 1);

    // 1. High-Fidelity WebGLRenderer with Software-GL Guard
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2),
    );
    this.renderer.setSize(this.width, this.height, false);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.autoClear = false;

    const canvas = this.renderer.domElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    canvas.style.touchAction = 'none';
    container.appendChild(canvas);

    // 2. Scene & Studio Horizon Fog
    this.scene = new THREE.Scene();
    const galleryBg = new THREE.Color('#f4f6f9');
    this.scene.background = galleryBg;
    this.fog = new THREE.Fog('#f4f6f9', 18, 42);
    this.scene.fog = this.fog;

    // 3. Procedural Textures & Automotive Cyclorama Showroom + Lightbox PMREM
    this.textures = createProceduralTextures(
      this.renderer.capabilities.getMaxAnisotropy(),
      () => this.requestRender(),
    );

    this.studio = createCycloramaStudio(
      this.renderer,
      this.textures,
      this.isSoftwareGl,
    );
    this.scene.add(this.studio.group);

    // 4. Sculpted Automotive Photography 3-Point Rig + Overhead Softbox
    this.hemiLight = new THREE.HemisphereLight(0xdbe8ff, 0x1e242e, 0.85);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight(0xfff4e4, 2.35);
    this.keyLight.position.set(6.4, 8.8, 6.2);
    this.keyLight.castShadow = !this.isSoftwareGl;
    this.keyLight.shadow.mapSize.set(2048, 2048);
    this.keyLight.shadow.camera.near = 1.0;
    this.keyLight.shadow.camera.far = 24.0;
    const d = 4.6;
    this.keyLight.shadow.camera.left = -d;
    this.keyLight.shadow.camera.right = d;
    this.keyLight.shadow.camera.top = d;
    this.keyLight.shadow.camera.bottom = -d;
    this.keyLight.shadow.bias = -0.0004;
    this.keyLight.shadow.normalBias = 0.02;
    this.keyLight.shadow.radius = 3;
    this.scene.add(this.keyLight);

    this.rimLight = new THREE.DirectionalLight(0xc2dcff, 1.3);
    this.rimLight.position.set(-5.8, 5.2, -6.6);
    this.scene.add(this.rimLight);

    this.fillLight = new THREE.DirectionalLight(0xe4edf8, 0.54);
    this.fillLight.position.set(-6.0, 3.0, 3.6);
    this.scene.add(this.fillLight);

    if (!this.isSoftwareGl) {
      RectAreaLightUniformsLib.init();
      const overheadSoftbox = new THREE.RectAreaLight(0xffffff, 2.6, 6.4, 2.0);
      overheadSoftbox.position.set(0, 4.45, 0);
      overheadSoftbox.lookAt(0, 0.95, 0);
      this.scene.add(overheadSoftbox);
    }

    // 5. Composite Toyota HiAce H200 Model with Permanent Full-Color PANELCO III Livery
    this.model = buildToyotaHiAceModel(this.textures, this.isSoftwareGl);
    this.model.applyStateImmediate(this.state);
    this.scene.add(this.model.root);

    // 6. Full-360° Interactive Showroom Perspective Camera & Damped OrbitControls
    this.perspCamera = new THREE.PerspectiveCamera(
      34,
      this.width / this.height,
      0.1,
      100,
    );
    this.perspCamera.position.set(...HERO_360_PRESET.pos);

    this.controls = new OrbitControls(this.perspCamera, canvas);
    this.controls.target.set(...HERO_360_PRESET.target);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.075;
    this.controls.minDistance = 2.7;
    this.controls.maxDistance = 15.0;
    this.controls.minAzimuthAngle = -Infinity;
    this.controls.maxAzimuthAngle = Infinity;
    this.controls.maxPolarAngle = Math.PI * 0.49; // Stay cleanly above reflective studio floor
    this.controls.minPolarAngle = 0.06;
    this.controls.autoRotateSpeed = 1.35;
    this.controls.enabled = this.state.layoutMode === '360';
    this.controls.update();

    this.controls.addEventListener('start', () => {
      this.cameraTransitionActive = false;
    });
    this.controls.addEventListener('change', () => {
      this.reportAzimuth();
      this.requestRender();
    });

    // 7. Five True Orthographic CAD Cameras Matching Reference Sheet:
    //    - Right Side View (-X -> +X, nose points RIGHT!)
    //    - Left Side View  (+X -> -X, nose points LEFT!)
    //    - Front View      (+Z -> -Z)
    //    - Rear View       (-Z -> +Z)
    //    - Top Plan View   (+Y -> 0)
    const createOrtho = (
      pos: [number, number, number],
      look: [number, number, number],
      up: [number, number, number] = [0, 1, 0],
    ) => {
      const cam = new THREE.OrthographicCamera(-3, 3, 2, -2, 0.1, 45);
      cam.up.set(...up);
      cam.position.set(...pos);
      cam.lookAt(...look);
      return cam;
    };

    this.orthoCameras = {
      right: createOrtho([-8.0, 1.02, -0.02], [0, 1.02, -0.02]),
      left: createOrtho([8.0, 1.02, -0.02], [0, 1.02, -0.02]),
      front: createOrtho([0, 1.02, 8.0], [0, 1.02, 0]),
      rear: createOrtho([0, 1.02, -8.0], [0, 1.02, 0]),
      top: createOrtho([0, 8.5, -0.02], [0, 0, -0.02], [-1, 0, 0]),
    };

    this.orthoState = {
      right: { zoom: 1, targetZoom: 1, panX: 0, panY: 0, targetPanX: 0, targetPanY: 0, reqW: 6.05, reqH: 2.62 },
      left: { zoom: 1, targetZoom: 1, panX: 0, panY: 0, targetPanX: 0, targetPanY: 0, reqW: 6.05, reqH: 2.62 },
      front: { zoom: 1, targetZoom: 1, panX: 0, panY: 0, targetPanX: 0, targetPanY: 0, reqW: 3.15, reqH: 2.62 },
      rear: { zoom: 1, targetZoom: 1, panX: 0, panY: 0, targetPanX: 0, targetPanY: 0, reqW: 3.15, reqH: 2.62 },
      top: { zoom: 1, targetZoom: 1, panX: 0, panY: 0, targetPanX: 0, targetPanY: 0, reqW: 6.15, reqH: 2.85 },
    };

    // Dedicated Layer 1 raycasting for interactive parts only
    this.raycaster.layers.set(1);

    // Pre-warm shaders on hardware GPUs
    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.perspCamera);
    }

    // 8. Event Listeners & ResizeObserver
    this.boundPointerDown = this.handlePointerDown.bind(this);
    this.boundPointerMove = this.handlePointerMove.bind(this);
    this.boundPointerUp = this.handlePointerUp.bind(this);
    this.boundWheel = this.handleWheel.bind(this);
    this.boundDblClick = this.handleDoubleClick.bind(this);
    this.boundContextLost = (e: Event) => {
      e.preventDefault();
      this.callbacks.onContextLost(true);
    };
    this.boundContextRestored = () => {
      this.callbacks.onContextLost(false);
      this.requestRender();
    };

    canvas.addEventListener('pointerdown', this.boundPointerDown, { capture: true });
    window.addEventListener('pointermove', this.boundPointerMove);
    window.addEventListener('pointerup', this.boundPointerUp);
    canvas.addEventListener('wheel', this.boundWheel, { passive: false, capture: true });
    canvas.addEventListener('dblclick', this.boundDblClick);
    canvas.addEventListener('webglcontextlost', this.boundContextLost);
    canvas.addEventListener('webglcontextrestored', this.boundContextRestored);

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(container);

    this.applyStudioEnvironment(this.state.studioEnv);
    this.reportAzimuth();
    this.requestRender();
  }

  public updateState(nextState: HiAceSceneState, triggerResetGlide = false): void {
    const prev = this.state;
    this.state = { ...nextState };

    if (prev.studioEnv !== nextState.studioEnv) {
      this.applyStudioEnvironment(nextState.studioEnv);
    }

    const is360 = nextState.layoutMode === '360';
    this.controls.enabled = is360;
    this.controls.autoRotate = !this.isSoftwareGl && is360 && nextState.autoSpin;

    if (is360 && (triggerResetGlide || prev.layoutMode !== '360')) {
      this.start360HeroTransition();
    }

    this.requestRender();
  }

  public resetAllCameras(): void {
    this.start360HeroTransition();
    (Object.keys(this.orthoState) as OrthoKey[]).forEach((k) => {
      const cfg = this.orthoState[k];
      cfg.targetZoom = 1;
      cfg.targetPanX = 0;
      cfg.targetPanY = 0;
      if (this.isSoftwareGl) {
        cfg.zoom = 1;
        cfg.panX = 0;
        cfg.panY = 0;
      }
    });
    this.requestRender();
  }

  /**
   * Smoothly orbits the 360° camera around the van by deltaDeg degrees.
   */
  public stepOrbit360(deltaDeg: number): void {
    const rad = THREE.MathUtils.degToRad(deltaDeg);
    _orbitOffset.subVectors(this.perspCamera.position, this.controls.target);
    const cosA = Math.cos(rad);
    const sinA = Math.sin(rad);
    const nextX = _orbitOffset.x * cosA + _orbitOffset.z * sinA;
    const nextZ = -_orbitOffset.x * sinA + _orbitOffset.z * cosA;
    this.transitionGoalTarget.copy(this.controls.target);
    this.transitionGoalPos.set(
      this.controls.target.x + nextX,
      this.perspCamera.position.y,
      this.controls.target.z + nextZ,
    );

    if (this.isSoftwareGl) {
      this.perspCamera.position.copy(this.transitionGoalPos);
      this.controls.update();
      this.cameraTransitionActive = false;
      this.reportAzimuth();
    } else {
      this.cameraTransitionActive = true;
    }
    this.requestRender();
  }

  public start360HeroTransition(): void {
    this.transitionGoalPos.set(...HERO_360_PRESET.pos);
    this.transitionGoalTarget.set(...HERO_360_PRESET.target);

    if (this.isSoftwareGl) {
      this.perspCamera.position.copy(this.transitionGoalPos);
      this.controls.target.copy(this.transitionGoalTarget);
      this.controls.update();
      this.cameraTransitionActive = false;
      this.reportAzimuth();
    } else {
      this.cameraTransitionActive = true;
    }
    this.requestRender();
  }

  private reportAzimuth(): void {
    if (!this.callbacks.onAzimuthChange) return;
    const dx = this.perspCamera.position.x - this.controls.target.x;
    const dz = this.perspCamera.position.z - this.controls.target.z;
    const rawDeg = THREE.MathUtils.radToDeg(Math.atan2(dx, dz));
    const normalized = ((Math.round(rawDeg) % 360) + 360) % 360;
    if (normalized !== this.lastReportedAzimuth) {
      this.lastReportedAzimuth = normalized;
      this.callbacks.onAzimuthChange(normalized);
    }
  }

  private applyStudioEnvironment(env: 'obsidian' | 'daylight'): void {
    this.studio.applyTheme(env, this.scene, this.fog);
    if (env === 'daylight') {
      this.renderer.toneMappingExposure = 1.04;
      this.hemiLight.color.set(0xffffff);
      this.hemiLight.groundColor.set(0xd2d8e2);
      this.hemiLight.intensity = 1.12;
      this.keyLight.intensity = 1.85;
      this.rimLight.intensity = 0.85;
      this.fillLight.intensity = 0.68;
    } else {
      this.renderer.toneMappingExposure = 1.08;
      this.hemiLight.color.set(0xdbe8ff);
      this.hemiLight.groundColor.set(0x1e242e);
      this.hemiLight.intensity = 0.85;
      this.keyLight.intensity = 2.35;
      this.rimLight.intensity = 1.3;
      this.fillLight.intensity = 0.54;
    }
    this.requestRender();
  }

  private handleResize(): void {
    if (this.disposed) return;
    const w = Math.max(this.container.clientWidth, 1);
    const h = Math.max(this.container.clientHeight, 1);
    if (w === this.width && h === this.height) return;
    this.width = w;
    this.height = h;
    this.renderer.setSize(w, h, false);
    this.requestRender();
  }

  private getPaneAtClientPos(clientX: number, clientY: number): {
    pane: ViewportPane;
    localX: number;
    localY: number;
    paneW: number;
    paneH: number;
  } {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (this.state.layoutMode === '360') {
      return {
        pane: '360',
        localX: x,
        localY: y,
        paneW: rect.width,
        paneH: rect.height,
      };
    }

    if (this.state.layoutMode === 'single') {
      return {
        pane: this.state.activeSingleView,
        localX: x,
        localY: y,
        paneW: rect.width,
        paneH: rect.height,
      };
    }

    // 4-View Grid Matching Reference Sheet:
    // Top-Left: Right Side | Top-Right: Left Side
    // Bottom-Left: Front   | Bottom-Right: Rear
    const halfW = rect.width * 0.5;
    const halfH = rect.height * 0.5;
    const isRight = x >= halfW;
    const isBottom = y >= halfH;

    if (!isRight && !isBottom) {
      return { pane: 'right', localX: x, localY: y, paneW: halfW, paneH: halfH };
    }
    if (isRight && !isBottom) {
      return { pane: 'left', localX: x - halfW, localY: y, paneW: halfW, paneH: halfH };
    }
    if (!isRight && isBottom) {
      return { pane: 'front', localX: x, localY: y - halfH, paneW: halfW, paneH: halfH };
    }
    return {
      pane: 'rear',
      localX: x - halfW,
      localY: y - halfH,
      paneW: halfW,
      paneH: halfH,
    };
  }

  private handlePointerDown(e: PointerEvent): void {
    this.pointerDownPos = { x: e.clientX, y: e.clientY };
    const hit = this.getPaneAtClientPos(e.clientX, e.clientY);

    if (hit.pane === '360') {
      this.controls.enabled = true;
      this.activeOrthoDrag = null;
    } else {
      // Enable smooth pan on orthographic quadrants while blocking OrbitControls
      this.controls.enabled = false;
      const cfg = this.orthoState[hit.pane];
      this.activeOrthoDrag = {
        key: hit.pane,
        startX: e.clientX,
        startY: e.clientY,
        startPanX: cfg.targetPanX,
        startPanY: cfg.targetPanY,
        viewportW: hit.paneW,
        viewportH: hit.paneH,
      };
    }
  }

  private handlePointerMove(e: PointerEvent): void {
    if (this.activeOrthoDrag) {
      const drag = this.activeOrthoDrag;
      const cfg = this.orthoState[drag.key];
      const aspect = Math.max(drag.viewportW / Math.max(drag.viewportH, 1), 0.2);
      let viewH = cfg.reqH;
      let viewW = viewH * aspect;
      if (viewW < cfg.reqW) {
        viewW = cfg.reqW;
        viewH = viewW / aspect;
      }

      const dxWorld = -((e.clientX - drag.startX) / Math.max(drag.viewportW, 1)) * (viewW / cfg.zoom);
      const dyWorld = ((e.clientY - drag.startY) / Math.max(drag.viewportH, 1)) * (viewH / cfg.zoom);

      cfg.targetPanX = THREE.MathUtils.clamp(drag.startPanX + dxWorld, -2.8, 2.8);
      cfg.targetPanY = THREE.MathUtils.clamp(drag.startPanY + dyWorld, -1.8, 1.8);
      if (this.isSoftwareGl) {
        cfg.panX = cfg.targetPanX;
        cfg.panY = cfg.targetPanY;
      }
      this.requestRender();
      return;
    }

    // Throttled hover raycast across BOTH 360° perspective and all 4 orthographic views
    const now = performance.now();
    if (now - this.lastHoverRaycastMs < 48) return;
    this.lastHoverRaycastMs = now;

    const hit = this.getPaneAtClientPos(e.clientX, e.clientY);
    const part = this.raycastPane(hit.pane, hit.localX, hit.localY, hit.paneW, hit.paneH);
    if (part !== this.hoveredPartId) {
      this.hoveredPartId = part;
      this.renderer.domElement.style.cursor = part ? 'pointer' : 'grab';
      if (part) {
        this.callbacks.onPartHover({
          id: part,
          label: PART_LABELS[part].label,
          actionHint: PART_LABELS[part].hint,
          screenX: e.clientX,
          screenY: e.clientY,
        });
      } else {
        this.callbacks.onPartHover(null);
      }
    } else if (part) {
      this.callbacks.onPartHover({
        id: part,
        label: PART_LABELS[part].label,
        actionHint: PART_LABELS[part].hint,
        screenX: e.clientX,
        screenY: e.clientY,
      });
    }
  }

  private handlePointerUp(e: PointerEvent): void {
    const moved = Math.hypot(
      e.clientX - this.pointerDownPos.x,
      e.clientY - this.pointerDownPos.y,
    );
    this.activeOrthoDrag = null;
    this.controls.enabled = this.state.layoutMode === '360';

    // Trigger interactive vehicle part toggle on clean click (< 6px drag) in any view
    if (moved < 6) {
      const hit = this.getPaneAtClientPos(e.clientX, e.clientY);
      const part = this.raycastPane(hit.pane, hit.localX, hit.localY, hit.paneW, hit.paneH);
      if (part) {
        this.callbacks.onPartClick(part);
      }
    }
  }

  private handleWheel(e: WheelEvent): void {
    const hit = this.getPaneAtClientPos(e.clientX, e.clientY);
    if (hit.pane === '360') {
      this.controls.enabled = true;
      return;
    }

    // Zoom only the hovered orthographic CAD elevation pane
    e.preventDefault();
    e.stopImmediatePropagation();
    this.controls.enabled = false;

    const cfg = this.orthoState[hit.pane];
    const factor = e.deltaY > 0 ? 0.9 : 1.11;
    cfg.targetZoom = THREE.MathUtils.clamp(cfg.targetZoom * factor, 0.58, 2.6);
    if (this.isSoftwareGl) {
      cfg.zoom = cfg.targetZoom;
    }
    this.requestRender();
  }

  private handleDoubleClick(e: MouseEvent): void {
    const hit = this.getPaneAtClientPos(e.clientX, e.clientY);
    if (hit.pane === '360') {
      this.start360HeroTransition();
    } else {
      const cfg = this.orthoState[hit.pane];
      cfg.targetZoom = 1;
      cfg.targetPanX = 0;
      cfg.targetPanY = 0;
      if (this.isSoftwareGl) {
        cfg.zoom = 1;
        cfg.panX = 0;
        cfg.panY = 0;
      }
      this.requestRender();
    }
  }

  private raycastPane(
    pane: ViewportPane,
    localX: number,
    localY: number,
    paneW: number,
    paneH: number,
  ): InteractivePartId | null {
    if (paneW <= 1 || paneH <= 1) return null;
    _mouseNdc.x = (localX / paneW) * 2 - 1;
    _mouseNdc.y = -(localY / paneH) * 2 + 1;

    if (pane === '360') {
      this.perspCamera.aspect = paneW / paneH;
      this.perspCamera.updateProjectionMatrix();
      this.raycaster.setFromCamera(_mouseNdc, this.perspCamera);
    } else {
      this.updateOrthoFrustum(pane, paneW, paneH);
      this.raycaster.setFromCamera(_mouseNdc, this.orthoCameras[pane]);
    }

    const hits = this.raycaster.intersectObjects(this.model.interactiveTargets, false);
    if (hits.length > 0) {
      const part = hits[0].object.userData.interactivePart as InteractivePartId | undefined;
      return part ?? null;
    }
    return null;
  }

  private updateOrthoFrustum(key: OrthoKey, vw: number, vh: number): void {
    const cam = this.orthoCameras[key];
    const cfg = this.orthoState[key];
    const aspect = Math.max(vw / Math.max(vh, 1), 0.2);

    let viewH = cfg.reqH;
    let viewW = viewH * aspect;
    if (viewW < cfg.reqW) {
      viewW = cfg.reqW;
      viewH = viewW / aspect;
    }

    const halfH = (viewH * 0.5) / cfg.zoom;
    const halfW = (viewW * 0.5) / cfg.zoom;
    cam.left = -halfW + cfg.panX;
    cam.right = halfW + cfg.panX;
    cam.top = halfH + cfg.panY;
    cam.bottom = -halfH + cfg.panY;
    cam.updateProjectionMatrix();
  }

  /**
   * Coalesced on-demand render scheduler with WebGL2 fenceSync pacing on software WebGL.
   */
  public requestRender(): void {
    if (this.disposed) return;
    if (this.renderBusy) {
      this.renderDirty = true;
      return;
    }

    this.renderBusy = true;
    this.frameId = requestAnimationFrame(() => {
      if (this.disposed) return;
      this.renderDirty = false;

      const now = performance.now();
      const dt = Math.min((now - this.lastTickTime) / 1000, 0.08);
      this.lastTickTime = now;

      const keepRunning = this.stepSimulation(dt);
      this.renderFrame();

      const done = () => {
        if (this.disposed) return;
        this.renderBusy = false;
        if (this.renderDirty || keepRunning) {
          this.requestRender();
        }
      };

      if (this.isSoftwareGl) {
        this.afterDraw(done);
      } else {
        done();
      }
    });
  }

  private stepSimulation(dt: number): boolean {
    let active = false;

    // 1. Update model kinematics (sliding door, tailgate, struts, lights, wheel steer)
    if (this.model.update(dt, this.state)) {
      active = true;
    }

    // 2. Smooth exponential 360° camera transition
    if (this.cameraTransitionActive) {
      const k = 7.2;
      const alpha = 1 - Math.exp(-k * dt);
      _targetPos.copy(this.perspCamera.position).lerp(this.transitionGoalPos, alpha);
      _targetLook.copy(this.controls.target).lerp(this.transitionGoalTarget, alpha);

      this.perspCamera.position.copy(_targetPos);
      this.controls.target.copy(_targetLook);

      if (
        this.perspCamera.position.distanceToSquared(this.transitionGoalPos) < 0.00015 &&
        this.controls.target.distanceToSquared(this.transitionGoalTarget) < 0.00015
      ) {
        this.perspCamera.position.copy(this.transitionGoalPos);
        this.controls.target.copy(this.transitionGoalTarget);
        this.cameraTransitionActive = false;
      } else {
        active = true;
      }
    }

    // 3. OrbitControls damping & continuous 360° auto-spin
    if (this.state.layoutMode === '360') {
      const prevX = this.perspCamera.position.x;
      const prevY = this.perspCamera.position.y;
      const prevZ = this.perspCamera.position.z;
      this.controls.update();
      this.reportAzimuth();
      if (
        this.controls.autoRotate ||
        Math.abs(this.perspCamera.position.x - prevX) +
          Math.abs(this.perspCamera.position.y - prevY) +
          Math.abs(this.perspCamera.position.z - prevZ) >
          0.00015
      ) {
        active = true;
      }
    }

    // 4. Damped orthographic zoom/pan
    if (!this.isSoftwareGl) {
      const keys: OrthoKey[] = ['right', 'left', 'front', 'rear', 'top'];
      for (let i = 0; i < keys.length; i++) {
        const cfg = this.orthoState[keys[i]];
        cfg.zoom = THREE.MathUtils.damp(cfg.zoom, cfg.targetZoom, 10, dt);
        cfg.panX = THREE.MathUtils.damp(cfg.panX, cfg.targetPanX, 12, dt);
        cfg.panY = THREE.MathUtils.damp(cfg.panY, cfg.targetPanY, 12, dt);

        if (
          Math.abs(cfg.zoom - cfg.targetZoom) > 0.0008 ||
          Math.abs(cfg.panX - cfg.targetPanX) > 0.0008 ||
          Math.abs(cfg.panY - cfg.targetPanY) > 0.0008
        ) {
          active = true;
        } else {
          cfg.zoom = cfg.targetZoom;
          cfg.panX = cfg.targetPanX;
          cfg.panY = cfg.targetPanY;
        }
      }
    }

    return active;
  }

  private renderFrame(): void {
    const w = this.width;
    const h = this.height;

    // Mode 1: Interactive 360° Full-Viewport Showroom
    if (this.state.layoutMode === '360') {
      this.studio.setReflectorVisible(true);
      this.renderer.setScissorTest(false);
      this.renderer.setViewport(0, 0, w, h);
      this.renderer.clear();
      this.perspCamera.aspect = w / Math.max(h, 1);
      this.perspCamera.updateProjectionMatrix();
      this.renderer.render(this.scene, this.perspCamera);
      return;
    }

    // Mode 2: Full-Viewport True Orthographic Elevation (Right / Left / Front / Rear / Top)
    if (this.state.layoutMode === 'single') {
      this.studio.setReflectorVisible(false);
      this.renderer.setScissorTest(false);
      this.renderer.setViewport(0, 0, w, h);
      this.renderer.clear();
      this.updateOrthoFrustum(this.state.activeSingleView, w, h);
      this.renderer.render(this.scene, this.orthoCameras[this.state.activeSingleView]);
      return;
    }

    // Mode 3: Synchronized 4-View Orthographic Sheet in a SINGLE WebGL Context
    // Top-Left: Right Side | Top-Right: Left Side | Bottom-Left: Front | Bottom-Right: Rear
    const halfW = Math.floor(w * 0.5);
    const halfH = Math.floor(h * 0.5);
    const rightW = w - halfW;
    const bottomH = h - halfH;

    this.studio.setReflectorVisible(false);
    this.renderer.setScissorTest(true);

    // Quadrant 1 (Top-Left): Right Side View (-X -> +X, van facing right)
    this.renderer.setViewport(0, bottomH, halfW, halfH);
    this.renderer.setScissor(0, bottomH, halfW, halfH);
    this.renderer.clear();
    this.updateOrthoFrustum('right', halfW, halfH);
    this.renderer.render(this.scene, this.orthoCameras.right);

    // Quadrant 2 (Top-Right): Left Side View (+X -> -X, van facing left)
    this.renderer.setViewport(halfW, bottomH, rightW, halfH);
    this.renderer.setScissor(halfW, bottomH, rightW, halfH);
    this.renderer.clear();
    this.updateOrthoFrustum('left', rightW, halfH);
    this.renderer.render(this.scene, this.orthoCameras.left);

    // Quadrant 3 (Bottom-Left): Front View (+Z -> -Z)
    this.renderer.setViewport(0, 0, halfW, bottomH);
    this.renderer.setScissor(0, 0, halfW, bottomH);
    this.renderer.clear();
    this.updateOrthoFrustum('front', halfW, bottomH);
    this.renderer.render(this.scene, this.orthoCameras.front);

    // Quadrant 4 (Bottom-Right): Rear View (-Z -> +Z)
    this.renderer.setViewport(halfW, 0, rightW, bottomH);
    this.renderer.setScissor(halfW, 0, rightW, bottomH);
    this.renderer.clear();
    this.updateOrthoFrustum('rear', rightW, bottomH);
    this.renderer.render(this.scene, this.orthoCameras.rear);

    this.renderer.setScissorTest(false);
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (typeof gl.fenceSync !== 'function') {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) {
        if (sync) gl.deleteSync(sync);
        return;
      }
      const status = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (status === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.resizeObserver.disconnect();

    const canvas = this.renderer.domElement;
    canvas.removeEventListener('pointerdown', this.boundPointerDown, { capture: true });
    window.removeEventListener('pointermove', this.boundPointerMove);
    window.removeEventListener('pointerup', this.boundPointerUp);
    canvas.removeEventListener('wheel', this.boundWheel, { capture: true });
    canvas.removeEventListener('dblclick', this.boundDblClick);
    canvas.removeEventListener('webglcontextlost', this.boundContextLost);
    canvas.removeEventListener('webglcontextrestored', this.boundContextRestored);

    this.controls.dispose();
    this.model.dispose();
    this.studio.dispose();
    this.textures.dispose();
    this.renderer.dispose();

    if (canvas.parentElement === this.container) {
      this.container.removeChild(canvas);
    }
  }
}
