import * as THREE from 'three';
import { HIACE_DIMENSIONS, HIACE_PAINTS, HiAceSceneState } from '../types/hiace';
import { createHiAceMaterials, HiAceMaterialLibrary } from './materials';
import { ProceduralTextureSet } from './textures';
import { buildHiAceBodyShell } from './geometry/bodyShell';
import { buildHiAceExteriorDetails } from './geometry/exteriorDetails';
import { buildHiAceWheels } from './geometry/wheels';

export interface HiAceModelController {
  root: THREE.Group;
  materials: HiAceMaterialLibrary;
  interactiveTargets: THREE.Object3D[];
  applyStateImmediate: (state: HiAceSceneState) => void;
  update: (dt: number, state: HiAceSceneState) => boolean; // returns true if still animating
  dispose: () => void;
}

// Pre-allocated scratch vectors for strut orientation (zero per-frame allocations)
const _strutStart = new THREE.Vector3();
const _strutEnd = new THREE.Vector3();
const _strutMid = new THREE.Vector3();
const _strutDir = new THREE.Vector3();
const _upAxis = new THREE.Vector3(0, 1, 0);

/**
 * Assembles the complete Toyota HiAce H200 composite model pivoted at ground-center (0, 0, 0)
 * with smooth exponential-damped kinematics for sliding door, tailgate, gas struts, lights,
 * and subtle wheel rolling / steering.
 */
