import * as THREE from 'three';
import { HIACE_DIMENSIONS, InteractivePartId, RenderStyle, TrimSpec } from '../../types/hiace';
import { HiAceMaterialLibrary } from '../materials';
import {
  createTumblehomeQuadGeometry,
  hiaceFrontZAtY,
  hiaceHalfWidthAtY,
} from './bodyShell';

export interface HiAceExteriorDetailsResult {
  group: THREE.Group;
  slidingDoorGroup: THREE.Group;
  tailgatePivot: THREE.Group;
  tailgateStruts: { left: THREE.Mesh; right: THREE.Mesh };
  interactiveTargets: THREE.Object3D[];
  edgeOverlays: THREE.LineSegments[];
  setTrimSpec: (trim: TrimSpec) => void;
  setRenderStyle: (renderStyle: RenderStyle) => void;
  dispose: () => void;
}

/**
 * Builds the recognizable 3-ring Toyota oval emblem in polished chrome.
 */
function buildToyotaEmblem(
  chromeMat: THREE.Material,
  backingMat: THREE.Material,
  scale: number,
  trackGeom: <T extends THREE.BufferGeometry>(g: T) => T,
): THREE.Group {
  const g = new THREE.Group();

  const backGeom = trackGeom(new THREE.CylinderGeometry(0.066, 0.066, 0.008, 28));
  backGeom.rotateX(Math.PI * 0.5);
  backGeom.scale(1.44, 0.96, 1);
  const back = new THREE.Mesh(backGeom, backingMat);
  back.position.z = -0.002;
  g.add(back);

  const outerGeom = trackGeom(new THREE.TorusGeometry(0.064, 0.0078, 10, 32));
  outerGeom.scale(1.45, 0.96, 0.8);
  const outer = new THREE.Mesh(outerGeom, chromeMat);
  outer.position.z = 0.005;
  g.add(outer);

  const vertGeom = trackGeom(new THREE.TorusGeometry(0.051, 0.0066, 10, 24));
  vertGeom.scale(0.42, 1.0, 0.8);
  const vert = new THREE.Mesh(vertGeom, chromeMat);
  vert.position.z = 0.005;
  g.add(vert);

  const horizGeom = trackGeom(new THREE.TorusGeometry(0.047, 0.0062, 10, 24));
  horizGeom.scale(1.18, 0.42, 0.8);
  const horiz = new THREE.Mesh(horizGeom, chromeMat);
  horiz.position.set(0, 0.022, 0.005);
  g.add(horiz);

  g.scale.setScalar(scale);
  return g;
}

/**
 * Builds a clean wraparound bumper shell projecting along +Z.
 */
function createWraparoundBumperGeometry(
  width: number,
  height: number,
  depth: number,
  cornerRadius: number,
): THREE.BufferGeometry {
  const hw = width * 0.5;
  const cr = Math.min(cornerRadius, hw * 0.34, depth * 0.85);
  const shape = new THREE.Shape();

  shape.moveTo(-hw, 0);
  shape.lineTo(-hw, depth - cr);
  shape.quadraticCurveTo(-hw, depth, -hw + cr, depth);
  shape.lineTo(hw - cr, depth);
  shape.quadraticCurveTo(hw, depth, hw, depth - cr);
  shape.lineTo(hw, 0);
  shape.lineTo(hw - 0.14, 0);
  shape.lineTo(hw - 0.14, depth - 0.16);
  shape.lineTo(-hw + 0.14, depth - 0.16);
  shape.lineTo(-hw + 0.14, 0);
  shape.closePath();

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: true,
    bevelThickness: 0.016,
    bevelSize: 0.013,
    bevelSegments: 4,
    curveSegments: 20,
  });

  geom.rotateX(Math.PI * 0.5);
  geom.translate(0, height, 0);
  return geom;
}

/**
 * Builds the contoured lower door skin for the animated +X sliding door
 * rising cleanly up to the raised 1.28m H200 side window sill.
 */
