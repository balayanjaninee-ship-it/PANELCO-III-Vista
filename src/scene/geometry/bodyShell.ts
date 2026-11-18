import * as THREE from 'three';
import { HIACE_DIMENSIONS } from '../../types/hiace';
import { HiAceMaterialLibrary } from '../materials';

export interface HiAceBodyShellResult {
  group: THREE.Group;
  edgeOverlays: THREE.LineSegments[];
  dispose: () => void;
}

/**
 * Computes exact sculpted half-width of the Toyota HiAce H200 body shell at height y,
 * calibrated directly to the four-view Commuter Van reference sketch and real H200 photos:
 * - Clean rocker panel tuck below y=0.34
 * - Restrained lower side swage crease at y=0.42
 * - Smooth vertical-crowned door flank rising to the raised window sill y=1.28
 * - Crisp horizontal sliding-track beltline ridge at y=1.12 (clearly 16cm below side glass)
 * - Smooth greenhouse tumblehome tapering inward to the thick painted roof cantrail y=1.92
 */
export function hiaceHalfWidthAtY(y: number): number {
  const maxHalfW = HIACE_DIMENSIONS.width * 0.5; // 0.8475m
  if (y < 0.34) {
    const t = THREE.MathUtils.clamp((y - 0.21) / 0.13, 0, 1);
    const eased = t * t * (3 - 2 * t);
    return THREE.MathUtils.lerp(maxHalfW - 0.042, maxHalfW - 0.004, eased);
  }
  if (y <= HIACE_DIMENSIONS.beltlineY) {
    const u = (y - 0.34) / (HIACE_DIMENSIONS.beltlineY - 0.34);
    let w = maxHalfW + Math.sin(u * Math.PI) * 0.0085;
    // Subtle lower rocker recess crease
    const lowerCrease = Math.exp(-Math.pow((y - 0.42) / 0.032, 2));
    w -= lowerCrease * 0.0075;
    // Clean horizontal character beltline ridge aligning with exposed sliding rail at y=1.12
    const beltRidge = Math.exp(-Math.pow((y - 1.12) / 0.022, 2));
    w += beltRidge * 0.006;
    return w;
  }
  // Smooth greenhouse tumblehome tapering inward from raised window sill (1.28m) to roof edge (1.92m)
  const u = THREE.MathUtils.clamp((y - HIACE_DIMENSIONS.beltlineY) / 0.64, 0, 1);
  const eased = u * u * (3 - 2 * u);
  return THREE.MathUtils.lerp(maxHalfW, 0.752, eased);
}

/**
 * Exact Toyota HiAce H200 cab-over front Z profile calibrated to the Commuter Van four-view sketch:
 * - Full near-vertical commercial bumper & crystal headlamp fascia (y=0.23..0.945)
 * - Tall flat-slab painted upper nose panel rising cleanly to the raised wiper cowl (y=0.945..1.355)
 * - Compact steeply raked laminated windshield sweeping up to thick painted roof brow (y=1.355..1.915)
 */
export function hiaceFrontZAtY(y: number): number {
  if (y <= 0.73) {
    const t = THREE.MathUtils.clamp((y - 0.23) / 0.5, 0, 1);
    return THREE.MathUtils.lerp(2.316, 2.345, Math.pow(t, 0.45));
  }
  if (y <= 0.945) {
    const t = (y - 0.73) / 0.215;
    return THREE.MathUtils.lerp(2.336, 2.308, t);
  }
  if (y <= 1.355) {
    // Tall, clean H200 cab-over upper nose slab (gives proper ratio to compact windshield above)
    const t = (y - 0.945) / 0.41;
    const smooth = t * t * (3 - 2 * t);
    return THREE.MathUtils.lerp(2.308, 2.138, smooth * 0.82 + t * 0.18);
  }
  // Compact steeply raked windshield up to roof header
  const t = THREE.MathUtils.clamp((y - 1.355) / 0.56, 0, 1);
  return THREE.MathUtils.lerp(2.138, 1.482, t);
}

/**
 * Exact Toyota HiAce H200 rear tailgate Z profile matching the tall lower panel and compact upper glass.
 */
export function hiaceRearZAtY(y: number): number {
  if (y <= 0.56) {
    return -2.348;
  }
  if (y <= 1.28) {
    const t = (y - 0.56) / 0.72;
    return THREE.MathUtils.lerp(-2.318, -2.295, t);
  }
  const t = THREE.MathUtils.clamp((y - 1.28) / 0.64, 0, 1);
  return THREE.MathUtils.lerp(-2.295, -2.212, t);
}

/**
 * Builds a continuous Class-A contoured side sheet-metal panel between zStart and zEnd
 * following exact vertical hiaceHalfWidthAtY(y) curvature.
 */