export function buildToyotaHiAceModel(
  textures: ProceduralTextureSet,
  isSoftwareGl: boolean,
): HiAceModelController {
  const root = new THREE.Group();
  root.name = 'ToyotaHiAceH200';

  const materials = createHiAceMaterials(textures, isSoftwareGl);
  const body = buildHiAceBodyShell(materials);
  const exterior = buildHiAceExteriorDetails(materials);
  const wheels = buildHiAceWheels(materials);

  root.add(body.group);
  root.add(exterior.group);
  root.add(wheels.group);

  // Soft radial/elliptical ambient contact shadow pinned cleanly just above floor (y = 0.004)
  const shadowPlaneGeom = new THREE.PlaneGeometry(2.55, 5.55);
  shadowPlaneGeom.rotateX(-Math.PI * 0.5);
  const shadowPlaneMat = new THREE.MeshBasicMaterial({
    map: textures.contactShadow,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
  });
  const contactShadowMesh = new THREE.Mesh(shadowPlaneGeom, shadowPlaneMat);
  contactShadowMesh.position.set(0, 0.004, -0.02);
  contactShadowMesh.renderOrder = 1;
  root.add(contactShadowMesh);

  // Subtle architectural CAD dimension guide lines (toggled via showDimensions)
  const dimensionGroup = buildDimensionGuides();
  dimensionGroup.visible = false;
  root.add(dimensionGroup);

  const allEdgeOverlays = [...body.edgeOverlays, ...exterior.edgeOverlays];

  // Damped animation state variables
  let doorProgress = 0; // 0 = closed, 1 = open
  let tailgateProgress = 0; // 0 = closed, 1 = lifted
  let lightsProgress = 0; // 0 = off, 1 = on
  let steerProgress = 0; // 0 = straight ahead, 1 = angled showroom stance
  let appliedPaintId = '';
  let appliedTrimSpec = '';
  let appliedRenderStyle = '';

  const updateGasStrut = (
    strut: THREE.Mesh,
    sideSign: 1 | -1,
    tailgateAngle: number,
  ) => {
    if (tailgateAngle < 0.05) {
      strut.visible = false;
      return;
    }
    strut.visible = true;

    // Anchor on body D-pillar frame
    _strutStart.set(sideSign * 0.67, 1.32, -2.18);

    // Anchor on tailgate inner edge rotated around tailgatePivot (0, 1.905, -2.212)
    const localY = -0.34;
    const localZ = -0.05;
    const cosA = Math.cos(tailgateAngle);
    const sinA = Math.sin(tailgateAngle);
    const rotY = localY * cosA - localZ * sinA;
    const rotZ = localY * sinA + localZ * cosA;
    _strutEnd.set(sideSign * 0.65, 1.905 + rotY, -2.212 + rotZ);

    _strutMid.addVectors(_strutStart, _strutEnd).multiplyScalar(0.5);
    _strutDir.subVectors(_strutEnd, _strutStart);
    const len = _strutDir.length();
    _strutDir.normalize();

    strut.position.copy(_strutMid);
    strut.scale.set(1, len, 1);
    strut.quaternion.setFromUnitVectors(_upAxis, _strutDir);
  };

  const applyKinematicPose = () => {
    // Authentic H200 sliding-door kinematic trajectory:
    // First 25% of travel swings door cleanly outward along +X,
    // remaining 75% slides smoothly rearward along the exposed track!
    const popOutT = THREE.MathUtils.smoothstep(doorProgress, 0, 0.28);
    const slideBackT = THREE.MathUtils.smoothstep(doorProgress, 0.16, 1.0);
    exterior.slidingDoorGroup.position.set(popOutT * 0.135, 0, -slideBackT * 1.06);

    // Rear tailgate lifts smoothly around roof hinge axis (+rotation.x lifts bottom backward & upward)
    const liftAngle = tailgateProgress * 1.46;
    exterior.tailgatePivot.rotation.x = liftAngle;

    updateGasStrut(exterior.tailgateStruts.left, 1, liftAngle);
    updateGasStrut(exterior.tailgateStruts.right, -1, liftAngle);

    // Subtle Ackermann showroom front-wheel stance turning front-left rim face toward the 3/4 hero camera
    wheels.frontLeftSteer.rotation.y = -0.23 * steerProgress;
    wheels.frontRightSteer.rotation.y = -0.205 * steerProgress;

    materials.setLightsIntensity(lightsProgress);
  };

  const syncStaticProperties = (state: HiAceSceneState) => {
    if (state.paintId !== appliedPaintId) {
      const paint = HIACE_PAINTS.find((p) => p.id === state.paintId) ?? HIACE_PAINTS[0];
      materials.applyPaint(paint);
      appliedPaintId = state.paintId;
    }

    if (state.trimSpec !== appliedTrimSpec) {
      materials.applyTrimSpec(state.trimSpec);
      wheels.setTrimSpec(state.trimSpec);
      exterior.setTrimSpec(state.trimSpec);
      appliedTrimSpec = state.trimSpec;
    }

    if (state.renderStyle !== appliedRenderStyle) {
      materials.applyRenderStyle(state.renderStyle);
      exterior.setRenderStyle(state.renderStyle);
      const showEdges = state.renderStyle === 'wireframe';
      for (let i = 0; i < allEdgeOverlays.length; i++) {
        allEdgeOverlays[i].visible = showEdges;
      }
      appliedRenderStyle = state.renderStyle;
    }

    dimensionGroup.visible = state.showDimensions;
    shadowPlaneMat.opacity = state.studioEnv === 'daylight' ? 0.54 : 0.68;
  };

  const applyStateImmediate = (state: HiAceSceneState) => {
    doorProgress = state.slidingDoorOpen ? 1 : 0;
    tailgateProgress = state.tailgateOpen ? 1 : 0;
    lightsProgress = state.lightsOn ? 1 : 0;
    steerProgress = state.wheelSteerAngled ? 1 : 0;
    syncStaticProperties(state);
    applyKinematicPose();
  };

  const update = (dt: number, state: HiAceSceneState): boolean => {
    syncStaticProperties(state);

    const safeDt = Math.min(dt, 0.08);
    const doorTarget = state.slidingDoorOpen ? 1 : 0;
    const tailgateTarget = state.tailgateOpen ? 1 : 0;
    const lightsTarget = state.lightsOn ? 1 : 0;
    const steerTarget = state.wheelSteerAngled ? 1 : 0;

    if (isSoftwareGl) {
      // Settle rapidly on software WebGL to minimize redundant frames
      doorProgress = doorTarget;
      tailgateProgress = tailgateTarget;
      lightsProgress = lightsTarget;
      steerProgress = steerTarget;
      applyKinematicPose();
      return false;
    }

    doorProgress = THREE.MathUtils.damp(doorProgress, doorTarget, 6.5, safeDt);
    tailgateProgress = THREE.MathUtils.damp(tailgateProgress, tailgateTarget, 5.8, safeDt);
    lightsProgress = THREE.MathUtils.damp(lightsProgress, lightsTarget, 9.0, safeDt);
    steerProgress = THREE.MathUtils.damp(steerProgress, steerTarget, 7.5, safeDt);

    let animating = false;
    if (Math.abs(doorProgress - doorTarget) > 0.001) {
      animating = true;
    } else {
      doorProgress = doorTarget;
    }

    if (Math.abs(tailgateProgress - tailgateTarget) > 0.001) {
      animating = true;
    } else {
      tailgateProgress = tailgateTarget;
    }

    if (Math.abs(lightsProgress - lightsTarget) > 0.002) {
      animating = true;
    } else {
      lightsProgress = lightsTarget;
    }

    if (Math.abs(steerProgress - steerTarget) > 0.001) {
      animating = true;
    } else {
      steerProgress = steerTarget;
    }

    applyKinematicPose();
    return animating;
  };

  return {
    root,
    materials,
    interactiveTargets: exterior.interactiveTargets,
    applyStateImmediate,
    update,
    dispose: () => {
      body.dispose();
      exterior.dispose();
      wheels.dispose();
      shadowPlaneGeom.dispose();
      shadowPlaneMat.dispose();
      dimensionGroup.traverse((child) => {
        if (child instanceof THREE.LineSegments || child instanceof THREE.Line) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      materials.dispose();
    },
  };
}

/**
 * Builds crisp 3D CAD dimension witness lines around the exact bounding envelope
 * (4,695mm length, 1,695mm width, 1,980mm height, 2,570mm wheelbase).
 */
function buildDimensionGuides(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'DimensionGuides';

  const lineMat = new THREE.LineBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.78,
  });

  const pts: number[] = [];
  const seg = (x1: number, y1: number, z1: number, x2: number, y2: number, z2: number) => {
    pts.push(x1, y1, z1, x2, y2, z2);
  };

  const yFloor = 0.025;
  const halfLen = 2.348;
  const halfW = 0.848;
  const h = 1.98;

  // Overall Length line along +X side (+1.22m offset)
  seg(1.22, yFloor, -halfLen, 1.22, yFloor, halfLen);
  seg(1.12, yFloor, -halfLen, 1.28, yFloor, -halfLen);
  seg(1.12, yFloor, halfLen, 1.28, yFloor, halfLen);

  // Wheelbase witness line on +X side (+1.02m offset)
  const frontZ = HIACE_DIMENSIONS.frontAxleZ;
  const rearZ = HIACE_DIMENSIONS.rearAxleZ;
  seg(1.02, yFloor, rearZ, 1.02, yFloor, frontZ);
  seg(0.95, yFloor, rearZ, 1.07, yFloor, rearZ);
  seg(0.95, yFloor, frontZ, 1.07, yFloor, frontZ);

  // Overall Width line ahead of front bumper (+2.68m Z)
  seg(-halfW, yFloor, 2.68, halfW, yFloor, 2.68);
  seg(-halfW, yFloor, 2.58, -halfW, yFloor, 2.74);
  seg(halfW, yFloor, 2.58, halfW, yFloor, 2.74);

  // Overall Height vertical witness line behind rear corner
  seg(1.06, 0, -2.35, 1.06, h, -2.35);
  seg(0.98, 0, -2.35, 1.12, 0, -2.35);
  seg(0.98, h, -2.35, 1.12, h, -2.35);

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  g.add(new THREE.LineSegments(geom, lineMat));

  return g;
}