function createContouredSlidingDoorSkin(): THREE.BufferGeometry {
  const yLevels = [0.305, 0.35, 0.42, 0.50, 0.64, 0.80, 0.96, 1.08, 1.12, 1.19, 1.25, 1.292];
  const zCols = 14;
  const zStart = -0.775;
  const zEnd = 0.558;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let r = 0; r < yLevels.length; r++) {
    const y = yLevels[r];
    const x = hiaceHalfWidthAtY(y) + 0.002;
    for (let c = 0; c <= zCols; c++) {
      const u = c / zCols;
      const z = THREE.MathUtils.lerp(zStart, zEnd, u);
      positions.push(x, y, z);
      uvs.push(u, r / (yLevels.length - 1));
    }
  }

  const stride = zCols + 1;
  for (let r = 0; r < yLevels.length - 1; r++) {
    for (let c = 0; c < zCols; c++) {
      const a = r * stride + c;
      const b = a + 1;
      const d = (r + 1) * stride + c;
      const e = d + 1;
      indices.push(a, d, b);
      indices.push(b, d, e);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Builds a vertically contoured side decal strip following exact hiaceHalfWidthAtY(y)
 * door curvature with non-mirrored left-to-right UVs and outward-facing normals on both
 * Left (+X, front=+Z on screen-left) and Right (-X, rear=-Z on screen-left) elevations.
 */
function createContouredSideDecalGeometry(
  sideSign: 1 | -1,
  zMin: number,
  zMax: number,
  yMin: number,
  yMax: number,
  outwardOffset: number,
): THREE.BufferGeometry {
  const cols = 12;
  const rows = 8;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let r = 0; r < rows; r++) {
    const v = r / (rows - 1);
    const y = THREE.MathUtils.lerp(yMin, yMax, v);
    const x = sideSign * (hiaceHalfWidthAtY(y) + outwardOffset);

    for (let c = 0; c < cols; c++) {
      const u = c / (cols - 1);
      // Left side (+X): screen-left is +Z (nose), screen-right is -Z (rear)
      // Right side (-X): screen-left is -Z (rear), screen-right is +Z (nose)
      const z =
        sideSign > 0
          ? THREE.MathUtils.lerp(zMax, zMin, u)
          : THREE.MathUtils.lerp(zMin, zMax, u);
      positions.push(x, y, z);
      uvs.push(u, v);
    }
  }

  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const a = r * cols + c;
      const b = a + 1;
      const d = (r + 1) * cols + c;
      const e = d + 1;
      indices.push(a, b, d);
      indices.push(b, e, d);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Builds a surface-hugging contoured decal sheet over the curved upper front nose panel
 * for the centered bold PANELCO III lettering.
 */
function createFrontNoseDecalGeometry(): THREE.BufferGeometry {
  const cols = 16;
  const rows = 8;
  const xMin = -0.62;
  const xMax = 0.62;
  const yMin = 0.975;
  const yMax = 1.325;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let r = 0; r < rows; r++) {
    const v = r / (rows - 1);
    const y = THREE.MathUtils.lerp(yMin, yMax, v);
    const hw = hiaceHalfWidthAtY(y);
    const baseZ = hiaceFrontZAtY(y);

    for (let c = 0; c < cols; c++) {
      const u = c / (cols - 1);
      const x = THREE.MathUtils.lerp(xMin, xMax, u);
      const cf = 1 - Math.min(1, Math.abs(x) / hw);
      const z = baseZ + cf * cf * 0.032 + 0.005;
      positions.push(x, y, z);
      uvs.push(u, v);
    }
  }

  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const a = r * cols + c;
      const b = a + 1;
      const d = (r + 1) * cols + c;
      const e = d + 1;
      indices.push(a, b, d);
      indices.push(b, e, d);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

function tagInteractive(obj: THREE.Object3D, partId: InteractivePartId, targets: THREE.Object3D[]) {
  obj.userData.interactivePart = partId;
  obj.layers.enable(1);
  targets.push(obj);
}

export function buildHiAceExteriorDetails(
  materials: HiAceMaterialLibrary,
): HiAceExteriorDetailsResult {
  const root = new THREE.Group();
  root.name = 'ExteriorDetails';

  const geometries: THREE.BufferGeometry[] = [];
  const edgeOverlays: THREE.LineSegments[] = [];
  const interactiveTargets: THREE.Object3D[] = [];
  const cargoOnlyNodes: THREE.Object3D[] = [];
  const superGlOnlyNodes: THREE.Object3D[] = [];
  const liveryNodes: THREE.Object3D[] = [];

  const trackGeom = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };

  const addWireOverlay = (geom: THREE.BufferGeometry, parent: THREE.Object3D, threshold = 24) => {
    const edges = trackGeom(new THREE.EdgesGeometry(geom, threshold));
    const lines = new THREE.LineSegments(edges, materials.edgeLine);
    lines.visible = false;
    parent.add(lines);
    edgeOverlays.push(lines);
  };

  const halfW = HIACE_DIMENSIONS.width * 0.5;

  // =========================================================================
  // 1. TALL FLAT-SLAB UPPER NOSE SEAMS, TOYOTA EMBLEM & PANELCO III NOSE DECAL
  // =========================================================================
  const horizSeamPts: THREE.Vector3[] = [];
  for (let i = 0; i <= 12; i++) {
    const x = THREE.MathUtils.lerp(-0.675, 0.675, i / 12);
    const y = 0.948;
    const hw = hiaceHalfWidthAtY(y);
    const cf = 1 - Math.min(1, Math.abs(x) / hw);
    const z = hiaceFrontZAtY(y) + cf * cf * 0.032 + 0.002;
    horizSeamPts.push(new THREE.Vector3(x, y, z));
  }
  const noseHorizSeam = new THREE.Mesh(
    trackGeom(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(horizSeamPts), 16, 0.0034, 6, false)),
    materials.panelSeam,
  );
  root.add(noseHorizSeam);

  // Twin vertical nose panel seam lines rising cleanly up to the raised windshield cowl (y=1.345)
  for (const side of [-1, 1] as const) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 7; i++) {
      const y = THREE.MathUtils.lerp(0.948, 1.345, i / 7);
      const x = side * THREE.MathUtils.lerp(0.675, 0.64, i / 7);
      const hw = hiaceHalfWidthAtY(y);
      const cf = 1 - Math.min(1, Math.abs(x) / hw);
      const z = hiaceFrontZAtY(y) + cf * cf * 0.032 + 0.002;
      pts.push(new THREE.Vector3(x, y, z));
    }
    const seamCurve = new THREE.CatmullRomCurve3(pts);
    const seamTube = new THREE.Mesh(
      trackGeom(new THREE.TubeGeometry(seamCurve, 12, 0.0032, 6, false)),
      materials.panelSeam,
    );
    root.add(seamTube);
  }

  // Signature Toyota 3-ring Chrome Emblem centered on the upper painted nose (shown when fleet livery is off)
  const frontEmblem = buildToyotaEmblem(
    materials.chrome,
    materials.bodyPaint,
    1.15,
    trackGeom,
  );
  frontEmblem.position.set(0, 1.045, hiaceFrontZAtY(1.045) + 0.035);
  frontEmblem.rotation.x = -0.37;
  root.add(frontEmblem);

  // Permanent bold PANELCO III front nose fleet lettering centered cleanly on the upper nose panel
  const frontNoseDecal = new THREE.Mesh(
    trackGeom(createFrontNoseDecalGeometry()),
    materials.liveryFrontNose,
  );
  frontNoseDecal.visible = false;
  frontNoseDecal.renderOrder = 1;
  root.add(frontNoseDecal);
  liveryNodes.push(frontNoseDecal);

  // =========================================================================
  // 2. PHOTO-MATCHED FRONT BUMPER, CENTER APRON & DUAL TRIM POCKETS
  // =========================================================================
  const frontBumperGroup = new THREE.Group();
  frontBumperGroup.name = 'FrontBumper';

  const fBumperGeom = trackGeom(createWraparoundBumperGeometry(1.702, 0.475, 0.69, 0.175));
  const fBumper = new THREE.Mesh(fBumperGeom, materials.bumperMaterial);
  fBumper.position.set(0, 0.252, 1.66);
  fBumper.castShadow = true;
  fBumper.receiveShadow = true;
  addWireOverlay(fBumperGeom, fBumper, 22);
  frontBumperGroup.add(fBumper);

  const chin = new THREE.Mesh(
    trackGeom(new THREE.BoxGeometry(1.48, 0.03, 0.12)),
    materials.matteBlackTrim,
  );
  chin.position.set(0, 0.236, 2.27);
  frontBumperGroup.add(chin);

  // Trapezoidal lower nose apron panel bridging between the two bumper cheeks
  const apronShape = new THREE.Shape();
  apronShape.moveTo(-0.435, 0.095);
  apronShape.lineTo(0.435, 0.095);
  apronShape.lineTo(0.468, -0.095);
  apronShape.lineTo(-0.468, -0.095);
  apronShape.closePath();

  const apronGeom = trackGeom(
    new THREE.ExtrudeGeometry(apronShape, {
      depth: 0.022,
      bevelEnabled: true,
      bevelThickness: 0.006,
      bevelSize: 0.005,
      bevelSegments: 2,
    }),
  );
  const centerApron = new THREE.Mesh(apronGeom, materials.centerNoseApron);
  centerApron.position.set(0, 0.635, 2.346);
  centerApron.castShadow = true;
  centerApron.receiveShadow = true;
  frontBumperGroup.add(centerApron);

  // Wide recessed lower bumper horizontal intake grille opening
  const lowerIntakeBack = new THREE.Mesh(
    trackGeom(new THREE.BoxGeometry(0.92, 0.175, 0.032)),
    materials.grilleMesh,
  );
  lowerIntakeBack.position.set(0, 0.445, 2.352);
  frontBumperGroup.add(lowerIntakeBack);

  for (const ly of [0.502, 0.462, 0.422, 0.382]) {
    const slat = new THREE.Mesh(
      trackGeom(new THREE.BoxGeometry(0.9, 0.013, 0.024)),
      materials.matteBlackTrim,
    );
    slat.position.set(0, ly, 2.368);
    frontBumperGroup.add(slat);
  }

  // Left & Right Bumper Cheek Inserts (Cargo DX blank ribbed pockets ↔ Super GL round fog lamps)
  const fogBezelGeom = trackGeom(new THREE.TorusGeometry(0.044, 0.0085, 12, 24));
  const fogLampGeom = trackGeom(new THREE.CylinderGeometry(0.04, 0.04, 0.024, 20));
  fogLampGeom.rotateX(Math.PI * 0.5);

  for (const side of [-1, 1] as const) {
    const cargoPocket = new THREE.Group();
    cargoPocket.position.set(side * 0.625, 0.44, 2.342);
    cargoPocket.rotation.y = side * 0.14;

    const recess = new THREE.Mesh(
      trackGeom(new THREE.BoxGeometry(0.165, 0.155, 0.022)),
      materials.panelSeam,
    );
    cargoPocket.add(recess);

    for (const ry of [-0.045, -0.015, 0.015, 0.045]) {
      const rib = new THREE.Mesh(
        trackGeom(new THREE.BoxGeometry(0.15, 0.012, 0.028)),
        materials.matteBlackTrim,
      );
      rib.position.set(0, ry, 0.004);
      cargoPocket.add(rib);
    }
    frontBumperGroup.add(cargoPocket);
    cargoOnlyNodes.push(cargoPocket);

    const sglFog = new THREE.Group();
    sglFog.position.set(side * 0.615, 0.455, 2.342);
    sglFog.rotation.y = side * 0.14;
    sglFog.visible = false;

    const fogPocket = new THREE.Mesh(
      trackGeom(new THREE.BoxGeometry(0.19, 0.125, 0.028)),
      materials.matteBlackTrim,
    );
    sglFog.add(fogPocket);

    const bezel = new THREE.Mesh(fogBezelGeom, materials.chrome);
    bezel.position.set(side * 0.022, 0, 0.018);
    sglFog.add(bezel);

    const lamp = new THREE.Mesh(fogLampGeom, materials.headlampBeam);
    lamp.position.set(side * 0.022, 0, 0.008);
    sglFog.add(lamp);

    frontBumperGroup.add(sglFog);
    superGlOnlyNodes.push(sglFog);

    const cornerStrip = new THREE.Mesh(
      trackGeom(new THREE.BoxGeometry(0.018, 0.016, 0.34)),
      materials.matteBlackTrim,
    );
    cornerStrip.position.set(side * (halfW + 0.008), 0.355, 1.98);
    cornerStrip.visible = false;
    frontBumperGroup.add(cornerStrip);
    superGlOnlyNodes.push(cornerStrip);
  }

  // Front License Plate ("HIACE CARGO" / JDM / "URO 582" when PANELCO III livery active)
  const plateBackingGeom = trackGeom(new THREE.BoxGeometry(0.34, 0.172, 0.018));
  const plateFaceGeom = trackGeom(new THREE.PlaneGeometry(0.328, 0.164));

  const frontPlateGroup = new THREE.Group();
  frontPlateGroup.position.set(0, 0.36, 2.378);
  frontPlateGroup.add(new THREE.Mesh(plateBackingGeom, materials.matteBlackTrim));
  const frontPlateFace = new THREE.Mesh(plateFaceGeom, materials.licensePlate);
  frontPlateFace.position.z = 0.01;
  frontPlateGroup.add(frontPlateFace);
  frontBumperGroup.add(frontPlateGroup);

  root.add(frontBumperGroup);

  // =========================================================================
  // 3. AUTHENTIC TWO-SLOT HORIZONTAL GRILLE
  // =========================================================================
  const grilleGroup = new THREE.Group();
  grilleGroup.name = 'FrontGrille';
  grilleGroup.position.set(0, 0.835, 2.336);
  grilleGroup.rotation.x = -0.12;

  const grilleBack = new THREE.Mesh(
    trackGeom(new THREE.BoxGeometry(0.88, 0.202, 0.036)),
    materials.grilleMesh,
  );
  grilleBack.position.z = -0.016;
  grilleGroup.add(grilleBack);

  const mainBar = new THREE.Mesh(
    trackGeom(new THREE.BoxGeometry(0.89, 0.052, 0.044)),
    materials.grilleBarMaterial,
  );
  mainBar.position.set(0, 0.008, 0.014);
  grilleGroup.add(mainBar);

  const upperBar = new THREE.Mesh(
    trackGeom(new THREE.BoxGeometry(0.9, 0.022, 0.038)),
    materials.grilleBarMaterial,
  );
  upperBar.position.set(0, 0.095, 0.012);
  grilleGroup.add(upperBar);

  const lowerBar = new THREE.Mesh(
    trackGeom(new THREE.BoxGeometry(0.87, 0.022, 0.038)),
    materials.grilleBarMaterial,
  );
  lowerBar.position.set(0, -0.095, 0.014);
  grilleGroup.add(lowerBar);

  root.add(grilleGroup);

  // =========================================================================
  // 4. CRISP RECTANGULAR CRYSTAL MULTI-REFLECTOR HEADLAMPS
  // =========================================================================
  const hlBodyGeom = trackGeom(new THREE.BoxGeometry(0.365, 0.205, 0.13));
  const hlLensGeom = trackGeom(new THREE.BoxGeometry(0.372, 0.21, 0.024));
  const mainBowlGeom = trackGeom(new THREE.CylinderGeometry(0.068, 0.056, 0.042, 24));
  mainBowlGeom.rotateX(Math.PI * 0.5);
  const cornerBowlGeom = trackGeom(new THREE.BoxGeometry(0.095, 0.175, 0.04));

  for (const side of [-1, 1] as const) {
    const hlGroup = new THREE.Group();
    hlGroup.name = side > 0 ? 'Headlamp_Left' : 'Headlamp_Right';
    hlGroup.position.set(side * 0.635, 0.84, 2.256);
    hlGroup.rotation.y = side * 0.19;
    hlGroup.rotation.x = -0.1;

    const housing = new THREE.Mesh(hlBodyGeom, materials.headlampReflector);
    tagInteractive(housing, 'headlights', interactiveTargets);
    hlGroup.add(housing);

    const gasket = new THREE.Mesh(
      trackGeom(new THREE.BoxGeometry(0.382, 0.218, 0.09)),
      materials.matteBlackTrim,
    );
    gasket.position.z = -0.022;
    hlGroup.add(gasket);

    const mainBowl = new THREE.Mesh(mainBowlGeom, materials.chrome);
    mainBowl.position.set(-side * 0.058, 0.008, 0.056);
    hlGroup.add(mainBowl);

    const mainBulb = new THREE.Mesh(
      trackGeom(new THREE.SphereGeometry(0.034, 16, 12)),
      materials.headlampBeam,
    );
    mainBulb.position.set(-side * 0.058, 0.008, 0.064);
    tagInteractive(mainBulb, 'headlights', interactiveTargets);
    hlGroup.add(mainBulb);

    const divBar = new THREE.Mesh(
      trackGeom(new THREE.BoxGeometry(0.34, 0.012, 0.018)),
      materials.chrome,
    );
    divBar.position.set(0, -0.058, 0.068);
    hlGroup.add(divBar);

    const cornerReflect = new THREE.Mesh(cornerBowlGeom, materials.headlampReflector);
    cornerReflect.position.set(side * 0.125, 0.005, 0.054);
    hlGroup.add(cornerReflect);

    const cornerBulb = new THREE.Mesh(
      trackGeom(new THREE.SphereGeometry(0.022, 12, 10)),
      materials.amberIndicator,
    );
    cornerBulb.position.set(side * 0.125, -0.032, 0.062);
    hlGroup.add(cornerBulb);

    const sideCorner = new THREE.Mesh(
      trackGeom(new THREE.BoxGeometry(0.032, 0.195, 0.145)),
      materials.headlampReflector,
    );
    sideCorner.position.set(side * 0.175, 0, -0.025);
    hlGroup.add(sideCorner);

    const lens = new THREE.Mesh(hlLensGeom, materials.headlampLens);
    lens.position.z = 0.072;
    lens.renderOrder = 4;
    tagInteractive(lens, 'headlights', interactiveTargets);
    hlGroup.add(lens);

    root.add(hlGroup);
  }

  // =========================================================================
  // 5. ANIMATED SLIDING DOOR (+X) WITH COMPACT 3-PANE COMMUTER WINDOW & TAGLINE
  // =========================================================================
  const slidingDoorGroup = new THREE.Group();
  slidingDoorGroup.name = 'SlidingDoorAssembly';

  // Structural door core rising to the new 1.28m raised window sill
  const slideCoreGeom = trackGeom(new THREE.BoxGeometry(0.044, 0.94, 1.32));
  const slideCore = new THREE.Mesh(slideCoreGeom, materials.bodyPaint);
  slideCore.position.set(halfW - 0.046, 0.79, -0.11);
  slideCore.castShadow = true;
  slideCore.receiveShadow = true;
  addWireOverlay(slideCoreGeom, slideCore, 20);
  tagInteractive(slideCore, 'slidingDoor', interactiveTargets);
  slidingDoorGroup.add(slideCore);

  const slideSkinGeom = trackGeom(createContouredSlidingDoorSkin());
  const slideSkin = new THREE.Mesh(slideSkinGeom, materials.bodyPaint);
  slideSkin.castShadow = true;
  slideSkin.receiveShadow = true;
  tagInteractive(slideSkin, 'slidingDoor', interactiveTargets);
  slidingDoorGroup.add(slideSkin);

  // Diagonal slanted B-pillar wedge matching the compact y=1.28..1.79 window band
  const slideSlantWedge = new THREE.Mesh(
    trackGeom(createTumblehomeQuadGeometry(0.255, 0.562, 0.562, 0.435, 1.275, 1.795, 1, 0.002, 0.048)),
    materials.bodyPaint,
  );
  slideSlantWedge.castShadow = true;
  slideSlantWedge.receiveShadow = true;
  tagInteractive(slideSlantWedge, 'slidingDoor', interactiveTargets);
  slidingDoorGroup.add(slideSlantWedge);

  // Compact black perimeter rubber frame around sliding-door window (no opaque backing slab!)
  const slideTopFrame = new THREE.Mesh(
    trackGeom(createTumblehomeQuadGeometry(-0.69, 0.43, 0.44, -0.69, 1.76, 1.792, 1, 0.001, 0.022)),
    materials.glossBlackPillar,
  );
  const slideBotFrame = new THREE.Mesh(
    trackGeom(createTumblehomeQuadGeometry(-0.69, 0.26, 0.27, -0.69, 1.282, 1.314, 1, 0.001, 0.022)),
    materials.glossBlackPillar,
  );
  const slideLeadFrame = new THREE.Mesh(
    trackGeom(createTumblehomeQuadGeometry(0.255, 0.295, 0.435, 0.395, 1.282, 1.792, 1, 0.001, 0.022)),
    materials.glossBlackPillar,
  );
  tagInteractive(slideTopFrame, 'slidingDoor', interactiveTargets);
  tagInteractive(slideBotFrame, 'slidingDoor', interactiveTargets);
  slidingDoorGroup.add(slideTopFrame, slideBotFrame, slideLeadFrame);

  // Light commuter sliding-door glass revealing interior rows cleanly
  const slideGlass = new THREE.Mesh(
    trackGeom(createTumblehomeQuadGeometry(-0.67, 0.29, 0.405, -0.67, 1.312, 1.762, 1, -0.002, 0.008)),
    materials.privacyGlass,
  );
  slideGlass.renderOrder = 2;
  tagInteractive(slideGlass, 'slidingDoor', interactiveTargets);
  slidingDoorGroup.add(slideGlass);

  // Authentic 2-mullion / 3-pane commuter sliding window dividers (+X, matching Left Side View sketch!)
  slidingDoorGroup.add(
    new THREE.Mesh(
      trackGeom(createTumblehomeQuadGeometry(-0.275, -0.245, -0.245, -0.275, 1.308, 1.766, 1, 0.002, 0.016)),
      materials.matteBlackTrim,
    ),
    new THREE.Mesh(
      trackGeom(createTumblehomeQuadGeometry(0.055, 0.085, 0.085, 0.055, 1.308, 1.766, 1, 0.002, 0.016)),
      materials.matteBlackTrim,
    ),
    new THREE.Mesh(
      trackGeom(createTumblehomeQuadGeometry(-0.275, 0.085, 0.085, -0.275, 1.746, 1.768, 1, 0.002, 0.014)),
      materials.matteBlackTrim,
    ),
    new THREE.Mesh(
      trackGeom(createTumblehomeQuadGeometry(-0.275, 0.085, 0.085, -0.275, 1.306, 1.328, 1, 0.002, 0.014)),
      materials.matteBlackTrim,
    ),
  );

  // Authentic HiAce VERTICAL Recessed Sliding-Door Grab Handle cleanly positioned in the painted belt band (y=1.195)
  const vHandleCupGeom = trackGeom(new THREE.BoxGeometry(0.012, 0.125, 0.064));
  const vHandleBarGeom = trackGeom(new THREE.BoxGeometry(0.024, 0.098, 0.026));

  const slideVCup = new THREE.Mesh(vHandleCupGeom, materials.panelSeam);
  slideVCup.position.set(halfW + 0.008, 1.195, 0.455);
  slidingDoorGroup.add(slideVCup);

  const slideVHandle = new THREE.Mesh(vHandleBarGeom, materials.handleMaterial);
  slideVHandle.position.set(halfW + 0.018, 1.195, 0.468);
  tagInteractive(slideVHandle, 'slidingDoor', interactiveTargets);
  slidingDoorGroup.add(slideVHandle);

  // Sliding-door section of the horizontal beltline crease moves WITH slidingDoorGroup (+X)
  const slideBeltSeam = new THREE.Mesh(
    trackGeom(new THREE.BoxGeometry(0.006, 0.007, 1.32)),
    materials.panelSeam,
  );
  slideBeltSeam.position.set(halfW + 0.009, 1.12, -0.11);
  slidingDoorGroup.add(slideBeltSeam);

  // Permanent full-color PANELCO III Side Tagline on +X Left sliding door ("Your delight, our success." — slides with door!)
  const leftSideScriptGeom = trackGeom(
    createContouredSideDecalGeometry(1, -0.68, 0.46, 0.77, 1.03, 0.0085),
  );
  const leftSideScript = new THREE.Mesh(leftSideScriptGeom, materials.liverySideScript);
  leftSideScript.renderOrder = 1;
  tagInteractive(leftSideScript, 'slidingDoor', interactiveTargets);
  slidingDoorGroup.add(leftSideScript);
  liveryNodes.push(leftSideScript);

  // Interior dark door trim card visible when slid open
  const slideInterior = new THREE.Mesh(
    trackGeom(new THREE.BoxGeometry(0.022, 0.9, 1.26)),
    materials.interiorDash,
  );
  slideInterior.position.set(halfW - 0.062, 0.78, -0.11);
  slidingDoorGroup.add(slideInterior);

  root.add(slidingDoorGroup);

  // Permanent full-color PANELCO III Side Tagline on -X Right side door ("Your delight, our success.")
  const rightSideScriptGeom = trackGeom(
    createContouredSideDecalGeometry(-1, -0.68, 0.46, 0.77, 1.03, 0.0065),
  );
  const rightSideScript = new THREE.Mesh(rightSideScriptGeom, materials.liverySideScript);
  rightSideScript.renderOrder = 1;
  root.add(rightSideScript);
  liveryNodes.push(rightSideScript);

  // Permanent official full-color PANELCO III Circular Seals on BOTH Right (-X) & Left (+X) Front Cab Doors
  for (const side of [-1, 1] as const) {
    const crestGeom = trackGeom(
      createContouredSideDecalGeometry(side, 1.095, 1.385, 0.78, 1.07, 0.0065),
    );
    const crest = new THREE.Mesh(crestGeom, materials.liveryDoorCrest);
    crest.renderOrder = 1;
    root.add(crest);
    liveryNodes.push(crest);
  }

  // Iconic Exposed Recessed Sliding-Door Horizontal Track Channel along rear quarter (y=1.12, clearly below window sill!)
  const railGeom = trackGeom(new THREE.BoxGeometry(0.018, 0.026, 1.38));
  const railRecessGeom = trackGeom(new THREE.BoxGeometry(0.014, 0.038, 1.4));
  for (const side of [-1, 1] as const) {
    const recess = new THREE.Mesh(railRecessGeom, materials.panelSeam);
    recess.position.set(side * (halfW + 0.003), 1.12, -1.48);
    root.add(recess);

    const rail = new THREE.Mesh(railGeom, materials.satinTrack);
    rail.position.set(side * (halfW + 0.006), 1.12, -1.48);
    root.add(rail);
  }

  // Front Cab Door HORIZONTAL Pull Handles + Right-side (-X) VERTICAL Sliding-Door Handle
  const hHandleCupGeom = trackGeom(new THREE.BoxGeometry(0.012, 0.054, 0.138));
  const hHandleGripGeom = trackGeom(new THREE.BoxGeometry(0.025, 0.026, 0.162));

  for (const side of [-1, 1] as const) {
    const fCup = new THREE.Mesh(hHandleCupGeom, materials.panelSeam);
    fCup.position.set(side * (halfW + 0.008), 1.135, 0.85);
    root.add(fCup);

    const fHandle = new THREE.Mesh(hHandleGripGeom, materials.handleMaterial);
    fHandle.position.set(side * (halfW + 0.019), 1.135, 0.85);
    root.add(fHandle);
  }

  // Right-side (-X) matching vertical sliding-door handle
  const rVCup = new THREE.Mesh(vHandleCupGeom, materials.panelSeam);
  rVCup.position.set(-(halfW + 0.008), 1.195, 0.455);
  root.add(rVCup);
  const rVHandle = new THREE.Mesh(vHandleBarGeom, materials.handleMaterial);
  rVHandle.position.set(-(halfW + 0.018), 1.195, 0.468);
  root.add(rVHandle);

  // Crisp Vertical Door Shut-Lines & Horizontal Beltline Character Groove (y=1.12)
  const vSeamGeom = trackGeom(new THREE.BoxGeometry(0.007, 1.0, 0.008));
  const frontBeltSeamGeom = trackGeom(new THREE.BoxGeometry(0.006, 0.007, 1.26));
  for (const side of [-1, 1] as const) {
    const bSeam = new THREE.Mesh(vSeamGeom, materials.panelSeam);
    bSeam.position.set(side * (halfW + 0.01), 0.78, 0.562);
    root.add(bSeam);

    const frontBeltSeam = new THREE.Mesh(frontBeltSeamGeom, materials.panelSeam);
    frontBeltSeam.position.set(side * (halfW + 0.009), 1.12, 1.2);
    root.add(frontBeltSeam);
  }

  const rightMidBeltSeam = new THREE.Mesh(
    trackGeom(new THREE.BoxGeometry(0.006, 0.007, 1.33)),
    materials.panelSeam,
  );
  rightMidBeltSeam.position.set(-(halfW + 0.009), 1.12, -0.11);
  root.add(rightMidBeltSeam);

  const rightSlideRearSeam = new THREE.Mesh(vSeamGeom, materials.panelSeam);
  rightSlideRearSeam.position.set(-(halfW + 0.01), 0.78, -0.78);
  root.add(rightSlideRearSeam);

  // Fuel filler flap on left (+X) rear flank
  const fuelOutline = new THREE.Mesh(
    trackGeom(new THREE.BoxGeometry(0.008, 0.165, 0.165)),
    materials.panelSeam,
  );
  fuelOutline.position.set(halfW + 0.005, 0.82, -0.94);
  root.add(fuelOutline);
  const fuelDoor = new THREE.Mesh(
    trackGeom(new THREE.BoxGeometry(0.01, 0.153, 0.153)),
    materials.bodyPaint,
  );
  fuelDoor.position.set(halfW + 0.007, 0.82, -0.94);
  root.add(fuelDoor);

  // =========================================================================
  // 6. TALL-PANEL REAR TAILGATE, COMPACT REAR WINDOW & PANELCO III REAR DECALS
  // =========================================================================
  const tailgatePivot = new THREE.Group();
  tailgatePivot.name = 'RearTailgatePivot';
  tailgatePivot.position.set(0, 1.905, -2.212);

  // Tall clean painted lower tailgate panel rising to y=1.28m (matches Rear View sketch)
  const tgLowerGeom = trackGeom(new THREE.BoxGeometry(1.42, 0.72, 0.072));
  const tgLower = new THREE.Mesh(tgLowerGeom, materials.bodyPaint);
  tgLower.position.set(0, 0.92 - 1.905, -0.088);
  tgLower.castShadow = true;
  tgLower.receiveShadow = true;
  addWireOverlay(tgLowerGeom, tgLower, 20);
  tagInteractive(tgLower, 'tailgate', interactiveTargets);
  tailgatePivot.add(tgLower);

  const tgCrease = new THREE.Mesh(
    trackGeom(new THREE.BoxGeometry(1.42, 0.024, 0.022)),
    materials.bodyPaint,
  );
  tgCrease.position.set(0, 1.26 - 1.905, -0.122);
  tailgatePivot.add(tgCrease);

  const plateCavity = new THREE.Mesh(
    trackGeom(new THREE.BoxGeometry(0.62, 0.225, 0.014)),
    materials.panelSeam,
  );
  plateCavity.position.set(0, 0.925 - 1.905, -0.12);
  tailgatePivot.add(plateCavity);

  // Compact upper tailgate window bay (y=1.28..1.905, thick painted header + wider pillars + compact glass)
  const tgUpperGroup = new THREE.Group();
  tgUpperGroup.position.set(0, -0.312, -0.042);
  tgUpperGroup.rotation.x = 0.095;

  const tgSideFrameGeom = trackGeom(new THREE.BoxGeometry(0.165, 0.64, 0.058));
  for (const side of [-1, 1] as const) {
    const sf = new THREE.Mesh(tgSideFrameGeom, materials.bodyPaint);
    sf.position.set(side * 0.628, 0, 0);
    sf.castShadow = true;
    tagInteractive(sf, 'tailgate', interactiveTargets);
    tgUpperGroup.add(sf);
  }

  const tgTopFrame = new THREE.Mesh(
    trackGeom(new THREE.BoxGeometry(1.42, 0.115, 0.06)),
    materials.bodyPaint,
  );
  tgTopFrame.position.set(0, 0.262, 0);
  tgTopFrame.castShadow = true;
  tagInteractive(tgTopFrame, 'tailgate', interactiveTargets);
  tgUpperGroup.add(tgTopFrame);

  const hmsl = new THREE.Mesh(
    trackGeom(new THREE.BoxGeometry(0.3, 0.032, 0.026)),
    materials.tailLightGuide,
  );
  hmsl.position.set(0, 0.26, -0.03);
  tgUpperGroup.add(hmsl);

  // Perimeter black rubber rear window gasket bars (leaves central glass opening 100% transparent!)
  const rwTopMold = new THREE.Mesh(
    trackGeom(new THREE.BoxGeometry(1.12, 0.036, 0.02)),
    materials.matteBlackTrim,
  );
  rwTopMold.position.set(0, 0.195, -0.016);
  const rwBotMold = new THREE.Mesh(
    trackGeom(new THREE.BoxGeometry(1.12, 0.036, 0.02)),
    materials.matteBlackTrim,
  );
  rwBotMold.position.set(0, -0.285, -0.016);
  const rwSideMoldGeom = trackGeom(new THREE.BoxGeometry(0.036, 0.51, 0.02));
  const rwLeftMold = new THREE.Mesh(rwSideMoldGeom, materials.matteBlackTrim);
  rwLeftMold.position.set(0.542, -0.045, -0.016);
  const rwRightMold = new THREE.Mesh(rwSideMoldGeom, materials.matteBlackTrim);
  rwRightMold.position.set(-0.542, -0.045, -0.016);
  tgUpperGroup.add(rwTopMold, rwBotMold, rwLeftMold, rwRightMold);

  // Compact light commuter rear glass (1.06m × 0.45m) revealing interior rear bench headrests cleanly
  const rearGlass = new THREE.Mesh(
    trackGeom(new THREE.BoxGeometry(1.06, 0.45, 0.012)),
    materials.privacyGlass,
  );
  rearGlass.position.set(0, -0.045, -0.018);
  rearGlass.renderOrder = 2;
  tagInteractive(rearGlass, 'tailgate', interactiveTargets);
  tgUpperGroup.add(rearGlass);

  // Toggleable PANELCO III "TR" registration sticker in upper-left corner of rear glass (Rear View sketch)
  const trSticker = new THREE.Mesh(
    trackGeom(new THREE.PlaneGeometry(0.095, 0.082)),
    materials.liveryTrSticker,
  );
  trSticker.position.set(0.45, 0.115, -0.026);
  trSticker.rotation.y = Math.PI;
  trSticker.visible = false;
  trSticker.renderOrder = 3;
  tgUpperGroup.add(trSticker);
  liveryNodes.push(trSticker);

  // Rear wiper arm
  const rearWiperPivot = new THREE.Group();
  rearWiperPivot.position.set(0.06, -0.275, -0.038);
  const rwArm = new THREE.Mesh(
    trackGeom(new THREE.BoxGeometry(0.32, 0.016, 0.016)),
    materials.matteBlackTrim,
  );
  rwArm.position.set(-0.15, 0.01, 0);
  rearWiperPivot.add(rwArm);
  tgUpperGroup.add(rearWiperPivot);

  tailgatePivot.add(tgUpperGroup);

  // Rear tailgate license garnish (Matte black on Cargo DX ↔ Chrome on Super GL)
  const garnish = new THREE.Mesh(
    trackGeom(new THREE.BoxGeometry(0.72, 0.06, 0.04)),
    materials.rearGarnishMaterial,
  );
  garnish.position.set(0, 1.06 - 1.905, -0.136);
  tagInteractive(garnish, 'tailgate', interactiveTargets);
  tailgatePivot.add(garnish);

  const rearEmblem = buildToyotaEmblem(
    materials.chrome,
    materials.bodyPaint,
    0.92,
    trackGeom,
  );
  rearEmblem.position.set(0, 1.158 - 1.905, -0.13);
  rearEmblem.rotation.y = Math.PI;
  tailgatePivot.add(rearEmblem);

  // Metallic "TOYOTA HIACE" badge (left) and "SUPER GL" badge (shown on Super GL when livery off)
  const hiaceBadgeMesh = new THREE.Mesh(
    trackGeom(new THREE.PlaneGeometry(0.22, 0.062)),
    materials.hiaceBadge,
  );
  hiaceBadgeMesh.position.set(0.51, 1.04 - 1.905, -0.128);
  hiaceBadgeMesh.rotation.y = Math.PI;
  tailgatePivot.add(hiaceBadgeMesh);

  const superGlBadgeMesh = new THREE.Mesh(
    trackGeom(new THREE.PlaneGeometry(0.24, 0.06)),
    materials.superGlBadge,
  );
  superGlBadgeMesh.position.set(-0.48, 0.78 - 1.905, -0.128);
  superGlBadgeMesh.rotation.y = Math.PI;
  superGlBadgeMesh.visible = false;
  tailgatePivot.add(superGlBadgeMesh);
  superGlOnlyNodes.push(superGlBadgeMesh);

  // Toggleable PANELCO III Rear Tailgate Lettering & Unit "75" (Rear View sketch)
  const rearPanelcoDecal = new THREE.Mesh(
    trackGeom(new THREE.PlaneGeometry(0.84, 0.18)),
    materials.liveryRearPanelco,
  );
  rearPanelcoDecal.position.set(0, 0.725 - 1.905, -0.129);
  rearPanelcoDecal.rotation.y = Math.PI;
  rearPanelcoDecal.visible = false;
  rearPanelcoDecal.renderOrder = 1;
  tailgatePivot.add(rearPanelcoDecal);
  liveryNodes.push(rearPanelcoDecal);

  const rearNumberDecal = new THREE.Mesh(
    trackGeom(new THREE.PlaneGeometry(0.24, 0.24)),
    materials.liveryRearNumber,
  );
  rearNumberDecal.position.set(-0.47, 0.945 - 1.905, -0.129);
  rearNumberDecal.rotation.y = Math.PI;
  rearNumberDecal.visible = false;
  rearNumberDecal.renderOrder = 1;
  tailgatePivot.add(rearNumberDecal);
  liveryNodes.push(rearNumberDecal);

  const rearPlateGroup = new THREE.Group();
  rearPlateGroup.position.set(0, 0.925 - 1.905, -0.13);
  rearPlateGroup.rotation.y = Math.PI;
  rearPlateGroup.add(new THREE.Mesh(plateBackingGeom, materials.matteBlackTrim));
  const rearPlateFace = new THREE.Mesh(plateFaceGeom, materials.licensePlate);
  rearPlateFace.position.z = 0.01;
  rearPlateGroup.add(rearPlateFace);
  tailgatePivot.add(rearPlateGroup);

  root.add(tailgatePivot);

  // Dual telescoping rear tailgate gas lift struts
  const strutGeom = trackGeom(new THREE.CylinderGeometry(0.011, 0.011, 1, 10));
  const leftStrut = new THREE.Mesh(strutGeom, materials.satinTrack);
  const rightStrut = new THREE.Mesh(strutGeom, materials.satinTrack);
  leftStrut.visible = false;
  rightStrut.visible = false;
  root.add(leftStrut, rightStrut);

  // =========================================================================
  // 7. VERTICAL STACKED HIACE H200 TAILLAMPS (×2)
  // =========================================================================
  const tailHousingGeom = trackGeom(new THREE.BoxGeometry(0.146, 0.565, 0.092));
  const tailRedTopGeom = trackGeom(new THREE.BoxGeometry(0.132, 0.245, 0.044));
  const tailGuideGeom = trackGeom(new THREE.BoxGeometry(0.02, 0.215, 0.048));
  const tailReverseGeom = trackGeom(new THREE.BoxGeometry(0.132, 0.098, 0.044));
  const tailAmberGeom = trackGeom(new THREE.BoxGeometry(0.132, 0.095, 0.044));
  const tailRedBotGeom = trackGeom(new THREE.BoxGeometry(0.132, 0.092, 0.044));
  const aeroFinGeom = trackGeom(new THREE.BoxGeometry(0.02, 0.011, 0.052));

  for (const side of [-1, 1] as const) {
    const tlGroup = new THREE.Group();
    tlGroup.name = side > 0 ? 'Taillamp_Left' : 'Taillamp_Right';
    tlGroup.position.set(side * 0.768, 0.875, -2.272);

    tlGroup.add(new THREE.Mesh(tailHousingGeom, materials.matteBlackTrim));

    const redTop = new THREE.Mesh(tailRedTopGeom, materials.taillampRed);
    redTop.position.set(0, 0.146, -0.032);
    tlGroup.add(redTop);

    for (const gx of [-0.032, 0.032]) {
      const guide = new THREE.Mesh(tailGuideGeom, materials.tailLightGuide);
      guide.position.set(gx, 0.146, -0.036);
      tlGroup.add(guide);
    }

    const revBand = new THREE.Mesh(tailReverseGeom, materials.taillampReverse);
    revBand.position.set(0, -0.03, -0.032);
    tlGroup.add(revBand);

    const ambBand = new THREE.Mesh(tailAmberGeom, materials.amberIndicator);
    ambBand.position.set(0, -0.132, -0.032);
    tlGroup.add(ambBand);

    const redBot = new THREE.Mesh(tailRedBotGeom, materials.taillampRed);
    redBot.position.set(0, -0.228, -0.032);
    tlGroup.add(redBot);

    const sideWrap = new THREE.Mesh(
      trackGeom(new THREE.BoxGeometry(0.028, 0.52, 0.098)),
      materials.taillampRed,
    );
    sideWrap.position.set(side * 0.068, 0, 0.012);
    tlGroup.add(sideWrap);

    for (const fy of [0.16, 0.0, -0.16]) {
      const fin = new THREE.Mesh(aeroFinGeom, materials.taillampRed);
      fin.position.set(side * 0.082, fy, 0.015);
      tlGroup.add(fin);
    }

    root.add(tlGroup);
  }

  // =========================================================================
  // 8. REAR STEP BUMPER & EXHAUST
  // =========================================================================
  const rearBumperGroup = new THREE.Group();
  rearBumperGroup.name = 'RearBumper';

  const rBumperGeom = trackGeom(createWraparoundBumperGeometry(1.702, 0.285, 0.54, 0.16));
  const rBumper = new THREE.Mesh(rBumperGeom, materials.bumperMaterial);
  rBumper.rotation.y = Math.PI;
  rBumper.position.set(0, 0.278, -1.805);
  rBumper.castShadow = true;
  rBumper.receiveShadow = true;
  addWireOverlay(rBumperGeom, rBumper, 22);
  rearBumperGroup.add(rBumper);

  const stepPad = new THREE.Mesh(
    trackGeom(new THREE.BoxGeometry(1.18, 0.022, 0.128)),
    materials.stepPadRubber,
  );
  stepPad.position.set(0, 0.576, -2.292);
  rearBumperGroup.add(stepPad);

  const reflectorGeom = trackGeom(new THREE.BoxGeometry(0.16, 0.028, 0.016));
  for (const side of [-1, 1] as const) {
    const ref = new THREE.Mesh(reflectorGeom, materials.taillampRed);
    ref.position.set(side * 0.625, 0.405, -2.358);
    rearBumperGroup.add(ref);
  }

  const exhaustCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.52, 0.245, -1.85),
    new THREE.Vector3(-0.55, 0.228, -2.18),
    new THREE.Vector3(-0.56, 0.214, -2.34),
  ]);
  const exhaustMesh = new THREE.Mesh(
    trackGeom(new THREE.TubeGeometry(exhaustCurve, 16, 0.028, 14, false)),
    materials.exhaustMetal,
  );
  exhaustMesh.castShadow = true;
  rearBumperGroup.add(exhaustMesh);

  root.add(rearBumperGroup);

  // =========================================================================
  // 9. CLEAN LHD COMMUTER WING MIRRORS, RAISED LHD WIPERS & A-PILLAR ANTENNA
  // =========================================================================
  const mirrorHousingShape = new THREE.Shape();
  mirrorHousingShape.moveTo(-0.044, -0.102);
  mirrorHousingShape.quadraticCurveTo(0.052, -0.102, 0.056, -0.05);
  mirrorHousingShape.lineTo(0.056, 0.072);
  mirrorHousingShape.quadraticCurveTo(0.052, 0.112, -0.032, 0.112);
  mirrorHousingShape.quadraticCurveTo(-0.056, 0.102, -0.056, 0.06);
  mirrorHousingShape.lineTo(-0.056, -0.062);
  mirrorHousingShape.quadraticCurveTo(-0.056, -0.102, -0.044, -0.102);
  mirrorHousingShape.closePath();

  const mirrorShellGeom = trackGeom(
    new THREE.ExtrudeGeometry(mirrorHousingShape, {
      depth: 0.068,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.012,
      bevelSegments: 3,
    }),
  );
  mirrorShellGeom.translate(0, 0, -0.034);

  const mirrorCapGeom = trackGeom(
    new THREE.ExtrudeGeometry(mirrorHousingShape, {
      depth: 0.036,
      bevelEnabled: true,
      bevelThickness: 0.014,
      bevelSize: 0.011,
      bevelSegments: 3,
    }),
  );

  const mirrorReflectGeom = trackGeom(new THREE.PlaneGeometry(0.105, 0.19));

  for (const side of [-1, 1] as const) {
    const mirrorGroup = new THREE.Group();
    mirrorGroup.name = side > 0 ? 'SideMirror_Left' : 'SideMirror_Right';
    // Seated cleanly at the raised front cab window sail corner (y=1.29, z=1.90)
    mirrorGroup.position.set(side * (halfW - 0.014), 1.29, 1.89);

    const sail = new THREE.Mesh(
      trackGeom(new THREE.BoxGeometry(0.036, 0.145, 0.15)),
      materials.matteBlackTrim,
    );
    sail.position.set(0, -0.025, 0.03);
    mirrorGroup.add(sail);

    const armCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.01, 0.01),
      new THREE.Vector3(side * 0.066, 0.006, 0.0),
      new THREE.Vector3(side * 0.122, 0.038, -0.015),
    ]);
    const arm = new THREE.Mesh(
      trackGeom(new THREE.TubeGeometry(armCurve, 10, 0.019, 10, false)),
      materials.matteBlackTrim,
    );
    mirrorGroup.add(arm);

    const head = new THREE.Group();
    head.position.set(side * 0.148, 0.075, -0.018);
    head.rotation.y = side * -0.15;

    const casing = new THREE.Mesh(mirrorShellGeom, materials.matteBlackTrim);
    casing.castShadow = true;
    head.add(casing);

    const cap = new THREE.Mesh(mirrorCapGeom, materials.mirrorCapMaterial);
    cap.position.z = 0.014;
    cap.castShadow = true;
    head.add(cap);

    const glass = new THREE.Mesh(mirrorReflectGeom, materials.mirrorGlass);
    glass.position.z = -0.049;
    glass.rotation.y = Math.PI;
    head.add(glass);

    mirrorGroup.add(head);
    root.add(mirrorGroup);
  }

  // Twin articulated LHD front windshield wipers resting cleanly on the raised y=1.375 cowl
  const wiperArmGeom = trackGeom(new THREE.BoxGeometry(0.46, 0.013, 0.014));
  const wiperBladeGeom = trackGeom(new THREE.BoxGeometry(0.52, 0.012, 0.018));

  for (const wx of [-0.14, 0.36]) {
    const wiper = new THREE.Group();
    wiper.position.set(wx, 1.376, 2.122);
    wiper.rotation.set(-0.78, 0, -0.1);
    wiper.add(new THREE.Mesh(wiperArmGeom, materials.matteBlackTrim));
    const blade = new THREE.Mesh(wiperBladeGeom, materials.matteBlackTrim);
    blade.position.set(-0.08, 0.016, 0.01);
    wiper.add(blade);
    root.add(wiper);
  }

  let currentTrim: TrimSpec = 'cargo-dx';
  let currentStyle: RenderStyle = 'pbr';

  const syncVisibility = () => {
    const isCargo = currentTrim === 'cargo-dx';
    // PANELCO III fleet livery is permanently active in Studio PBR; hidden only in raw Clay / Wireframe inspection
    const showLivery = currentStyle === 'pbr';

    for (let i = 0; i < cargoOnlyNodes.length; i++) {
      cargoOnlyNodes[i].visible = isCargo;
    }
    for (let i = 0; i < superGlOnlyNodes.length; i++) {
      superGlOnlyNodes[i].visible = !isCargo && !(showLivery && superGlOnlyNodes[i] === superGlBadgeMesh);
    }
    for (let i = 0; i < liveryNodes.length; i++) {
      liveryNodes[i].visible = showLivery;
    }
    // Keep front nose clear for PANELCO III lettering in Studio PBR (matches Front View sketch)
    frontEmblem.visible = !showLivery;
  };

  const setTrimSpec = (trim: TrimSpec) => {
    currentTrim = trim;
    syncVisibility();
  };

  const setRenderStyle = (renderStyle: RenderStyle) => {
    currentStyle = renderStyle;
    syncVisibility();
  };

  syncVisibility();

  return {
    group: root,
    slidingDoorGroup,
    tailgatePivot,
    tailgateStruts: { left: leftStrut, right: rightStrut },
    interactiveTargets,
    edgeOverlays,
    setTrimSpec,
    setRenderStyle,
    dispose: () => {
      geometries.forEach((g) => g.dispose());
    },
  };
}