function createContouredSideBandGeometry(
  zStart: number,
  zEnd: number,
  yLevels: number[],
  sideSign: 1 | -1,
  zSegments = 18,
  outsetOffset = 0,
): THREE.BufferGeometry {
  const rows = yLevels.length;
  const cols = zSegments + 1;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let r = 0; r < rows; r++) {
    const y = yLevels[r];
    const x = (hiaceHalfWidthAtY(y) + outsetOffset) * sideSign;
    const v = r / (rows - 1);

    for (let c = 0; c < cols; c++) {
      const u = c / zSegments;
      const z = THREE.MathUtils.lerp(zStart, zEnd, u);
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
      if (sideSign > 0) {
        indices.push(a, d, b);
        indices.push(b, d, e);
      } else {
        indices.push(a, b, d);
        indices.push(b, e, d);
      }
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
 * Builds the gently sloping upper front-door skin connecting the horizontal beltline at the B-pillar
 * forward down to the wing mirror sail corner so there is zero gap beneath the compact cab glass.
 */
function createFrontDoorBeltCapGeometry(sideSign: 1 | -1, outsetOffset = 0.002): THREE.BufferGeometry {
  const zRear = 0.845;
  const zFront = 1.94;
  const cols = 10;
  const rows = 5;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let r = 0; r < rows; r++) {
    const v = r / (rows - 1);
    for (let c = 0; c <= cols; c++) {
      const u = c / cols;
      const z = THREE.MathUtils.lerp(zRear, zFront, u);
      const yTopAtZ = THREE.MathUtils.lerp(1.292, 1.218, u);
      const y = THREE.MathUtils.lerp(1.12, yTopAtZ, v);
      const x = (hiaceHalfWidthAtY(y) + outsetOffset) * sideSign;
      positions.push(x, y, z);
      uvs.push(u, v);
    }
  }

  const stride = cols + 1;
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols; c++) {
      const a = r * stride + c;
      const b = a + 1;
      const d = (r + 1) * stride + c;
      const e = d + 1;
      if (sideSign > 0) {
        indices.push(a, d, b);
        indices.push(b, d, e);
      } else {
        indices.push(a, b, d);
        indices.push(b, e, d);
      }
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
 * Builds the smooth rounded-corner flat-slab front nose loft with G1 tangent side lead-in skirts.
 */
function createLoftedNoseShell(
  yLevels: number[],
  cornerRadius: number,
  arcSegments: number,
): THREE.BufferGeometry {
  const cols = arcSegments * 2 + 4;
  const rows = yLevels.length;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let r = 0; r < rows; r++) {
    const y = yLevels[r];
    const hw = hiaceHalfWidthAtY(y);
    const fz = hiaceFrontZAtY(y);
    const cr = Math.min(cornerRadius, hw * 0.34);
    const flatHalfX = hw - cr;
    const sideStartZ = fz - cr * 1.06;

    const ringPts: [number, number][] = [];
    ringPts.push([hw, sideStartZ - 0.19]);
    for (let i = 0; i <= arcSegments; i++) {
      const a = (i / arcSegments) * (Math.PI * 0.5);
      const x = flatHalfX + Math.cos(a) * cr;
      const z = sideStartZ + Math.sin(a) * (cr * 1.06);
      ringPts.push([x, z]);
    }
    for (let i = 0; i <= arcSegments; i++) {
      const a = Math.PI * 0.5 + (i / arcSegments) * (Math.PI * 0.5);
      const x = -flatHalfX + Math.cos(a) * cr;
      const z = sideStartZ + Math.sin(a) * (cr * 1.06);
      ringPts.push([x, z]);
    }
    ringPts.push([-hw, sideStartZ - 0.19]);

    const v = r / (rows - 1);
    for (let c = 0; c < cols; c++) {
      const [px, pz] = ringPts[c];
      const centerFactor = 1 - Math.min(1, Math.abs(px) / hw);
      const crownZ = centerFactor * centerFactor * 0.032;
      positions.push(px, y, pz + crownZ);
      uvs.push(c / (cols - 1), v);
    }
  }

  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const a = r * cols + c;
      const b = a + 1;
      const d = (r + 1) * cols + c;
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
 * Builds the sturdy painted front roof brow header above the compact windshield (y=1.845..1.922),
 * matching the authentic thick header above the glass in the Front View sketch.
 */
function createFrontRoofHeaderGeometry(): THREE.BufferGeometry {
  const yLevels = [1.842, 1.87, 1.896, 1.918];
  const cols = 18;
  const rows = yLevels.length;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let r = 0; r < rows; r++) {
    const v = r / (rows - 1);
    const y = yLevels[r];
    const hw = hiaceHalfWidthAtY(y) - 0.008;
    const baseZ = hiaceFrontZAtY(y) + 0.006;

    for (let c = 0; c < cols; c++) {
      const u = c / (cols - 1);
      const nx = (u - 0.5) * 2;
      const x = nx * hw;
      const curveZ = (1 - nx * nx) * 0.048;
      // Blend gracefully into the roof crown at the top edge
      const crownBoost = v * Math.pow(Math.max(0, Math.cos(nx * Math.PI * 0.5)), 0.72) * 0.044;
      positions.push(x, y + crownBoost, baseZ + curveZ);
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
 * Builds rounded-corner rear D-pillar corner wraps connecting side quarters into the rear surround.
 */
function createRearCornerLoft(sideSign: 1 | -1): THREE.BufferGeometry {
  const yLevels = [0.56, 0.76, 0.96, 1.12, 1.28, 1.46, 1.66, 1.80, 1.912];
  const arcSegs = 6;
  const cols = arcSegs + 1;
  const rows = yLevels.length;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let r = 0; r < rows; r++) {
    const y = yLevels[r];
    const hw = hiaceHalfWidthAtY(y);
    const rz = hiaceRearZAtY(y);
    const cr = 0.145;
    const innerX = hw - cr;
    const startZ = rz + cr;

    for (let c = 0; c <= arcSegs; c++) {
      const a = (c / arcSegs) * (Math.PI * 0.5);
      const x = (innerX + Math.cos(a) * cr) * sideSign;
      const z = startZ - Math.sin(a) * cr;
      positions.push(x, y, z);
      uvs.push(c / arcSegs, r / (rows - 1));
    }
  }

  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const a = r * cols + c;
      const b = a + 1;
      const d = (r + 1) * cols + c;
      const e = d + 1;
      if (sideSign > 0) {
        indices.push(a, b, d);
        indices.push(b, e, d);
      } else {
        indices.push(a, d, b);
        indices.push(b, d, e);
      }
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
 * Builds the crowned roof panel stretching smoothly from front roof header to rear tailgate header.
 */
function createCrownedRoofGeometry(): THREE.BufferGeometry {
  const zStations = [1.488, 1.32, 0.9, 0.25, -0.45, -1.15, -1.8, -2.1, -2.215];
  const xSegments = 20;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let iz = 0; iz < zStations.length; iz++) {
    const z = zStations[iz];
    const isFrontEdge = iz === 0;
    const isRearEdge = iz === zStations.length - 1;
    const edgeDrop = isFrontEdge ? 0.016 : isRearEdge ? 0.015 : 0;
    const halfW = isFrontEdge ? 0.744 : isRearEdge ? 0.744 : 0.758;

    for (let ix = 0; ix <= xSegments; ix++) {
      const u = ix / xSegments;
      const nx = (u - 0.5) * 2;
      const x = nx * halfW;
      const frontCurveZ = isFrontEdge ? (1 - nx * nx) * 0.042 : 0;
      const crown = Math.cos(nx * Math.PI * 0.5);
      const y = 1.914 + Math.pow(Math.max(0, crown), 0.72) * 0.066 - edgeDrop;
      positions.push(x, y, z + frontCurveZ);
      uvs.push(u, iz / (zStations.length - 1));
    }
  }

  const stride = xSegments + 1;
  for (let iz = 0; iz < zStations.length - 1; iz++) {
    for (let ix = 0; ix < xSegments; ix++) {
      const a = iz * stride + ix;
      const b = a + 1;
      const c = (iz + 1) * stride + ix;
      const d = c + 1;
      indices.push(a, b, c);
      indices.push(b, d, c);
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
 * Builds structural lower body flank with exact semicircular wheel-arch cutouts
 * rising cleanly up to the raised 1.28m H200 side window sill.
 */
function createLowerSideFlankGeometry(
  zStart: number,
  zEnd: number,
  cutFrontArch: boolean,
  cutRearArch: boolean,
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const yBottom = 0.25;
  const yTop = HIACE_DIMENSIONS.beltlineY + 0.008; // 1.288m
  const archR = 0.402;
  const archCenterY = HIACE_DIMENSIONS.wheelRadius;

  shape.moveTo(zStart, yBottom);

  if (cutRearArch) {
    const rz = HIACE_DIMENSIONS.rearAxleZ;
    const dy = yBottom - archCenterY;
    const dx = Math.sqrt(Math.max(0.01, archR * archR - dy * dy));
    const startAngle = Math.atan2(dy, -dx);
    const endAngle = Math.atan2(dy, dx);
    shape.lineTo(rz - dx, yBottom);
    shape.absarc(rz, archCenterY, archR, startAngle, endAngle, true);
  }

  if (cutFrontArch) {
    const fz = HIACE_DIMENSIONS.frontAxleZ;
    const dy = yBottom - archCenterY;
    const dx = Math.sqrt(Math.max(0.01, archR * archR - dy * dy));
    const startAngle = Math.atan2(dy, -dx);
    const endAngle = Math.atan2(dy, dx);
    shape.lineTo(fz - dx, yBottom);
    shape.absarc(fz, archCenterY, archR, startAngle, endAngle, true);

    // Tuck cleanly behind front wraparound bumper & tall flat-slab nose
    shape.lineTo(Math.min(zEnd, 1.94), yBottom);
    shape.lineTo(Math.min(zEnd, 2.02), 0.72);
    shape.lineTo(Math.min(zEnd, 1.96), 1.215);
    // Gentle linear beltline slope toward wing mirror sail (matches sketch & Photo 2)
    shape.lineTo(0.845, yTop);
  } else {
    shape.lineTo(zEnd, yBottom);
    shape.lineTo(zEnd, yTop);
  }

  shape.lineTo(zStart, yTop);
  shape.closePath();

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: 0.056,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.01,
    bevelSegments: 3,
    curveSegments: 28,
  });

  geom.rotateY(-Math.PI * 0.5);
  return geom;
}

/**
 * Helper: Creates a tumblehome-contoured quad/box strip matching exact HiAce H200 greenhouse slope.
 */
export function createTumblehomeQuadGeometry(
  zBotRear: number,
  zBotFront: number,
  zTopFront: number,
  zTopRear: number,
  yBottom: number,
  yTop: number,
  sideSign: 1 | -1,
  outsetOffset = 0,
  thickness = 0.024,
): THREE.BufferGeometry {
  const xB = (hiaceHalfWidthAtY(yBottom) + outsetOffset) * sideSign;
  const xT = (hiaceHalfWidthAtY(yTop) + outsetOffset) * sideSign;
  const xBi = (hiaceHalfWidthAtY(yBottom) + outsetOffset - thickness) * sideSign;
  const xTi = (hiaceHalfWidthAtY(yTop) + outsetOffset - thickness) * sideSign;

  const verts = new Float32Array([
    xB, yBottom, zBotRear,
    xB, yBottom, zBotFront,
    xT, yTop, zTopFront,
    xT, yTop, zTopRear,

    xBi, yBottom, zBotRear,
    xBi, yBottom, zBotFront,
    xTi, yTop, zTopFront,
    xTi, yTop, zTopRear,
  ]);

  const indices =
    sideSign > 0
      ? [
          0, 2, 1, 0, 3, 2,
          4, 5, 6, 4, 6, 7,
          0, 1, 5, 0, 5, 4,
          3, 7, 6, 3, 6, 2,
          1, 2, 6, 1, 6, 5,
          0, 4, 7, 0, 7, 3,
        ]
      : [
          0, 1, 2, 0, 2, 3,
          4, 6, 5, 4, 7, 6,
          0, 5, 1, 0, 4, 5,
          3, 6, 7, 3, 2, 6,
          1, 6, 2, 1, 5, 6,
          0, 7, 4, 0, 3, 7,
        ];

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Builds the sturdy sloped A-pillar following steep HiAce windshield rake and greenhouse tumblehome.
 */
function createAPillarGeometry(sideSign: 1 | -1): THREE.BufferGeometry {
  const y0 = 1.24;
  const y1 = 1.916;
  const z0Front = hiaceFrontZAtY(y0) + 0.008;
  const z1Front = hiaceFrontZAtY(y1) + 0.014;
  const pillarW = 0.112;

  const x0Out = (hiaceHalfWidthAtY(y0) - 0.012) * sideSign;
  const x1Out = (hiaceHalfWidthAtY(y1) - 0.012) * sideSign;
  const x0In = (hiaceHalfWidthAtY(y0) - 0.102) * sideSign;
  const x1In = (hiaceHalfWidthAtY(y1) - 0.098) * sideSign;

  const verts = new Float32Array([
    x0Out, y0, z0Front - pillarW,
    x0Out, y0, z0Front,
    x1Out, y1, z1Front,
    x1Out, y1, z1Front - pillarW,

    x0In, y0, z0Front - pillarW,
    x0In, y0, z0Front,
    x1In, y1, z1Front,
    x1In, y1, z1Front - pillarW,
  ]);

  const indices =
    sideSign > 0
      ? [
          0, 2, 1, 0, 3, 2,
          4, 5, 6, 4, 6, 7,
          1, 2, 6, 1, 6, 5,
          0, 4, 7, 0, 7, 3,
          3, 7, 6, 3, 6, 2,
          0, 1, 5, 0, 5, 4,
        ]
      : [
          0, 1, 2, 0, 2, 3,
          4, 6, 5, 4, 7, 6,
          1, 6, 2, 1, 5, 6,
          0, 7, 4, 0, 3, 7,
          3, 6, 7, 3, 2, 6,
          0, 5, 1, 0, 4, 5,
        ];

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Builds the compact, authentic front cab door glass directly matching the Commuter sketch:
 * - Raised rear bottom sill (y=1.288) sloping gently forward to wing mirror corner (y=1.222)
 * - Compact horizontal span behind the thicker A-pillar and ahead of the sturdy wide white B-pillar
 * - Lower top edge (y=1.775) beneath the thicker white roof header
 */
function createFrontDoorWindowGeometry(
  sideSign: 1 | -1,
  outsetOffset = -0.005,
  insetPad = 0,
): THREE.BufferGeometry {
  const xOf = (y: number) => (hiaceHalfWidthAtY(y) + outsetOffset) * sideSign;

  const yRearBot = 1.288 + insetPad;
  const yFrontBot = 1.222 + insetPad;
  const yMidFront = 1.35 + insetPad * 0.6;
  const yTop = 1.775 - insetPad;

  const zRear = 0.855 + insetPad;
  const zFrontBot = 1.885 - insetPad;
  const zFrontCorner = 1.965 - insetPad;
  const zTopFront = 1.495 - insetPad * 1.1;

  const verts = new Float32Array([
    xOf(yRearBot), yRearBot, zRear,           // 0: rear-bottom (at wide B-pillar)
    xOf(yFrontBot), yFrontBot, zFrontBot,     // 1: front-bottom (at wing mirror sail)
    xOf(yMidFront), yMidFront, zFrontCorner,  // 2: lower A-pillar corner
    xOf(yTop), yTop, zTopFront,               // 3: top-front (A-pillar header)
    xOf(yTop), yTop, zRear,                   // 4: top-rear (B-pillar header)
  ]);

  const indices =
    sideSign > 0
      ? [0, 4, 1, 1, 4, 3, 1, 3, 2]
      : [0, 1, 4, 1, 3, 4, 1, 2, 3];

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Builds a sleek, slim smoked-acrylic front door rain visor hugging the compact y=1.79 window frame.
 */
function createFrontRainVisorGeometry(sideSign: 1 | -1): THREE.BufferGeometry {
  const spine: [number, number][] = [
    [0.84, 1.796],
    [1.06, 1.796],
    [1.28, 1.794],
    [1.48, 1.786],
    [1.58, 1.70],
    [1.72, 1.56],
    [1.86, 1.42],
    [1.95, 1.32],
  ];

  const positions: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i < spine.length; i++) {
    const [z, yTop] = spine[i];
    const t = i / (spine.length - 1);
    const drop = i <= 3 ? 0.056 : THREE.MathUtils.lerp(0.052, 0.028, (t - 0.42) / 0.58);
    const flareOut = i <= 3 ? 0.038 : THREE.MathUtils.lerp(0.036, 0.018, (t - 0.42) / 0.58);

    const xInner = (hiaceHalfWidthAtY(yTop) + 0.004) * sideSign;
    const xOuter = (hiaceHalfWidthAtY(yTop - drop) + flareOut) * sideSign;
    positions.push(xInner, yTop, z);
    positions.push(xOuter, yTop - drop, z);
  }

  for (let i = 0; i < spine.length - 1; i++) {
    const a = i * 2;
    const b = a + 1;
    const c = (i + 1) * 2;
    const d = c + 1;
    if (sideSign > 0) {
      indices.push(a, c, b);
      indices.push(b, c, d);
    } else {
      indices.push(a, b, c);
      indices.push(b, d, c);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Compact curved flush-mounted laminated front windshield (y=1.362..1.848) matching the sketch.
 */
function createWindshieldGeometry(): THREE.BufferGeometry {
  const rows = 10;
  const cols = 18;
  const yMin = 1.362;
  const yMax = 1.848;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let r = 0; r < rows; r++) {
    const v = r / (rows - 1);
    const y = THREE.MathUtils.lerp(yMin, yMax, v);
    const hw = hiaceHalfWidthAtY(y) - 0.088;
    const baseZ = hiaceFrontZAtY(y) - 0.004;

    for (let c = 0; c < cols; c++) {
      const u = c / (cols - 1);
      const nx = (u - 0.5) * 2;
      const x = nx * hw;
      const curveZ = (1 - nx * nx) * 0.052;
      positions.push(x, y, baseZ + curveZ);
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
 * Restrained stamped wheel-arch lip crease matching the flush wheel arches in Photo 2 & sketch.
 */
function createSubtleWheelArchLipGeometry(): THREE.BufferGeometry {
  const outerR = 0.432;
  const innerR = 0.398;
  const shape = new THREE.Shape();
  const startA = -0.14;
  const endA = Math.PI + 0.14;

  shape.absarc(0, 0, outerR, startA, endA, false);
  shape.absarc(0, 0, innerR, endA, startA, true);
  shape.closePath();

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: 0.014,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.006,
    bevelSegments: 2,
    curveSegments: 32,
  });
  geom.rotateY(-Math.PI * 0.5);
  return geom;
}

export function buildHiAceBodyShell(materials: HiAceMaterialLibrary): HiAceBodyShellResult {
  const root = new THREE.Group();
  root.name = 'HiAceBodyShell';

  const geometries: THREE.BufferGeometry[] = [];
  const edgeOverlays: THREE.LineSegments[] = [];

  const trackGeom = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };

  const addWireOverlay = (geom: THREE.BufferGeometry, parent: THREE.Object3D, threshold = 22) => {
    const edges = trackGeom(new THREE.EdgesGeometry(geom, threshold));
    const lines = new THREE.LineSegments(edges, materials.edgeLine);
    lines.visible = false;
    parent.add(lines);
    edgeOverlays.push(lines);
  };

  const halfW = HIACE_DIMENSIONS.width * 0.5;

  // =========================================================================
  // 1. TALL FLAT-SLAB CAB-OVER FRONT NOSE LOFT & RAISED WIPER COWL
  // =========================================================================
  const noseGeom = trackGeom(
    createLoftedNoseShell([0.72, 0.82, 0.945, 1.05, 1.16, 1.26, 1.355], 0.175, 9),
  );
  const noseMesh = new THREE.Mesh(noseGeom, materials.bodyPaint);
  noseMesh.castShadow = true;
  noseMesh.receiveShadow = true;
  addWireOverlay(noseGeom, noseMesh, 26);
  root.add(noseMesh);

  // Recessed matte black windshield wiper cowl panel & twin washer nozzles (raised to y=1.352)
  const cowlGeom = trackGeom(new THREE.BoxGeometry(1.48, 0.044, 0.125));
  const cowlMesh = new THREE.Mesh(cowlGeom, materials.matteBlackTrim);
  cowlMesh.position.set(0, 1.352, 2.126);
  cowlMesh.rotation.x = 0.42;
  root.add(cowlMesh);

  const nozzleGeom = trackGeom(new THREE.BoxGeometry(0.022, 0.012, 0.026));
  for (const nx of [-0.34, 0.34]) {
    const nozzle = new THREE.Mesh(nozzleGeom, materials.matteBlackTrim);
    nozzle.position.set(nx, 1.374, 2.118);
    root.add(nozzle);
  }

  // Thick solid painted front roof brow header above the compact windshield (Front View sketch)
  const frontHeaderGeom = trackGeom(createFrontRoofHeaderGeometry());
  const frontHeader = new THREE.Mesh(frontHeaderGeom, materials.bodyPaint);
  frontHeader.castShadow = true;
  frontHeader.receiveShadow = true;
  addWireOverlay(frontHeaderGeom, frontHeader, 24);
  root.add(frontHeader);

  // =========================================================================
  // 2. TALL LOWER BODY FLANKS (RISING TO y=1.28) + CLASS-A CONTOURED SKINS
  // =========================================================================
  const rightFlankGeom = trackGeom(createLowerSideFlankGeometry(-2.22, 2.04, true, true));
  const rightFlank = new THREE.Mesh(rightFlankGeom, materials.bodyPaint);
  rightFlank.position.x = -halfW + 0.078;
  rightFlank.castShadow = true;
  rightFlank.receiveShadow = true;
  addWireOverlay(rightFlankGeom, rightFlank, 20);
  root.add(rightFlank);

  const leftFrontFlankGeom = trackGeom(createLowerSideFlankGeometry(0.56, 2.04, true, false));
  const leftFrontFlank = new THREE.Mesh(leftFrontFlankGeom, materials.bodyPaint);
  leftFrontFlank.position.x = halfW - 0.022;
  leftFrontFlank.castShadow = true;
  leftFrontFlank.receiveShadow = true;
  addWireOverlay(leftFrontFlankGeom, leftFrontFlank, 20);
  root.add(leftFrontFlank);

  const leftRearFlankGeom = trackGeom(createLowerSideFlankGeometry(-2.22, -0.78, false, true));
  const leftRearFlank = new THREE.Mesh(leftRearFlankGeom, materials.bodyPaint);
  leftRearFlank.position.x = halfW - 0.022;
  leftRearFlank.castShadow = true;
  leftRearFlank.receiveShadow = true;
  addWireOverlay(leftRearFlankGeom, leftRearFlank, 20);
  root.add(leftRearFlank);

  const upperBandY = [0.76, 0.88, 1.00, 1.08, 1.12, 1.19, 1.25, 1.292];
  const frontLowerUpperY = [0.76, 0.88, 1.00, 1.08, 1.125];
  const lowerDoorY = [0.34, 0.39, 0.42, 0.48, 0.58, 0.68, 0.765];

  // Right side (-X): continuous contoured upper swage & sculpted lower center flank
  const rightUpperSkin = new THREE.Mesh(
    trackGeom(createContouredSideBandGeometry(-2.14, 0.85, upperBandY, -1, 24, 0.002)),
    materials.bodyPaint,
  );
  rightUpperSkin.castShadow = true;
  rightUpperSkin.receiveShadow = true;
  root.add(rightUpperSkin);

  const rightFrontSkin = new THREE.Mesh(
    trackGeom(createContouredSideBandGeometry(0.84, 1.96, frontLowerUpperY, -1, 10, 0.002)),
    materials.bodyPaint,
  );
  rightFrontSkin.castShadow = true;
  rightFrontSkin.receiveShadow = true;
  root.add(rightFrontSkin);

  const rightFrontBeltCap = new THREE.Mesh(
    trackGeom(createFrontDoorBeltCapGeometry(-1, 0.002)),
    materials.bodyPaint,
  );
  rightFrontBeltCap.castShadow = true;
  rightFrontBeltCap.receiveShadow = true;
  root.add(rightFrontBeltCap);

  const rightLowerMidSkin = new THREE.Mesh(
    trackGeom(createContouredSideBandGeometry(-0.88, 0.82, lowerDoorY, -1, 14, 0.002)),
    materials.bodyPaint,
  );
  rightLowerMidSkin.castShadow = true;
  rightLowerMidSkin.receiveShadow = true;
  root.add(rightLowerMidSkin);

  // Left side (+X): contoured skins ahead of & behind the live sliding door opening
  const leftFrontUpperSkin = new THREE.Mesh(
    trackGeom(createContouredSideBandGeometry(0.562, 0.85, upperBandY, 1, 5, 0.002)),
    materials.bodyPaint,
  );
  leftFrontUpperSkin.castShadow = true;
  leftFrontUpperSkin.receiveShadow = true;
  root.add(leftFrontUpperSkin);

  const leftFrontSkin = new THREE.Mesh(
    trackGeom(createContouredSideBandGeometry(0.84, 1.96, frontLowerUpperY, 1, 10, 0.002)),
    materials.bodyPaint,
  );
  leftFrontSkin.castShadow = true;
  leftFrontSkin.receiveShadow = true;
  root.add(leftFrontSkin);

  const leftFrontBeltCap = new THREE.Mesh(
    trackGeom(createFrontDoorBeltCapGeometry(1, 0.002)),
    materials.bodyPaint,
  );
  leftFrontBeltCap.castShadow = true;
  leftFrontBeltCap.receiveShadow = true;
  root.add(leftFrontBeltCap);

  const leftRearUpperSkin = new THREE.Mesh(
    trackGeom(createContouredSideBandGeometry(-2.14, -0.782, upperBandY, 1, 12, 0.002)),
    materials.bodyPaint,
  );
  leftRearUpperSkin.castShadow = true;
  leftRearUpperSkin.receiveShadow = true;
  root.add(leftRearUpperSkin);

  // Sculpted lower rocker sill step inside the openable sliding door bay (+X)
  const sillStep = new THREE.Mesh(
    trackGeom(new THREE.BoxGeometry(0.11, 0.082, 1.36)),
    materials.bodyPaint,
  );
  sillStep.position.set(halfW - 0.062, 0.285, -0.11);
  sillStep.castShadow = true;
  sillStep.receiveShadow = true;
  root.add(sillStep);

  const entryStepPad = new THREE.Mesh(
    trackGeom(new THREE.BoxGeometry(0.16, 0.018, 1.24)),
    materials.stepPadRubber,
  );
  entryStepPad.position.set(halfW - 0.14, 0.335, -0.11);
  root.add(entryStepPad);

  // Rounded rear corner wrap lofts
  for (const side of [-1, 1] as const) {
    const cornerGeom = trackGeom(createRearCornerLoft(side));
    const corner = new THREE.Mesh(cornerGeom, materials.bodyPaint);
    corner.castShadow = true;
    corner.receiveShadow = true;
    addWireOverlay(cornerGeom, corner, 26);
    root.add(corner);
  }

  // =========================================================================
  // 3. RESTRAINED STAMPED WHEEL ARCH LIPS & RECESSED WHEEL-WELL LINERS (×4)
  // =========================================================================
  const lipGeom = trackGeom(createSubtleWheelArchLipGeometry());
  const linerGeom = trackGeom(
    new THREE.CylinderGeometry(0.398, 0.398, 0.34, 28, 1, true, 0, Math.PI),
  );
  linerGeom.rotateZ(Math.PI * 0.5);

  const wheelPositions: { x: number; z: number; side: 1 | -1 }[] = [
    { x: halfW - 0.002, z: HIACE_DIMENSIONS.frontAxleZ, side: 1 },
    { x: -halfW + 0.002, z: HIACE_DIMENSIONS.frontAxleZ, side: -1 },
    { x: halfW - 0.002, z: HIACE_DIMENSIONS.rearAxleZ, side: 1 },
    { x: -halfW + 0.002, z: HIACE_DIMENSIONS.rearAxleZ, side: -1 },
  ];

  for (const wp of wheelPositions) {
    const archLip = new THREE.Mesh(lipGeom, materials.bodyPaint);
    archLip.position.set(wp.side > 0 ? wp.x : wp.x + 0.014, HIACE_DIMENSIONS.wheelRadius, wp.z);
    archLip.castShadow = true;
    archLip.receiveShadow = true;
    root.add(archLip);

    const liner = new THREE.Mesh(linerGeom, materials.wheelWellLiner);
    liner.position.set(wp.side * (halfW - 0.175), HIACE_DIMENSIONS.wheelRadius, wp.z);
    root.add(liner);

    const wellBackGeom = trackGeom(new THREE.CircleGeometry(0.4, 24));
    wellBackGeom.rotateY(wp.side > 0 ? Math.PI * 0.5 : -Math.PI * 0.5);
    const wellBack = new THREE.Mesh(wellBackGeom, materials.wheelWellLiner);
    wellBack.position.set(wp.side * (halfW - 0.34), HIACE_DIMENSIONS.wheelRadius, wp.z);
    root.add(wellBack);
  }

  // =========================================================================
  // 4. COMPACT HIACE H200 GREENHOUSE (y=1.285..1.790), THICK CANTRAIL & COMMUTER MULLIONS
  // =========================================================================
  for (const side of [-1, 1] as const) {
    const aPillarGeom = trackGeom(createAPillarGeometry(side));
    const aPillar = new THREE.Mesh(aPillarGeom, materials.bodyPaint);
    aPillar.castShadow = true;
    root.add(aPillar);

    // Authentic thicker painted upper roof cantrail above compact side windows (y=1.785..1.922)
    const cantrailGeom = trackGeom(
      createTumblehomeQuadGeometry(-2.2, 1.5, 1.5, -2.2, 1.785, 1.922, side, 0.002, 0.068),
    );
    const cantrail = new THREE.Mesh(cantrailGeom, materials.bodyPaint);
    cantrail.castShadow = true;
    cantrail.receiveShadow = true;
    addWireOverlay(cantrailGeom, cantrail, 20);
    root.add(cantrail);

    // Sturdy wide painted fixed B-pillar between compact front cab door window (z=0.845) and door seam (z=0.56)
    const frontBPillarGeom = trackGeom(
      createTumblehomeQuadGeometry(0.56, 0.85, 0.85, 0.56, 1.275, 1.795, side, 0.002, 0.058),
    );
    const frontBPillar = new THREE.Mesh(frontBPillarGeom, materials.bodyPaint);
    frontBPillar.castShadow = true;
    frontBPillar.receiveShadow = true;
    root.add(frontBPillar);

    // Right-side (-X) diagonal slanted B-pillar painted wedge + compact 3-pane sliding commuter bay
    // (+X side lives inside slidingDoorGroup so it animates smoothly with the sliding door!)
    if (side < 0) {
      const slantedWedgeGeom = trackGeom(
        createTumblehomeQuadGeometry(0.255, 0.565, 0.565, 0.435, 1.275, 1.795, side, 0.002, 0.054),
      );
      const slantedWedge = new THREE.Mesh(slantedWedgeGeom, materials.bodyPaint);
      slantedWedge.castShadow = true;
      slantedWedge.receiveShadow = true;
      root.add(slantedWedge);

      // Compact perimeter black rubber frame around middle commuter window (-X)
      const midTopFrame = new THREE.Mesh(
        trackGeom(createTumblehomeQuadGeometry(-0.69, 0.43, 0.44, -0.69, 1.76, 1.792, side, 0.001, 0.022)),
        materials.glossBlackPillar,
      );
      const midBotFrame = new THREE.Mesh(
        trackGeom(createTumblehomeQuadGeometry(-0.69, 0.26, 0.27, -0.69, 1.282, 1.314, side, 0.001, 0.022)),
        materials.glossBlackPillar,
      );
      const midLeadFrame = new THREE.Mesh(
        trackGeom(createTumblehomeQuadGeometry(0.255, 0.295, 0.435, 0.395, 1.282, 1.792, side, 0.001, 0.022)),
        materials.glossBlackPillar,
      );
      root.add(midTopFrame, midBotFrame, midLeadFrame);

      // Light commuter tinted middle bay glass (-X) revealing interior multi-row seats
      const midGlass = new THREE.Mesh(
        trackGeom(createTumblehomeQuadGeometry(-0.67, 0.29, 0.405, -0.67, 1.312, 1.762, side, -0.002, 0.008)),
        materials.privacyGlass,
      );
      midGlass.renderOrder = 2;
      root.add(midGlass);

      // Authentic 2-mullion / 3-pane commuter sliding window dividers (-X, directly matching sketch Right Side View!)
      root.add(
        new THREE.Mesh(
          trackGeom(createTumblehomeQuadGeometry(-0.275, -0.245, -0.245, -0.275, 1.308, 1.766, side, 0.002, 0.016)),
          materials.matteBlackTrim,
        ),
        new THREE.Mesh(
          trackGeom(createTumblehomeQuadGeometry(0.055, 0.085, 0.085, 0.055, 1.308, 1.766, side, 0.002, 0.016)),
          materials.matteBlackTrim,
        ),
        new THREE.Mesh(
          trackGeom(createTumblehomeQuadGeometry(-0.275, 0.085, 0.085, -0.275, 1.746, 1.768, side, 0.002, 0.014)),
          materials.matteBlackTrim,
        ),
        new THREE.Mesh(
          trackGeom(createTumblehomeQuadGeometry(-0.275, 0.085, 0.085, -0.275, 1.306, 1.328, side, 0.002, 0.014)),
          materials.matteBlackTrim,
        ),
      );
    }

    // Crisp gloss-black C-pillar divider between middle bay & rear quarter bay
    const cPillarGeom = trackGeom(
      createTumblehomeQuadGeometry(-0.79, -0.68, -0.68, -0.79, 1.282, 1.792, side, 0.001, 0.052),
    );
    const cPillar = new THREE.Mesh(cPillarGeom, materials.glossBlackPillar);
    cPillar.castShadow = true;
    root.add(cPillar);

    // Sturdy wide painted D-pillar at rear corner (z=-2.14..-1.94, matches sketch)
    const dPillarGeom = trackGeom(
      createTumblehomeQuadGeometry(-2.14, -1.94, -1.94, -2.14, 1.275, 1.912, side, 0.002, 0.074),
    );
    const dPillar = new THREE.Mesh(dPillarGeom, materials.bodyPaint);
    dPillar.castShadow = true;
    dPillar.receiveShadow = true;
    addWireOverlay(dPillarGeom, dPillar, 20);
    root.add(dPillar);

    // Compact rear quarter window black perimeter moldings + light commuter glass (no opaque slab behind it!)
    const rqTop = new THREE.Mesh(
      trackGeom(createTumblehomeQuadGeometry(-1.945, -0.785, -0.785, -1.945, 1.76, 1.792, side, 0.001, 0.022)),
      materials.glossBlackPillar,
    );
    const rqBot = new THREE.Mesh(
      trackGeom(createTumblehomeQuadGeometry(-1.945, -0.785, -0.785, -1.945, 1.282, 1.314, side, 0.001, 0.022)),
      materials.glossBlackPillar,
    );
    const rqRear = new THREE.Mesh(
      trackGeom(createTumblehomeQuadGeometry(-1.945, -1.91, -1.91, -1.945, 1.282, 1.792, side, 0.001, 0.022)),
      materials.glossBlackPillar,
    );
    root.add(rqTop, rqBot, rqRear);

    const rearQtrGlass = new THREE.Mesh(
      trackGeom(createTumblehomeQuadGeometry(-1.912, -0.788, -0.788, -1.912, 1.312, 1.762, side, -0.002, 0.008)),
      materials.privacyGlass,
    );
    rearQtrGlass.renderOrder = 2;
    root.add(rearQtrGlass);

    // Compact Front Cab Door Window (light commuter tint) + crisp perimeter weatherstrip rails
    const fWin = new THREE.Mesh(
      trackGeom(createFrontDoorWindowGeometry(side, -0.005, 0)),
      materials.windshieldGlass,
    );
    fWin.renderOrder = 2;
    root.add(fWin);

    // Crisp black rubber lower beltline weatherstrip along gently sloping front cab window sill
    const frontSillMold = new THREE.Mesh(
      trackGeom(new THREE.BoxGeometry(0.024, 0.024, 1.06)),
      materials.matteBlackTrim,
    );
    frontSillMold.position.set(side * (hiaceHalfWidthAtY(1.255) - 0.002), 1.255, 1.365);
    frontSillMold.rotation.x = 0.064;
    root.add(frontSillMold);

    // Black vertical rear channel trim along front cab door window
    const fRearTrim = new THREE.Mesh(
      trackGeom(createTumblehomeQuadGeometry(0.835, 0.862, 0.862, 0.835, 1.282, 1.79, side, 0.002, 0.016)),
      materials.matteBlackTrim,
    );
    root.add(fRearTrim);

    // Black top rubber seal above front cab door window
    const fTopTrim = new THREE.Mesh(
      trackGeom(createTumblehomeQuadGeometry(0.835, 1.5, 1.5, 0.835, 1.768, 1.792, side, 0.002, 0.016)),
      materials.matteBlackTrim,
    );
    root.add(fTopTrim);

    // Slim translucent smoked-acrylic front door rain visor
    const rainVisor = new THREE.Mesh(
      trackGeom(createFrontRainVisorGeometry(side)),
      materials.rainVisorGlass,
    );
    rainVisor.renderOrder = 4;
    root.add(rainVisor);
  }

  // =========================================================================
  // 5. CROWNED ROOF PANEL, ROOF DRIP MOLDINGS & 5 STAMPED ROOF RIBS
  // =========================================================================
  const roofGeom = trackGeom(createCrownedRoofGeometry());
  const roofMesh = new THREE.Mesh(roofGeom, materials.bodyPaint);
  roofMesh.castShadow = true;
  roofMesh.receiveShadow = true;
  addWireOverlay(roofGeom, roofMesh, 18);
  root.add(roofMesh);

  const dripGeom = trackGeom(new THREE.BoxGeometry(0.024, 0.016, 3.6));
  for (const side of [-1, 1] as const) {
    const drip = new THREE.Mesh(dripGeom, materials.matteBlackTrim);
    drip.position.set(side * 0.702, 1.938, -0.36);
    root.add(drip);
  }

  const ribGeom = trackGeom(new THREE.BoxGeometry(0.052, 0.012, 3.24));
  for (const rx of [-0.46, -0.23, 0, 0.23, 0.46]) {
    const nx = rx / 0.76;
    const crownY = 1.914 + Math.pow(Math.max(0, Math.cos(nx * Math.PI * 0.5)), 0.72) * 0.066;
    const rib = new THREE.Mesh(ribGeom, materials.bodyPaint);
    rib.position.set(rx, crownY + 0.003, -0.4);
    rib.receiveShadow = true;
    root.add(rib);
  }

  // =========================================================================
  // 6. COMPACT LAMINATED CURVED WINDSHIELD & BLACK PERIMETER RUBBER GASKET
  // =========================================================================
  const wsGeom = trackGeom(createWindshieldGeometry());
  const wsMesh = new THREE.Mesh(wsGeom, materials.windshieldGlass);
  wsMesh.renderOrder = 3;
  root.add(wsMesh);

  const wsTopGasket = new THREE.Mesh(
    trackGeom(new THREE.BoxGeometry(1.4, 0.032, 0.044)),
    materials.matteBlackTrim,
  );
  wsTopGasket.position.set(0, 1.845, 1.595);
  root.add(wsTopGasket);

  // =========================================================================
  // 7. UNDERBODY CHASSIS & LHD MULTI-ROW COMMUTER CABIN INTERIOR
  // =========================================================================
  const floorpan = new THREE.Mesh(
    trackGeom(new THREE.BoxGeometry(1.56, 0.095, 4.46)),
    materials.wheelWellLiner,
  );
  floorpan.position.set(0, 0.27, -0.02);
  floorpan.castShadow = true;
  floorpan.receiveShadow = true;
  root.add(floorpan);

  const cargoDeck = new THREE.Mesh(
    trackGeom(new THREE.BoxGeometry(1.46, 0.03, 2.88)),
    materials.cargoFloor,
  );
  cargoDeck.position.set(0, 0.342, -0.74);
  cargoDeck.receiveShadow = true;
  root.add(cargoDeck);

  // Bright warm-gray commuter headliner so the light-tinted windows show genuine cabin depth
  const headliner = new THREE.Mesh(
    trackGeom(new THREE.BoxGeometry(1.4, 0.036, 3.45)),
    materials.interiorHeadliner,
  );
  headliner.position.set(0, 1.875, -0.4);
  root.add(headliner);

  const innerWall = new THREE.Mesh(
    trackGeom(new THREE.BoxGeometry(0.04, 0.92, 3.9)),
    materials.interiorDash,
  );
  innerWall.position.set(-halfW + 0.075, 0.8, -0.2);
  root.add(innerWall);

  const firewall = new THREE.Mesh(
    trackGeom(new THREE.BoxGeometry(1.54, 0.92, 0.14)),
    materials.wheelWellLiner,
  );
  firewall.position.set(0, 0.84, 2.12);
  root.add(firewall);

  // LHD Dashboard + Optitron instrument cluster (+X = Vehicle Left = Appears RIGHT in Front View sketch!)
  const dashMain = new THREE.Mesh(
    trackGeom(new THREE.BoxGeometry(1.52, 0.34, 0.44)),
    materials.interiorDash,
  );
  dashMain.position.set(0, 1.14, 1.84);
  root.add(dashMain);

  const binnacle = new THREE.Mesh(
    trackGeom(new THREE.BoxGeometry(0.44, 0.13, 0.3)),
    materials.interiorDash,
  );
  binnacle.position.set(0.41, 1.33, 1.81);
  root.add(binnacle);

  const gaugeFace = new THREE.Mesh(
    trackGeom(new THREE.PlaneGeometry(0.36, 0.105)),
    materials.dashCluster,
  );
  gaugeFace.position.set(0.41, 1.32, 1.658);
  gaugeFace.rotation.y = Math.PI;
  root.add(gaugeFace);

  const navScreen = new THREE.Mesh(
    trackGeom(new THREE.BoxGeometry(0.24, 0.15, 0.025)),
    materials.glossBlackPillar,
  );
  navScreen.position.set(0, 1.22, 1.62);
  root.add(navScreen);

  // LHD Steering Column & Wheel (+X = vehicle left, directly matching Front View sketch!)
  const columnGeom = trackGeom(new THREE.CylinderGeometry(0.036, 0.042, 0.34, 14));
  columnGeom.rotateX(Math.PI * 0.34);
  const column = new THREE.Mesh(columnGeom, materials.matteBlackTrim);
  column.position.set(0.41, 1.22, 1.6);
  root.add(column);

  const steeringWheelGroup = new THREE.Group();
  steeringWheelGroup.position.set(0.41, 1.34, 1.5);
  steeringWheelGroup.rotation.x = -0.52;
  steeringWheelGroup.add(
    new THREE.Mesh(
      trackGeom(new THREE.TorusGeometry(0.178, 0.02, 12, 28)),
      materials.interiorLeather,
    ),
  );
  const hornPad = new THREE.Mesh(
    trackGeom(new THREE.CylinderGeometry(0.056, 0.056, 0.034, 18)),
    materials.interiorDash,
  );
  hornPad.rotation.x = Math.PI * 0.5;
  steeringWheelGroup.add(hornPad);
  root.add(steeringWheelGroup);

  // Center rearview mirror & twin sun visors clearly visible inside top windshield
  const intMirror = new THREE.Mesh(
    trackGeom(new THREE.BoxGeometry(0.21, 0.056, 0.028)),
    materials.matteBlackTrim,
  );
  intMirror.position.set(0, 1.72, 1.58);
  root.add(intMirror);

  const visorGeom = trackGeom(new THREE.BoxGeometry(0.48, 0.11, 0.018));
  for (const vx of [-0.36, 0.36]) {
    const visor = new THREE.Mesh(visorGeom, materials.interiorHeadliner);
    visor.position.set(vx, 1.81, 1.54);
    visor.rotation.x = 0.22;
    root.add(visor);
  }

  // Front Cab Commuter Seats (Driver +X, Center Jump Seat, Passenger -X)
  const seatCushionGeom = trackGeom(new THREE.BoxGeometry(0.46, 0.145, 0.48));
  const seatBackGeom = trackGeom(new THREE.BoxGeometry(0.44, 0.62, 0.125));
  const seatBolsterGeom = trackGeom(new THREE.BoxGeometry(0.08, 0.58, 0.145));
  const headrestGeom = trackGeom(new THREE.BoxGeometry(0.23, 0.195, 0.095));

  for (const sx of [-0.43, 0.43]) {
    const seatGroup = new THREE.Group();
    seatGroup.position.set(sx, 0.78, 1.15);

    const cushion = new THREE.Mesh(seatCushionGeom, materials.interiorLeather);
    cushion.position.set(0, 0, 0.06);
    seatGroup.add(cushion);

    const back = new THREE.Mesh(seatBackGeom, materials.interiorSeat);
    back.position.set(0, 0.36, -0.17);
    back.rotation.x = -0.12;
    seatGroup.add(back);

    for (const bx of [-0.19, 0.19]) {
      const bolster = new THREE.Mesh(seatBolsterGeom, materials.interiorLeather);
      bolster.position.set(bx, 0.36, -0.155);
      bolster.rotation.x = -0.12;
      seatGroup.add(bolster);
    }

    const head = new THREE.Mesh(headrestGeom, materials.interiorSeat);
    head.position.set(0, 0.78, -0.21);
    seatGroup.add(head);

    const ped = new THREE.Mesh(
      trackGeom(new THREE.BoxGeometry(0.46, 0.4, 0.54)),
      materials.interiorDash,
    );
    ped.position.set(0, -0.24, 0.03);
    seatGroup.add(ped);

    root.add(seatGroup);
  }

  // Front center folding commuter jump seat
  const jumpCushion = new THREE.Mesh(
    trackGeom(new THREE.BoxGeometry(0.32, 0.14, 0.44)),
    materials.interiorSeat,
  );
  jumpCushion.position.set(0, 0.77, 1.18);
  root.add(jumpCushion);

  const jumpBack = new THREE.Mesh(
    trackGeom(new THREE.BoxGeometry(0.3, 0.46, 0.11)),
    materials.interiorSeat,
  );
  jumpBack.position.set(0, 1.04, 0.99);
  jumpBack.rotation.x = -0.12;
  root.add(jumpBack);

  // Multi-Row Commuter Passenger Bench Rows (Row 2, Row 3, Row 4 — visible through all commuter windows!)
  const benchCushionGeom = trackGeom(new THREE.BoxGeometry(1.26, 0.15, 0.48));
  const benchSupportGeom = trackGeom(new THREE.BoxGeometry(1.12, 0.3, 0.38));
  const benchBackGeom = trackGeom(new THREE.BoxGeometry(1.26, 0.58, 0.125));

  const benchSpecs: { z: number; headrests: number[] }[] = [
    { z: 0.16, headrests: [-0.38, 0.0, 0.38] },
    { z: -0.68, headrests: [-0.38, 0.0, 0.38] },
    { z: -1.52, headrests: [-0.36, 0.36] },
  ];

  for (const row of benchSpecs) {
    const benchGroup = new THREE.Group();
    benchGroup.position.set(0, 0.72, row.z);

    benchGroup.add(new THREE.Mesh(benchCushionGeom, materials.interiorLeather));

    const benchSupport = new THREE.Mesh(benchSupportGeom, materials.interiorDash);
    benchSupport.position.set(0, -0.22, 0);
    benchGroup.add(benchSupport);

    const benchBack = new THREE.Mesh(benchBackGeom, materials.interiorSeat);
    benchBack.position.set(0, 0.35, -0.19);
    benchBack.rotation.x = -0.14;
    benchGroup.add(benchBack);

    for (const hx of row.headrests) {
      const hr = new THREE.Mesh(headrestGeom, materials.interiorSeat);
      hr.position.set(hx, 0.75, -0.24);
      benchGroup.add(hr);
    }

    root.add(benchGroup);
  }

  return {
    group: root,
    edgeOverlays,
    dispose: () => {
      geometries.forEach((g) => g.dispose());
    },
  };
}
