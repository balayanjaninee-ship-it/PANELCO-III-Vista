import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { StudioEnvironment } from '../types/hiace';
import { ProceduralTextureSet } from './textures';

export interface CycloramaStudioRig {
  group: THREE.Group;
  envDark: THREE.Texture;
  envLight: THREE.Texture;
  setReflectorVisible: (visible: boolean) => void;
  applyTheme: (env: StudioEnvironment, scene: THREE.Scene, fog: THREE.Fog) => void;
  dispose: () => void;
}

/**
 * Generates a high-contrast virtual automotive photography lightbox scene
 * baked into PMREM for crisp elongated gallery/showroom reflections on clearcoat & chrome.
 */
function buildAutomotiveLightboxPMREM(
  renderer: THREE.WebGLRenderer,
  variant: 'obsidian' | 'daylight',
): THREE.WebGLRenderTarget {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const lightbox = new THREE.Scene();

  const baseRoom = new RoomEnvironment();
  baseRoom.scale.setScalar(1.35);
  lightbox.add(baseRoom);

  const isLight = variant === 'daylight';
  lightbox.background = new THREE.Color(isLight ? 0xeef2f7 : 0x070a0f);

  const disposableGeoms: THREE.BufferGeometry[] = [];
  const disposableMats: THREE.Material[] = [];

  const addPanel = (
    w: number,
    h: number,
    pos: [number, number, number],
    look: [number, number, number],
    colorHex: number,
    intensity: number,
  ) => {
    const geom = new THREE.PlaneGeometry(w, h);
    const col = new THREE.Color(colorHex).multiplyScalar(intensity);
    const mat = new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide });
    disposableGeoms.push(geom);
    disposableMats.push(mat);
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(...pos);
    mesh.lookAt(...look);
    lightbox.add(mesh);
  };

  // 1. Primary elongated overhead studio LED lightbank
  addPanel(4.2, 14.5, [0, 7.2, 0], [0, 0, 0], 0xffffff, isLight ? 2.6 : 4.2);

  // 2. Twin flank horizon light-ribbons (defines door contours & clearcoat sweep)
  addPanel(16.0, 1.5, [10.5, 2.35, 0], [0, 1.4, 0], 0xf6faff, isLight ? 2.2 : 3.5);
  addPanel(16.0, 1.5, [-10.5, 2.35, 0], [0, 1.4, 0], 0xf2f7ff, isLight ? 2.0 : 3.2);

  // 3. Sculptural front-3/4 key softbox
  addPanel(6.8, 3.8, [6.5, 4.4, 8.2], [0, 1.0, 0], isLight ? 0xfffaf2 : 0xfff3e0, isLight ? 2.1 : 3.4);

  // 4. Cool rear-3/4 edge rim softbox
  addPanel(7.5, 2.8, [-6.5, 3.8, -8.5], [0, 1.0, 0], 0xd8e8ff, isLight ? 1.9 : 3.1);

  // 5. Subtle dark bounce flags in bright gallery mode so chrome & white edges show rich tonal depth
  if (isLight) {
    addPanel(10.0, 2.2, [0, 1.2, 11.5], [0, 1.0, 0], 0x4b5563, 0.55);
    addPanel(10.0, 2.2, [0, 1.2, -11.5], [0, 1.0, 0], 0x4b5563, 0.55);
  } else {
    addPanel(1.2, 12.0, [4.2, 6.2, 0], [0, 0.8, 0], 0xeaf1fb, 2.5);
    addPanel(1.2, 12.0, [-4.2, 6.2, 0], [0, 0.8, 0], 0xeaf1fb, 2.5);
  }

  const rt = pmrem.fromScene(lightbox, 0.035);

  disposableGeoms.forEach((g) => g.dispose());
  disposableMats.forEach((m) => m.dispose());
  baseRoom.dispose();
  pmrem.dispose();

  return rt;
}

/**
 * Builds a seamless 360-degree curved infinity cyclorama studio dome +
 * clean white press-gallery / dark obsidian reflective showroom floor.
 */
