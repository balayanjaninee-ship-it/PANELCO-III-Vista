import * as THREE from 'three';
import { HIACE_PAINTS, PaintFinish, RenderStyle, TrimSpec } from '../types/hiace';
import { ProceduralTextureSet } from './textures';

export interface HiAceMaterialLibrary {
  bodyPaint: THREE.MeshPhysicalMaterial;
  bumperMaterial: THREE.MeshPhysicalMaterial;
  centerNoseApron: THREE.MeshPhysicalMaterial;
  grilleBarMaterial: THREE.MeshStandardMaterial;
  mirrorCapMaterial: THREE.MeshStandardMaterial;
  handleMaterial: THREE.MeshStandardMaterial;
  rearGarnishMaterial: THREE.MeshStandardMaterial;
  chrome: THREE.MeshStandardMaterial;
  steelWheelBlack: THREE.MeshStandardMaterial;
  steelHubSilver: THREE.MeshStandardMaterial;
  wheelCoverSilver: THREE.MeshPhysicalMaterial;
  matteBlackTrim: THREE.MeshStandardMaterial;
  glossBlackPillar: THREE.MeshPhysicalMaterial;
  rainVisorGlass: THREE.MeshPhysicalMaterial;
  satinTrack: THREE.MeshStandardMaterial;
  rubberTire: THREE.MeshStandardMaterial;
  rubberSidewall: THREE.MeshStandardMaterial;
  stepPadRubber: THREE.MeshStandardMaterial;
  wheelWellLiner: THREE.MeshStandardMaterial;
  windshieldGlass: THREE.MeshPhysicalMaterial;
  privacyGlass: THREE.MeshPhysicalMaterial;
  headlampLens: THREE.MeshPhysicalMaterial;
  headlampReflector: THREE.MeshStandardMaterial;
  headlampBeam: THREE.MeshStandardMaterial;
  drlStrip: THREE.MeshStandardMaterial;
  amberIndicator: THREE.MeshStandardMaterial;
  taillampRed: THREE.MeshPhysicalMaterial;
  tailLightGuide: THREE.MeshStandardMaterial;
  taillampReverse: THREE.MeshPhysicalMaterial;
  grilleMesh: THREE.MeshStandardMaterial;
  licensePlate: THREE.MeshStandardMaterial;
  hiaceBadge: THREE.MeshStandardMaterial;
  superGlBadge: THREE.MeshStandardMaterial;
  liveryFrontNose: THREE.MeshStandardMaterial;
  liverySideScript: THREE.MeshStandardMaterial;
  liveryDoorCrest: THREE.MeshStandardMaterial;
  liveryRearPanelco: THREE.MeshStandardMaterial;
  liveryRearNumber: THREE.MeshStandardMaterial;
  liveryTrSticker: THREE.MeshStandardMaterial;
  dashCluster: THREE.MeshStandardMaterial;
  brakeDisc: THREE.MeshStandardMaterial;
  brakeCaliper: THREE.MeshStandardMaterial;
  exhaustMetal: THREE.MeshStandardMaterial;
  interiorDash: THREE.MeshStandardMaterial;
  interiorSeat: THREE.MeshStandardMaterial;
  interiorLeather: THREE.MeshStandardMaterial;
  interiorHeadliner: THREE.MeshStandardMaterial;
  cargoFloor: THREE.MeshStandardMaterial;
  panelSeam: THREE.MeshStandardMaterial;
  mirrorGlass: THREE.MeshStandardMaterial;
  edgeLine: THREE.LineBasicMaterial;
  applyPaint: (finish: PaintFinish) => void;
  applyTrimSpec: (trim: TrimSpec) => void;
  setLightsIntensity: (factor: number) => void;
  applyRenderStyle: (style: RenderStyle) => void;
  dispose: () => void;
}

