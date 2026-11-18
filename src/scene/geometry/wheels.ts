import * as THREE from 'three';
import { HIACE_DIMENSIONS, TrimSpec } from '../../types/hiace';
import { HiAceMaterialLibrary } from '../materials';

export interface HiAceWheelRig {
  group: THREE.Group;
  frontLeftSteer: THREE.Group;
  frontRightSteer: THREE.Group;
  wheelSpinners: THREE.Group[];
  setTrimSpec: (trim: TrimSpec) => void;
  dispose: () => void;
}

/**
 * Builds a sculpted annular sidewall cap with planar polar UVs so the
 * procedural 195/80R15 sidewall typography wraps cleanly around the tire face.
 */
function createSidewallRingGeometry(
  innerR: number,
  outerR: number,
  bulgeX: number,
  sideSign: 1 | -1,
  radialSegs = 40,
): THREE.BufferGeometry {
  const rings = 5;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let r = 0; r <= rings; r++) {
    const t = r / rings;
    const rad = THREE.MathUtils.lerp(innerR, outerR, t);
    const bulge = Math.sin(t * Math.PI) * bulgeX;
    const x = sideSign * bulge;

    for (let s = 0; s <= radialSegs; s++) {
      const a = (s / radialSegs) * Math.PI * 2;
      const y = Math.cos(a) * rad;
      const z = Math.sin(a) * rad;
      positions.push(x, y, z);

      const uNorm = 0.5 + (z / (outerR * 1.03)) * 0.5;
      const vNorm = 0.5 + (y / (outerR * 1.03)) * 0.5;
      uvs.push(uNorm, vNorm);
    }
  }

  const stride = radialSegs + 1;
  for (let r = 0; r < rings; r++) {
    for (let s = 0; s < radialSegs; s++) {
      const a = r * stride + s;
      const b = a + 1;
      const c = (r + 1) * stride + s;
      const d = c + 1;
      if (sideSign > 0) {
        indices.push(a, c, b);
        indices.push(b, c, d);
      } else {
        indices.push(a, b, c);
        indices.push(b, d, c);
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
 * Builds the authentic Cargo DX 15" black stamped commercial steel wheel disc
 * with 14 circular ventilation cutouts (directly matching Photos 2, 3, and 4).
 */
function createPerforatedSteelDiscGeometry(rimR: number): THREE.BufferGeometry {
  const discShape = new THREE.Shape();
  discShape.absarc(0, 0, rimR - 0.016, 0, Math.PI * 2, false);

  // Center bore cutout for silver hub cone
  const centerHole = new THREE.Path();
  centerHole.absarc(0, 0, 0.044, 0, Math.PI * 2, true);
  discShape.holes.push(centerHole);

  // Ring of 14 circular commercial ventilation perforations
  const ventCount = 14;
  const ventRingR = rimR * 0.68;
  const ventR = 0.0135;
  for (let i = 0; i < ventCount; i++) {
    const a = (i / ventCount) * Math.PI * 2;
    const hole = new THREE.Path();
    hole.absarc(Math.cos(a) * ventRingR, Math.sin(a) * ventRingR, ventR, 0, Math.PI * 2, true);
    discShape.holes.push(hole);
  }

  const geom = new THREE.ExtrudeGeometry(discShape, {
    depth: 0.014,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.003,
    bevelSegments: 2,
    curveSegments: 16,
  });
  geom.translate(0, 0, -0.007);
  geom.rotateY(Math.PI * 0.5);
  return geom;
}

/**
 * Builds the authentic Super GL 15" Toyota OEM 6-spoke silver full wheel cover
 * with 6 wide sculpted spokes and rounded-wedge vent cutouts (matching Photo 1).
 */
function createSuperGlWheelCoverGeometry(rimR: number): THREE.BufferGeometry {
  const coverShape = new THREE.Shape();
  coverShape.absarc(0, 0, rimR - 0.004, 0, Math.PI * 2, false);

  // 6 sculpted rounded-trapezoidal vent cutouts between the 6 wide silver spokes
  const count = 6;
  const rIn = 0.088;
  const rOut = rimR - 0.028;
  for (let i = 0; i < count; i++) {
    const baseA = (i / count) * Math.PI * 2;
    const halfSpanIn = 0.16;
    const halfSpanOut = 0.24;
    const hole = new THREE.Path();
    hole.moveTo(Math.cos(baseA - halfSpanIn) * rIn, Math.sin(baseA - halfSpanIn) * rIn);
    hole.lineTo(Math.cos(baseA - halfSpanOut) * rOut, Math.sin(baseA - halfSpanOut) * rOut);
    hole.absarc(0, 0, rOut, baseA - halfSpanOut, baseA + halfSpanOut, false);
    hole.lineTo(Math.cos(baseA + halfSpanIn) * rIn, Math.sin(baseA + halfSpanIn) * rIn);
    hole.absarc(0, 0, rIn, baseA + halfSpanIn, baseA - halfSpanIn, true);
    coverShape.holes.push(hole);
  }

  const geom = new THREE.ExtrudeGeometry(coverShape, {
    depth: 0.016,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.004,
    bevelSegments: 2,
    curveSegments: 20,
  });
  geom.translate(0, 0, -0.008);
  geom.rotateY(Math.PI * 0.5);
  return geom;
}

/**
 * Builds 4 high-profile 195/80R15 commercial tires with live-switchable
 * Cargo DX black perforated steel wheels (Photos 2–4) and Super GL 6-spoke
 * silver full wheel covers (Photo 1).
 */
export function buildHiAceWheels(materials: HiAceMaterialLibrary): HiAceWheelRig {
  const root = new THREE.Group();
  root.name = 'WheelAssemblies';

  const geometries: THREE.BufferGeometry[] = [];
  const trackGeom = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };

  const R = HIACE_DIMENSIONS.wheelRadius; // 0.346m
  const rimR = 0.204; // 15" steel/cover rim radius
  const halfW = HIACE_DIMENSIONS.tireWidth * 0.5; // 0.0975m

  // 1. Contoured High-Profile Commercial Tire Tread & Sidewalls
  const treadPoints: THREE.Vector2[] = [
    new THREE.Vector2(R - 0.028, -halfW * 0.98),
    new THREE.Vector2(R - 0.008, -halfW * 0.88),
    new THREE.Vector2(R - 0.001, -halfW * 0.66),
    new THREE.Vector2(R + 0.002, 0),
    new THREE.Vector2(R - 0.001, halfW * 0.66),
    new THREE.Vector2(R - 0.008, halfW * 0.88),
    new THREE.Vector2(R - 0.028, halfW * 0.98),
  ];
  const treadGeom = trackGeom(new THREE.LatheGeometry(treadPoints, 40));
  treadGeom.rotateZ(Math.PI * 0.5);

  const sidewallPosGeom = trackGeom(createSidewallRingGeometry(rimR - 0.003, R - 0.024, 0.016, 1));
  const sidewallNegGeom = trackGeom(createSidewallRingGeometry(rimR - 0.003, R - 0.024, 0.016, -1));

  // 2. Shared Stamped Black Steel Rim Barrel & Outer Bead Lip
  const barrelPoints: THREE.Vector2[] = [
    new THREE.Vector2(rimR - 0.036, -halfW * 0.88),
    new THREE.Vector2(rimR - 0.003, -halfW * 0.88),
    new THREE.Vector2(rimR - 0.016, -halfW * 0.68),
    new THREE.Vector2(rimR - 0.026, halfW * 0.58),
    new THREE.Vector2(rimR - 0.005, halfW * 0.84),
    new THREE.Vector2(rimR - 0.028, halfW * 0.84),
  ];
  const barrelGeom = trackGeom(new THREE.LatheGeometry(barrelPoints, 36));
  barrelGeom.rotateZ(-Math.PI * 0.5);

  const steelLipGeom = trackGeom(new THREE.TorusGeometry(rimR - 0.005, 0.01, 10, 36));
  steelLipGeom.rotateY(Math.PI * 0.5);

  // 3. Cargo DX Perforated Steel Disc + Metallic Silver Center Hub Cone + 6 Lug Nuts
  const steelDiscGeom = trackGeom(createPerforatedSteelDiscGeometry(rimR));
  const steelHubConeGeom = trackGeom(new THREE.CylinderGeometry(0.036, 0.048, 0.044, 24));
  steelHubConeGeom.rotateZ(-Math.PI * 0.5);
  const steelHubCapGeom = trackGeom(new THREE.CylinderGeometry(0.032, 0.035, 0.014, 20));
  steelHubCapGeom.rotateZ(-Math.PI * 0.5);
  const lugGeom = trackGeom(new THREE.CylinderGeometry(0.0095, 0.0105, 0.024, 6));
  lugGeom.rotateZ(-Math.PI * 0.5);

  // 4. Super GL 15" 6-Spoke Silver Full Wheel Cover + Central Cap Ring (Photo 1)
  const wheelCoverGeom = trackGeom(createSuperGlWheelCoverGeometry(rimR));
  const coverCenterBossGeom = trackGeom(new THREE.CylinderGeometry(0.056, 0.068, 0.018, 24));
  coverCenterBossGeom.rotateZ(-Math.PI * 0.5);
  const coverEmblemRingGeom = trackGeom(new THREE.TorusGeometry(0.024, 0.0032, 8, 22));
  coverEmblemRingGeom.rotateY(Math.PI * 0.5);

  // 5. Valve stem + Brake rotor + Brake caliper
  const valveGeom = trackGeom(new THREE.CylinderGeometry(0.004, 0.005, 0.024, 8));
  const discGeom = trackGeom(new THREE.CylinderGeometry(0.152, 0.152, 0.024, 28));
  discGeom.rotateZ(Math.PI * 0.5);
  const discHatGeom = trackGeom(new THREE.CylinderGeometry(0.082, 0.088, 0.044, 20));
  discHatGeom.rotateZ(Math.PI * 0.5);
  const caliperGeom = trackGeom(new THREE.BoxGeometry(0.056, 0.125, 0.072));

  const wheelSpinners: THREE.Group[] = [];
  const steelGroups: THREE.Group[] = [];
  const coverGroups: THREE.Group[] = [];
  const frontLeftSteer = new THREE.Group();
  const frontRightSteer = new THREE.Group();

  interface WheelMount {
    name: string;
    x: number;
    z: number;
    sideSign: 1 | -1;
    isFront: boolean;
    steerGroup?: THREE.Group;
  }

  const mounts: WheelMount[] = [
    {
      name: 'Wheel_FL',
      x: HIACE_DIMENSIONS.trackHalfWidth,
      z: HIACE_DIMENSIONS.frontAxleZ,
      sideSign: 1,
      isFront: true,
      steerGroup: frontLeftSteer,
    },
    {
      name: 'Wheel_FR',
      x: -HIACE_DIMENSIONS.trackHalfWidth,
      z: HIACE_DIMENSIONS.frontAxleZ,
      sideSign: -1,
      isFront: true,
      steerGroup: frontRightSteer,
    },
    {
      name: 'Wheel_RL',
      x: HIACE_DIMENSIONS.trackHalfWidth,
      z: HIACE_DIMENSIONS.rearAxleZ,
      sideSign: 1,
      isFront: false,
    },
    {
      name: 'Wheel_RR',
      x: -HIACE_DIMENSIONS.trackHalfWidth,
      z: HIACE_DIMENSIONS.rearAxleZ,
      sideSign: -1,
      isFront: false,
    },
  ];

  const lugDummy = new THREE.Object3D();

  for (const m of mounts) {
    const mountGroup = m.steerGroup ?? new THREE.Group();
    mountGroup.name = m.name;
    mountGroup.position.set(m.x, R, m.z);

    const caliper = new THREE.Mesh(caliperGeom, materials.brakeCaliper);
    caliper.position.set(-m.sideSign * 0.018, 0.022, m.isFront ? -0.118 : 0.115);
    mountGroup.add(caliper);

    const spinner = new THREE.Group();
    spinner.name = `${m.name}_Spin`;

    // Tire tread + embossed sidewalls
    const tread = new THREE.Mesh(treadGeom, materials.rubberTire);
    tread.castShadow = true;
    tread.receiveShadow = true;
    spinner.add(tread);

    const swPos = new THREE.Mesh(sidewallPosGeom, materials.rubberSidewall);
    swPos.position.x = halfW * 0.94;
    swPos.castShadow = true;
    swPos.receiveShadow = true;
    spinner.add(swPos);

    const swNeg = new THREE.Mesh(sidewallNegGeom, materials.rubberSidewall);
    swNeg.position.x = -halfW * 0.94;
    swNeg.castShadow = true;
    swNeg.receiveShadow = true;
    spinner.add(swNeg);

    // Base black commercial steel barrel & lip (present on both trims)
    const barrel = new THREE.Mesh(barrelGeom, materials.steelWheelBlack);
    if (m.sideSign < 0) barrel.scale.x = -1;
    spinner.add(barrel);

    const lip = new THREE.Mesh(steelLipGeom, materials.steelWheelBlack);
    lip.position.x = m.sideSign * (halfW * 0.85);
    spinner.add(lip);

    // Valve stem
    const valve = new THREE.Mesh(valveGeom, materials.matteBlackTrim);
    valve.position.set(m.sideSign * (halfW * 0.8), rimR - 0.024, 0);
    spinner.add(valve);

    // Brake rotor & hub backing visible through steel holes & wheel-cover cutouts
    const disc = new THREE.Mesh(discGeom, materials.brakeDisc);
    disc.position.x = -m.sideSign * 0.022;
    spinner.add(disc);

    const discHat = new THREE.Mesh(discHatGeom, materials.steelWheelBlack);
    discHat.position.x = -m.sideSign * 0.004;
    spinner.add(discHat);

    // --- TRIM A: CARGO DX 15" PERFORATED BLACK STEEL WHEEL (Photos 2, 3, 4) ---
    const steelFace = new THREE.Group();
    steelFace.name = `${m.name}_CargoSteel`;

    const steelDisc = new THREE.Mesh(steelDiscGeom, materials.steelWheelBlack);
    steelDisc.position.x = m.sideSign * (halfW * 0.54);
    steelFace.add(steelDisc);

    // Exposed silver center hub cone & cap
    const hubCone = new THREE.Mesh(steelHubConeGeom, materials.steelHubSilver);
    hubCone.position.x = m.sideSign * (halfW * 0.64);
    if (m.sideSign < 0) hubCone.scale.x = -1;
    steelFace.add(hubCone);

    const hubCap = new THREE.Mesh(steelHubCapGeom, materials.steelHubSilver);
    hubCap.position.x = m.sideSign * (halfW * 0.84);
    if (m.sideSign < 0) hubCap.scale.x = -1;
    steelFace.add(hubCap);

    // 6 instanced chrome commercial lug nuts surrounding silver hub
    const lugInstanced = new THREE.InstancedMesh(lugGeom, materials.chrome, 6);
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + Math.PI / 6;
      const lugR = 0.068;
      lugDummy.position.set(
        m.sideSign * (halfW * 0.68),
        Math.cos(angle) * lugR,
        Math.sin(angle) * lugR,
      );
      lugDummy.rotation.set(0, m.sideSign < 0 ? Math.PI : 0, 0);
      lugDummy.updateMatrix();
      lugInstanced.setMatrixAt(i, lugDummy.matrix);
    }
    lugInstanced.instanceMatrix.needsUpdate = true;
    lugInstanced.computeBoundingSphere();
    steelFace.add(lugInstanced);

    spinner.add(steelFace);
    steelGroups.push(steelFace);

    // --- TRIM B: SUPER GL 15" 6-SPOKE SILVER OEM WHEEL COVER (Photo 1) ---
    const coverFace = new THREE.Group();
    coverFace.name = `${m.name}_SuperGLCover`;
    coverFace.visible = false;

    const coverMesh = new THREE.Mesh(wheelCoverGeom, materials.wheelCoverSilver);
    coverMesh.position.x = m.sideSign * (halfW * 0.78);
    coverFace.add(coverMesh);

    const boss = new THREE.Mesh(coverCenterBossGeom, materials.wheelCoverSilver);
    boss.position.x = m.sideSign * (halfW * 0.86);
    if (m.sideSign < 0) boss.scale.x = -1;
    coverFace.add(boss);

    const emblemRing = new THREE.Mesh(coverEmblemRingGeom, materials.chrome);
    emblemRing.position.x = m.sideSign * (halfW * 0.96);
    coverFace.add(emblemRing);

    spinner.add(coverFace);
    coverGroups.push(coverFace);

    mountGroup.add(spinner);
    wheelSpinners.push(spinner);
    root.add(mountGroup);
  }

  const setTrimSpec = (trim: TrimSpec) => {
    const isCargo = trim === 'cargo-dx';
    for (let i = 0; i < steelGroups.length; i++) {
      steelGroups[i].visible = isCargo;
      coverGroups[i].visible = !isCargo;
    }
  };

  return {
    group: root,
    frontLeftSteer,
    frontRightSteer,
    wheelSpinners,
    setTrimSpec,
    dispose: () => {
      geometries.forEach((g) => g.dispose());
    },
  };
}