export function createCycloramaStudio(
  renderer: THREE.WebGLRenderer,
  textures: ProceduralTextureSet,
  isSoftwareGl: boolean,
): CycloramaStudioRig {
  const group = new THREE.Group();
  group.name = 'AutomotiveCycloramaShowroom';

  const envDarkRT = buildAutomotiveLightboxPMREM(renderer, 'obsidian');
  const envLightRT = buildAutomotiveLightboxPMREM(renderer, 'daylight');

  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  // 1. Seamless Curved Studio Cyclorama Cove Bowl
  const covePts: THREE.Vector2[] = [
    new THREE.Vector2(9.2, -0.02),
    new THREE.Vector2(11.4, 0.04),
    new THREE.Vector2(13.2, 0.42),
    new THREE.Vector2(14.8, 1.45),
    new THREE.Vector2(16.0, 3.4),
    new THREE.Vector2(16.6, 6.4),
    new THREE.Vector2(16.8, 10.5),
  ];
  const coveGeom = new THREE.LatheGeometry(covePts, 56);
  geometries.push(coveGeom);

  const coveMat = new THREE.MeshStandardMaterial({
    color: 0xf4f6f9,
    roughness: 0.94,
    metalness: 0.0,
    side: THREE.BackSide,
    envMapIntensity: 0.3,
  });
  materials.push(coveMat);

  const coveMesh = new THREE.Mesh(coveGeom, coveMat);
  coveMesh.receiveShadow = true;
  group.add(coveMesh);

  // 2. Real-Time Planar Floor Reflector (enabled strictly on Perspective passes for 60fps Quad View)
  let reflector: Reflector | null = null;
  if (!isSoftwareGl) {
    const reflGeom = new THREE.CircleGeometry(10.2, 48);
    geometries.push(reflGeom);
    reflector = new Reflector(reflGeom, {
      clipBias: 0.002,
      textureWidth: 640,
      textureHeight: 640,
      color: 0xe3e8ef,
    });
    reflector.rotation.x = -Math.PI * 0.5;
    reflector.position.y = -0.002;
    group.add(reflector);
  }

  // 3. Seamless Gallery / Showroom Floor Plane
  const floorGeom = new THREE.CircleGeometry(16.5, 56);
  floorGeom.rotateX(-Math.PI * 0.5);
  geometries.push(floorGeom);

  const floorMat = new THREE.MeshStandardMaterial({
    map: textures.floorGridLight,
    roughnessMap: textures.floorMicroRoughness,
    roughness: isSoftwareGl ? 0.46 : 0.34,
    metalness: isSoftwareGl ? 0.08 : 0.05,
    envMapIntensity: isSoftwareGl ? 0.65 : 0.45,
    transparent: !isSoftwareGl,
    opacity: isSoftwareGl ? 1.0 : 0.9,
  });
  materials.push(floorMat);

  const floorMesh = new THREE.Mesh(floorGeom, floorMat);
  floorMesh.position.y = 0.0;
  floorMesh.receiveShadow = true;
  group.add(floorMesh);

  // 4. Overhead Suspended Showroom Lightbar Archway (shown cleanly in Obsidian perspective shots)
  const lightBarGroup = new THREE.Group();
  const barGeom = new THREE.BoxGeometry(0.18, 0.035, 6.2);
  geometries.push(barGeom);
  const barEmissiveMat = new THREE.MeshBasicMaterial({ color: 0xeef5ff });
  materials.push(barEmissiveMat);

  for (const bx of [-1.25, 0, 1.25]) {
    const bar = new THREE.Mesh(barGeom, barEmissiveMat);
    bar.position.set(bx, 4.75, -0.05);
    lightBarGroup.add(bar);
  }
  group.add(lightBarGroup);

  let currentTheme: StudioEnvironment = 'daylight';
  let lastPerspectivePass = true;

  const syncFloorOpacity = () => {
    if (!reflector) return;
    if (!lastPerspectivePass) {
      floorMat.opacity = 1.0;
    } else {
      // Bright White Gallery has ultra-clean whisper reflection; Obsidian Showroom has deeper glossy reflection
      floorMat.opacity = currentTheme === 'daylight' ? 0.9 : 0.7;
    }
  };

  // Hide planar reflector & overhead fixtures in orthographic passes (uniform-only, zero shader recompile)
  const setReflectorVisible = (isPerspectivePass: boolean) => {
    lastPerspectivePass = isPerspectivePass;
    if (reflector) {
      reflector.visible = isPerspectivePass;
      syncFloorOpacity();
    }
    lightBarGroup.visible = isPerspectivePass && currentTheme === 'obsidian';
  };

  const applyTheme = (
    env: StudioEnvironment,
    scene: THREE.Scene,
    fog: THREE.Fog,
  ) => {
    currentTheme = env;
    if (env === 'daylight') {
      const bg = new THREE.Color('#f4f6f9');
      scene.background = bg;
      scene.environment = envLightRT.texture;
      fog.color.copy(bg);
      coveMat.color.set('#f6f8fb');
      floorMat.map = textures.floorGridLight;
      floorMat.roughness = isSoftwareGl ? 0.48 : 0.36;
      floorMat.metalness = 0.04;
      floorMat.envMapIntensity = 0.42;
      if (reflector) {
        const reflMat = reflector.material as THREE.ShaderMaterial;
        if (reflMat.uniforms?.color?.value instanceof THREE.Color) {
          reflMat.uniforms.color.value.set(0xe4e9f0);
        }
      }
      lightBarGroup.visible = false;
    } else {
      const bg = new THREE.Color('#0e1218');
      scene.background = bg;
      scene.environment = envDarkRT.texture;
      fog.color.copy(bg);
      coveMat.color.set('#10151d');
      floorMat.map = textures.floorGridDark;
      floorMat.roughness = isSoftwareGl ? 0.36 : 0.22;
      floorMat.metalness = isSoftwareGl ? 0.2 : 0.14;
      floorMat.envMapIntensity = isSoftwareGl ? 1.0 : 0.72;
      barEmissiveMat.color.set('#e8f2ff');
      if (reflector) {
        const reflMat = reflector.material as THREE.ShaderMaterial;
        if (reflMat.uniforms?.color?.value instanceof THREE.Color) {
          reflMat.uniforms.color.value.set(0x687280);
        }
      }
      lightBarGroup.visible = lastPerspectivePass;
    }
    syncFloorOpacity();
    floorMat.needsUpdate = true;
  };

  return {
    group,
    envDark: envDarkRT.texture,
    envLight: envLightRT.texture,
    setReflectorVisible,
    applyTheme,
    dispose: () => {
      envDarkRT.dispose();
      envLightRT.dispose();
      reflector?.dispose();
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}