export function createHiAceMaterials(
  textures: ProceduralTextureSet,
  isSoftwareGl: boolean,
): HiAceMaterialLibrary {
  const defaultPaint = HIACE_PAINTS[0];

  // Gloss automotive clearcoat paint with subtle pearl/mica micro-flake normal map
  const bodyPaint = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(defaultPaint.hex),
    metalness: defaultPaint.metalness,
    roughness: defaultPaint.roughness,
    clearcoat: defaultPaint.clearcoat,
    clearcoatRoughness: defaultPaint.clearcoatRoughness,
    normalMap: textures.metallicFlakeNormal,
    normalScale: new THREE.Vector2(defaultPaint.flakeStrength, defaultPaint.flakeStrength),
    reflectivity: 1.0,
    envMapIntensity: 1.38,
  });

  // Switchable Bumper Material: Matte textured charcoal urethane (Cargo DX) ↔ Painted body color (Super GL)
  const bumperMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x1e2228,
    metalness: 0.04,
    roughness: 0.82,
    clearcoat: 0.0,
    clearcoatRoughness: 0.25,
    normalMap: textures.metallicFlakeNormal,
    normalScale: new THREE.Vector2(0, 0),
    envMapIntensity: 0.65,
  });

  // Signature Type IV–VI silver/white trapezoidal lower nose panel between black bumper cheeks
  const centerNoseApron = new THREE.MeshPhysicalMaterial({
    color: 0xe6eaee,
    metalness: 0.28,
    roughness: 0.22,
    clearcoat: 0.9,
    clearcoatRoughness: 0.06,
    envMapIntensity: 1.25,
  });

  // Switchable Grille Bar Material: Metallic silver/satin (Cargo DX) ↔ Mirror Chrome (Super GL)
  const grilleBarMaterial = new THREE.MeshStandardMaterial({
    color: 0xe4e8ed,
    metalness: 0.35,
    roughness: 0.24,
    envMapIntensity: 1.3,
  });

  // Switchable Mirror Cap Material: Textured matte black (Cargo DX) ↔ Polished Chrome (Super GL)
  const mirrorCapMaterial = new THREE.MeshStandardMaterial({
    color: 0x1b1e24,
    metalness: 0.05,
    roughness: 0.78,
    envMapIntensity: 0.7,
  });

  // Switchable Exterior Door Handle Material: Matte black (Cargo DX) ↔ Chrome (Super GL)
  const handleMaterial = new THREE.MeshStandardMaterial({
    color: 0x181b20,
    metalness: 0.06,
    roughness: 0.75,
    envMapIntensity: 0.7,
  });

  // Rear tailgate garnish: Matte black (Cargo DX) ↔ Bright Chrome (Super GL)
  const rearGarnishMaterial = new THREE.MeshStandardMaterial({
    color: 0x1c2026,
    metalness: 0.08,
    roughness: 0.72,
    envMapIntensity: 0.85,
  });

  const chrome = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    metalness: 0.98,
    roughness: 0.06,
    envMapIntensity: 1.8,
  });

  // Cargo DX 15" Stamped Perforated Black Commercial Steel Wheels (Photos 2, 3, 4)
  const steelWheelBlack = new THREE.MeshStandardMaterial({
    color: 0x171a20,
    metalness: 0.52,
    roughness: 0.38,
    envMapIntensity: 1.1,
  });

  const steelHubSilver = new THREE.MeshStandardMaterial({
    color: 0xc9d0d8,
    metalness: 0.82,
    roughness: 0.26,
    envMapIntensity: 1.45,
  });

  // Super GL 15" 6-Spoke Silver OEM Full Wheel Cover (Photo 1)
  const wheelCoverSilver = new THREE.MeshPhysicalMaterial({
    color: 0xd9e0e7,
    metalness: 0.62,
    roughness: 0.22,
    clearcoat: 0.65,
    clearcoatRoughness: 0.12,
    envMapIntensity: 1.35,
  });

  const matteBlackTrim = new THREE.MeshStandardMaterial({
    color: 0x181b20,
    metalness: 0.05,
    roughness: 0.78,
    envMapIntensity: 0.65,
  });

  const glossBlackPillar = new THREE.MeshPhysicalMaterial({
    color: 0x101318,
    metalness: 0.1,
    roughness: 0.18,
    clearcoat: 0.85,
    clearcoatRoughness: 0.09,
    envMapIntensity: 1.35,
  });

  // Translucent smoked-acrylic front door rain visors (Photo 1)
  const rainVisorGlass = new THREE.MeshPhysicalMaterial({
    color: 0x0a0d12,
    metalness: 0.08,
    roughness: 0.06,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    envMapIntensity: 1.8,
    transparent: true,
    opacity: 0.66,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const satinTrack = new THREE.MeshStandardMaterial({
    color: 0x20252d,
    metalness: 0.55,
    roughness: 0.36,
    envMapIntensity: 1.05,
  });

  const rubberTire = new THREE.MeshStandardMaterial({
    color: 0x1e2126,
    metalness: 0.02,
    roughness: 0.88,
    bumpMap: textures.tireTreadBump,
    bumpScale: 0.016,
    envMapIntensity: 0.42,
  });

  const rubberSidewall = new THREE.MeshStandardMaterial({
    map: textures.tireSidewallColor,
    bumpMap: textures.tireSidewallBump,
    bumpScale: 0.009,
    metalness: 0.03,
    roughness: 0.84,
    envMapIntensity: 0.48,
  });

  const stepPadRubber = new THREE.MeshStandardMaterial({
    color: 0x1a1e24,
    metalness: 0.04,
    roughness: 0.84,
    bumpMap: textures.stepPadBump,
    bumpScale: 0.007,
  });

  const wheelWellLiner = new THREE.MeshStandardMaterial({
    color: 0x0b0e12,
    metalness: 0.02,
    roughness: 0.95,
    side: THREE.DoubleSide,
  });

  // Light commuter green-gray front cab & windshield glass (clearly reveals LHD cockpit & seats)
  const windshieldGlass = new THREE.MeshPhysicalMaterial({
    color: 0x3b4f58,
    metalness: 0.06,
    roughness: 0.03,
    clearcoat: 1.0,
    clearcoatRoughness: 0.025,
    reflectivity: 1.0,
    envMapIntensity: 1.85,
    transparent: true,
    opacity: isSoftwareGl ? 0.34 : 0.32,
    depthWrite: false,
  });

  // Light commuter side & rear passenger cabin glass (reveals multi-row commuter seats like sketch)
  const privacyGlass = new THREE.MeshPhysicalMaterial({
    color: 0x2c3c44,
    metalness: 0.08,
    roughness: 0.035,
    clearcoat: 1.0,
    clearcoatRoughness: 0.025,
    reflectivity: 1.0,
    envMapIntensity: 1.9,
    transparent: true,
    opacity: isSoftwareGl ? 0.44 : 0.42,
    depthWrite: false,
  });

  // Bright clear polycarbonate outer headlamp cover (Photos 1, 3, 4)
  const headlampLens = new THREE.MeshPhysicalMaterial({
    color: 0xf8fbff,
    metalness: 0.05,
    roughness: 0.025,
    clearcoat: 1.0,
    clearcoatRoughness: 0.02,
    envMapIntensity: 2.15,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  });

  // Bright silver multi-reflector crystal headlamp interior (Photos 1, 3, 4)
  const headlampReflector = new THREE.MeshStandardMaterial({
    color: 0xe6ecf2,
    metalness: 0.95,
    roughness: 0.09,
    envMapIntensity: 1.8,
  });

  const headlampBeam = new THREE.MeshStandardMaterial({
    color: 0xf6faff,
    emissive: new THREE.Color(0xfff7ea),
    emissiveIntensity: 0.12,
    metalness: 0.3,
    roughness: 0.1,
  });

  const drlStrip = new THREE.MeshStandardMaterial({
    color: 0xf0f6fc,
    emissive: new THREE.Color(0xe6f2ff),
    emissiveIntensity: 0.18,
    metalness: 0.25,
    roughness: 0.15,
  });

  const amberIndicator = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    emissive: new THREE.Color(0xff9214),
    emissiveIntensity: 0.05,
    metalness: 0.2,
    roughness: 0.2,
  });

  const taillampRed = new THREE.MeshPhysicalMaterial({
    color: 0x99121a,
    emissive: new THREE.Color(0xdc1a22),
    emissiveIntensity: 0.12,
    metalness: 0.08,
    roughness: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    envMapIntensity: 1.7,
  });

  const tailLightGuide = new THREE.MeshStandardMaterial({
    color: 0xff2b36,
    emissive: new THREE.Color(0xff1e2a),
    emissiveIntensity: 0.18,
    metalness: 0.05,
    roughness: 0.18,
  });

  const taillampReverse = new THREE.MeshPhysicalMaterial({
    color: 0xdce3ec,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.04,
    metalness: 0.22,
    roughness: 0.12,
    clearcoat: 1.0,
  });

  const grilleMesh = new THREE.MeshStandardMaterial({
    map: textures.grilleMesh,
    bumpMap: textures.grilleMeshBump,
    bumpScale: 0.01,
    metalness: 0.2,
    roughness: 0.65,
  });

  const licensePlate = new THREE.MeshStandardMaterial({
    map: textures.philippinePlate,
    metalness: 0.12,
    roughness: 0.34,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });

  const hiaceBadge = new THREE.MeshStandardMaterial({
    map: textures.hiaceBadge,
    metalness: 0.88,
    roughness: 0.2,
    transparent: true,
    alphaTest: 0.08,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const superGlBadge = new THREE.MeshStandardMaterial({
    map: textures.superGlBadge,
    metalness: 0.85,
    roughness: 0.22,
    transparent: true,
    alphaTest: 0.08,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const createDecalMaterial = (map: THREE.CanvasTexture) =>
    new THREE.MeshStandardMaterial({
      map,
      metalness: 0.04,
      roughness: 0.28,
      transparent: true,
      alphaTest: 0.04,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -3,
    });

  const liveryFrontNose = createDecalMaterial(textures.liveryFrontNose);
  const liverySideScript = createDecalMaterial(textures.liverySideScript);
  const liveryDoorCrest = createDecalMaterial(textures.liveryDoorCrest);
  const liveryRearPanelco = createDecalMaterial(textures.liveryRearPanelco);
  const liveryRearNumber = createDecalMaterial(textures.liveryRearNumber);
  const liveryTrSticker = createDecalMaterial(textures.liveryTrSticker);

  const dashCluster = new THREE.MeshStandardMaterial({
    map: textures.dashCluster,
    emissiveMap: textures.dashCluster,
    emissive: new THREE.Color(0xdbeafe),
    emissiveIntensity: 0.75,
    roughness: 0.3,
    metalness: 0.05,
  });

  const brakeDisc = new THREE.MeshStandardMaterial({
    color: 0x9aa3ae,
    metalness: 0.9,
    roughness: 0.26,
  });

  const brakeCaliper = new THREE.MeshStandardMaterial({
    color: 0x3b434e,
    metalness: 0.62,
    roughness: 0.38,
  });

  const exhaustMetal = new THREE.MeshStandardMaterial({
    color: 0x9aa3ae,
    metalness: 0.88,
    roughness: 0.26,
  });

  const interiorDash = new THREE.MeshStandardMaterial({
    color: 0x262b33,
    metalness: 0.04,
    roughness: 0.82,
  });

  const interiorSeat = new THREE.MeshStandardMaterial({
    color: 0x454c57,
    metalness: 0.02,
    roughness: 0.88,
  });

  const interiorLeather = new THREE.MeshStandardMaterial({
    color: 0x2e343e,
    metalness: 0.04,
    roughness: 0.68,
  });

  const interiorHeadliner = new THREE.MeshStandardMaterial({
    color: 0xcbd2da,
    metalness: 0.02,
    roughness: 0.92,
  });

  const cargoFloor = new THREE.MeshStandardMaterial({
    color: 0x2d333c,
    metalness: 0.05,
    roughness: 0.88,
    bumpMap: textures.stepPadBump,
    bumpScale: 0.005,
  });

  const panelSeam = new THREE.MeshStandardMaterial({
    color: 0x090b0e,
    metalness: 0.06,
    roughness: 0.92,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const mirrorGlass = new THREE.MeshStandardMaterial({
    color: 0xe2eaf2,
    metalness: 0.98,
    roughness: 0.03,
    envMapIntensity: 2.0,
  });

  const edgeLine = new THREE.LineBasicMaterial({
    color: 0x0284c7,
    transparent: true,
    opacity: 0.0,
  });

  const allMaterials: THREE.Material[] = [
    bodyPaint,
    bumperMaterial,
    centerNoseApron,
    grilleBarMaterial,
    mirrorCapMaterial,
    handleMaterial,
    rearGarnishMaterial,
    chrome,
    steelWheelBlack,
    steelHubSilver,
    wheelCoverSilver,
    matteBlackTrim,
    glossBlackPillar,
    rainVisorGlass,
    satinTrack,
    rubberTire,
    rubberSidewall,
    stepPadRubber,
    wheelWellLiner,
    windshieldGlass,
    privacyGlass,
    headlampLens,
    headlampReflector,
    headlampBeam,
    drlStrip,
    amberIndicator,
    taillampRed,
    tailLightGuide,
    taillampReverse,
    grilleMesh,
    licensePlate,
    hiaceBadge,
    superGlBadge,
    liveryFrontNose,
    liverySideScript,
    liveryDoorCrest,
    liveryRearPanelco,
    liveryRearNumber,
    liveryTrSticker,
    dashCluster,
    brakeDisc,
    brakeCaliper,
    exhaustMetal,
    interiorDash,
    interiorSeat,
    interiorLeather,
    interiorHeadliner,
    cargoFloor,
    panelSeam,
    mirrorGlass,
    edgeLine,
  ];

  let currentPaint = defaultPaint;
  let currentTrim: TrimSpec = 'cargo-dx';
  let currentStyle: RenderStyle = 'pbr';

  const syncTrimAndPaint = () => {
    if (currentStyle === 'clay') {
      bodyPaint.color.set(0xbba897);
      bodyPaint.metalness = 0.03;
      bodyPaint.roughness = 0.62;
      bodyPaint.clearcoat = 0.0;
      bodyPaint.normalScale.set(0, 0);

      bumperMaterial.color.set(0xa49282);
      bumperMaterial.metalness = 0.03;
      bumperMaterial.roughness = 0.68;
      bumperMaterial.clearcoat = 0.0;
      bumperMaterial.normalScale.set(0, 0);

      centerNoseApron.color.set(0xbba897);
      centerNoseApron.metalness = 0.03;
      centerNoseApron.roughness = 0.62;
      centerNoseApron.clearcoat = 0.0;
      return;
    }

    if (currentStyle === 'wireframe') {
      bodyPaint.color.set(0x18212d);
      bodyPaint.metalness = 0.2;
      bodyPaint.roughness = 0.48;
      bodyPaint.clearcoat = 0.2;
      bodyPaint.normalScale.set(0, 0);

      bumperMaterial.color.set(0x111822);
      bumperMaterial.metalness = 0.15;
      bumperMaterial.roughness = 0.55;
      bumperMaterial.clearcoat = 0.1;
      bumperMaterial.normalScale.set(0, 0);

      centerNoseApron.color.set(0x1e293b);
      centerNoseApron.metalness = 0.2;
      centerNoseApron.roughness = 0.48;
      centerNoseApron.clearcoat = 0.2;
      return;
    }

    // Studio PBR Mode
    bodyPaint.color.set(currentPaint.hex);
    bodyPaint.metalness = currentPaint.metalness;
    bodyPaint.roughness = currentPaint.roughness;
    bodyPaint.clearcoat = currentPaint.clearcoat;
    bodyPaint.clearcoatRoughness = currentPaint.clearcoatRoughness;
    bodyPaint.normalScale.set(currentPaint.flakeStrength, currentPaint.flakeStrength);

    if (currentTrim === 'cargo-dx') {
      // Cargo DX Facelift (Photos 2, 3, 4): Matte black urethane bumpers, mirrors & handles, silver-white center nose insert
      bumperMaterial.color.set(0x1f2228);
      bumperMaterial.metalness = 0.04;
      bumperMaterial.roughness = 0.82;
      bumperMaterial.clearcoat = 0.0;
      bumperMaterial.normalScale.set(0, 0);
      bumperMaterial.envMapIntensity = 0.65;

      centerNoseApron.color.set(0xe4e8ec);
      centerNoseApron.metalness = 0.28;
      centerNoseApron.roughness = 0.24;
      centerNoseApron.clearcoat = 0.85;

      grilleBarMaterial.color.set(0xe4e8ec);
      grilleBarMaterial.metalness = 0.32;
      grilleBarMaterial.roughness = 0.24;

      mirrorCapMaterial.color.set(0x1b1f25);
      mirrorCapMaterial.metalness = 0.05;
      mirrorCapMaterial.roughness = 0.78;

      handleMaterial.color.set(0x171a20);
      handleMaterial.metalness = 0.05;
      handleMaterial.roughness = 0.76;

      rearGarnishMaterial.color.set(0x1c2026);
      rearGarnishMaterial.metalness = 0.08;
      rearGarnishMaterial.roughness = 0.72;

      licensePlate.map = textures.philippinePlate;
      licensePlate.needsUpdate = true;
    } else {
      // Super GL (Photo 1): Body-colored painted clearcoat bumpers, mirror chrome grille, mirrors, handles & rear garnish
      bumperMaterial.color.set(currentPaint.hex);
      bumperMaterial.metalness = currentPaint.metalness;
      bumperMaterial.roughness = currentPaint.roughness;
      bumperMaterial.clearcoat = currentPaint.clearcoat;
      bumperMaterial.clearcoatRoughness = currentPaint.clearcoatRoughness;
      bumperMaterial.normalScale.set(currentPaint.flakeStrength, currentPaint.flakeStrength);
      bumperMaterial.envMapIntensity = 1.38;

      centerNoseApron.color.set(currentPaint.hex);
      centerNoseApron.metalness = currentPaint.metalness;
      centerNoseApron.roughness = currentPaint.roughness;
      centerNoseApron.clearcoat = currentPaint.clearcoat;

      grilleBarMaterial.color.set(0xf0f4f8);
      grilleBarMaterial.metalness = 0.98;
      grilleBarMaterial.roughness = 0.07;

      mirrorCapMaterial.color.set(0xf0f4f8);
      mirrorCapMaterial.metalness = 0.98;
      mirrorCapMaterial.roughness = 0.07;

      handleMaterial.color.set(0xedf2f7);
      handleMaterial.metalness = 0.96;
      handleMaterial.roughness = 0.08;

      rearGarnishMaterial.color.set(0xedf2f7);
      rearGarnishMaterial.metalness = 0.97;
      rearGarnishMaterial.roughness = 0.07;

      licensePlate.map = textures.philippinePlate;
      licensePlate.needsUpdate = true;
    }
  };

  const applyTrimSpec = (trim: TrimSpec) => {
    currentTrim = trim;
    syncTrimAndPaint();
  };

  const applyPaint = (finish: PaintFinish) => {
    currentPaint = finish;
    syncTrimAndPaint();
  };

  const setLightsIntensity = (factor: number) => {
    const f = THREE.MathUtils.clamp(factor, 0, 1);
    headlampBeam.emissiveIntensity = 0.1 + f * 3.6;
    drlStrip.emissiveIntensity = 0.15 + f * 2.2;
    amberIndicator.emissiveIntensity = 0.04 + f * 0.85;
    taillampRed.emissiveIntensity = 0.12 + f * 1.5;
    tailLightGuide.emissiveIntensity = 0.16 + f * 3.2;
    taillampReverse.emissiveIntensity = 0.04 + f * 0.25;
    dashCluster.emissiveIntensity = 0.15 + f * 0.9;
  };

  const applyRenderStyle = (style: RenderStyle) => {
    currentStyle = style;
    const isWire = style === 'wireframe';
    syncTrimAndPaint();
    edgeLine.opacity = isWire ? 0.72 : 0.0;
  };

  syncTrimAndPaint();

  return {
    bodyPaint,
    bumperMaterial,
    centerNoseApron,
    grilleBarMaterial,
    mirrorCapMaterial,
    handleMaterial,
    rearGarnishMaterial,
    chrome,
    steelWheelBlack,
    steelHubSilver,
    wheelCoverSilver,
    matteBlackTrim,
    glossBlackPillar,
    rainVisorGlass,
    satinTrack,
    rubberTire,
    rubberSidewall,
    stepPadRubber,
    wheelWellLiner,
    windshieldGlass,
    privacyGlass,
    headlampLens,
    headlampReflector,
    headlampBeam,
    drlStrip,
    amberIndicator,
    taillampRed,
    tailLightGuide,
    taillampReverse,
    grilleMesh,
    licensePlate,
    hiaceBadge,
    superGlBadge,
    liveryFrontNose,
    liverySideScript,
    liveryDoorCrest,
    liveryRearPanelco,
    liveryRearNumber,
    liveryTrSticker,
    dashCluster,
    brakeDisc,
    brakeCaliper,
    exhaustMetal,
    interiorDash,
    interiorSeat,
    interiorLeather,
    interiorHeadliner,
    cargoFloor,
    panelSeam,
    mirrorGlass,
    edgeLine,
    applyPaint,
    applyTrimSpec,
    setLightsIntensity,
    applyRenderStyle,
    dispose: () => {
      allMaterials.forEach((m) => m.dispose());
    },
  };
}
