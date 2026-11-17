import { useMemo, useRef } from "react";
import type { ReactNode } from "react";
import { ExtrudeGeometry, Shape, Vector3 } from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  ContactShadows,
  Environment,
  Lightformer,
} from "@react-three/drei";

type View = "front" | "rear" | "left" | "right";

interface Vehicle3DViewerProps {
  height?: string;
  modelScale?: number;
}

const BODY = "#f8faf9";
const BODY_LOW = "#e3e7e8";
const GLASS = "#22343e";
const GLASS_LIGHT = "#3e5a68";
const FRAME = "#111417";
const TRIM = "#1b1f24";
const CHROME = "#b9c0c6";
const BUMPER = "#2a2e33";
const TIRE = "#141618";
const RIM = "#c9d0d4";
const HUB = "#e2e7e9";
const HEAD = "#eef4f2";
const RED = "#bd2e2a";
const AMBER = "#e3a12a";

const SIDE = 0.94;

/**
 * Local rounded-box geometry builder.
 * Kept in-house (instead of drei's RoundedBox) so the app does not pull the
 * whole three-stdlib barrel into the bundle.
 */
const geometryCache = new Map<string, ExtrudeGeometry>();

function buildRoundedBox(width: number, height: number, depth: number, radius: number, segments: number) {
  const key = `${width}|${height}|${depth}|${radius}|${segments}`;
  const cached = geometryCache.get(key);
  if (cached) return cached;

  const eps = 0.00001;
  const rad = Math.min(radius, width / 2, height / 2, depth / 2) - eps;
  const shape = new Shape();
  shape.absarc(eps, eps, eps, -Math.PI / 2, -Math.PI, true);
  shape.absarc(eps, height - rad * 2, eps, Math.PI, Math.PI / 2, true);
  shape.absarc(width - rad * 2, height - rad * 2, eps, Math.PI / 2, 0, true);
  shape.absarc(width - rad * 2, eps, eps, 0, -Math.PI / 2, true);

  const geometry = new ExtrudeGeometry(shape, {
    depth: depth - rad * 2,
    bevelEnabled: true,
    bevelSegments: Math.max(2, Math.round(segments / 2)),
    steps: 1,
    bevelSize: rad,
    bevelThickness: rad,
    curveSegments: segments,
  });
  geometry.center();
  geometryCache.set(key, geometry);
  return geometry;
}

function RoundedBox({
  args,
  radius = 0.08,
  smoothness = 4,
  children,
  ...rest
}: {
  args: [number, number, number];
  radius?: number;
  smoothness?: number;
  children?: ReactNode;
  [key: string]: unknown;
}) {
  const geometry = useMemo(
    () => buildRoundedBox(args[0], args[1], args[2], radius, smoothness),
    [args, radius, smoothness],
  );

  return (
    <mesh geometry={geometry} {...(rest as Record<string, unknown>)}>
      {children}
    </mesh>
  );
}

const panelCache = new Map<string, ExtrudeGeometry>();

function buildPanel(points: Array<[number, number]>, depth: number) {
  const key = `${depth}|${points.map(([x, y]) => `${x},${y}`).join(";")}`;
  const cached = panelCache.get(key);
  if (cached) return cached;

  const shape = new Shape();
  shape.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) shape.lineTo(points[i][0], points[i][1]);
  shape.closePath();

  const geometry = new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.008,
    bevelThickness: 0.008,
    curveSegments: 8,
  });
  geometry.center();
  panelCache.set(key, geometry);
  return geometry;
}

function Panel({
  points,
  depth = 0.04,
  children,
  ...rest
}: {
  points: Array<[number, number]>;
  depth?: number;
  children?: ReactNode;
  [key: string]: unknown;
}) {
  const geometry = useMemo(() => buildPanel(points, depth), [points, depth]);
  return (
    <mesh geometry={geometry} {...(rest as Record<string, unknown>)}>
      {children}
    </mesh>
  );
}

const lowerBodyGeometry = (() => {
  const shape = new Shape();
  const floor = -0.46;
  const top = 0.46;
  const halfLength = 2.675;
  const archRadius = 0.44;
  const archY = -0.65;
  const dy = floor - archY;
  const dx = Math.sqrt(archRadius * archRadius - dy * dy);
  const startAngle = Math.atan2(dy, -dx);
  const endAngle = Math.atan2(dy, dx);

  shape.moveTo(halfLength, floor);
  shape.lineTo(halfLength, top - 0.04);
  shape.quadraticCurveTo(halfLength, top, halfLength - 0.04, top);
  shape.lineTo(-halfLength + 0.04, top);
  shape.quadraticCurveTo(-halfLength, top, -halfLength, top - 0.04);
  shape.lineTo(-halfLength, floor + 0.04);
  shape.quadraticCurveTo(-halfLength, floor, -halfLength + 0.04, floor);
  shape.lineTo(-1.82 - dx, floor);
  shape.absarc(-1.82, archY, archRadius, startAngle, endAngle, true);
  shape.lineTo(1.82 - dx, floor);
  shape.absarc(1.82, archY, archRadius, startAngle, endAngle, true);
  shape.lineTo(halfLength, floor);

  const geometry = new ExtrudeGeometry(shape, {
    depth: 1.8,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: 0.02,
    bevelThickness: 0.03,
    curveSegments: 24,
    steps: 1,
  });
  geometry.center();
  return geometry;
})();

function LowerBody() {
  return (
    <mesh geometry={lowerBodyGeometry} position={[0, 1.02, 0]} rotation={[0, -Math.PI / 2, 0]}>
      <meshStandardMaterial color={BODY} roughness={0.44} metalness={0.06} />
    </mesh>
  );
}

function Wheel({ side, z }: { side: 1 | -1; z: number }) {
  return (
    <group position={[side * 0.8, 0.37, z]}>
      <group rotation={[0, side === 1 ? 0 : Math.PI, 0]}>
        {/* Tyre */}
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.255, 0.11, 14, 32]} />
          <meshStandardMaterial color={TIRE} roughness={0.88} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.335, 0.335, 0.2, 32]} />
          <meshStandardMaterial color={TIRE} roughness={0.92} />
        </mesh>

        {/* Brake disc */}
        <mesh position={[-0.03, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.2, 0.2, 0.2, 24]} />
          <meshStandardMaterial color="#5b6169" roughness={0.5} />
        </mesh>

        {/* Silver steel/alloy rim */}
        <mesh position={[0.055, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.235, 0.235, 0.06, 28]} />
          <meshStandardMaterial color={RIM} roughness={0.3} metalness={0.68} />
        </mesh>
        <mesh position={[0.065, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.225, 0.018, 8, 28]} />
          <meshStandardMaterial color="#9aa2a8" roughness={0.32} metalness={0.55} />
        </mesh>

        {/* Rim vent holes */}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const angle = (i * Math.PI) / 3;
          return (
            <mesh
              key={i}
              position={[0.09, Math.sin(angle) * 0.12, Math.cos(angle) * 0.12]}
              rotation={[0, Math.PI / 2, 0]}
            >
              <circleGeometry args={[0.042, 16]} />
              <meshStandardMaterial color="#0c0e10" roughness={0.8} side={2} />
            </mesh>
          );
        })}

        {/* Centre cap and lug nuts */}
        <mesh position={[0.095, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.055, 0.055, 0.04, 20]} />
          <meshStandardMaterial color={HUB} roughness={0.22} metalness={0.62} />
        </mesh>
        {[0, 1, 2, 3, 4].map((i) => {
          const angle = (i * Math.PI * 2) / 5;
          return (
            <mesh
              key={i}
              position={[0.105, Math.sin(angle) * 0.085, Math.cos(angle) * 0.085]}
              rotation={[0, 0, Math.PI / 2]}
            >
              <cylinderGeometry args={[0.012, 0.012, 0.02, 8]} />
              <meshStandardMaterial color="#b3b9be" roughness={0.35} metalness={0.5} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

function CommuterVan({ scale }: { scale: number }) {
  return (
    <group scale={scale} position={[0, 0, 0]}>
      {/* ---------- Main volumes: boxy H200 high-roof shell ---------- */}
      {/* Lower body shell with real wheel-arch cut-outs */}
      <LowerBody />

      {/* Upright greenhouse / passenger cabin */}
      <RoundedBox args={[1.84, 0.78, 5.05]} radius={0.1} smoothness={4} position={[0, 1.78, -0.1]}>
        <meshStandardMaterial color={BODY} roughness={0.44} metalness={0.06} />
      </RoundedBox>

      {/* Flat high roof */}
      <RoundedBox args={[1.78, 0.1, 4.9]} radius={0.05} smoothness={3} position={[0, 2.16, -0.1]}>
        <meshStandardMaterial color={BODY} roughness={0.48} metalness={0.04} />
      </RoundedBox>

      {/* Undercarriage */}
      <mesh position={[0, 0.52, -0.05]}>
        <boxGeometry args={[1.72, 0.08, 5.0]} />
        <meshStandardMaterial color="#34393f" roughness={0.9} />
      </mesh>

      {/* ---------- Front: short, nearly flat H200 cab-over face ---------- */}
      {/* Flat front fascia with softer H200 corners */}
      <RoundedBox args={[1.86, 0.88, 0.22]} radius={0.14} smoothness={4} position={[0, 1.03, 2.7]}>
        <meshStandardMaterial color={BODY} roughness={0.44} metalness={0.06} />
      </RoundedBox>

      {/* Black windshield surround */}
      <Panel
        points={[
          [-0.86, -0.36],
          [0.86, -0.36],
          [0.79, 0.36],
          [-0.79, 0.36],
        ]}
        depth={0.04}
        position={[0, 1.74, 2.5]}
        rotation={[-0.1, 0, 0]}
      >
        <meshStandardMaterial color={FRAME} roughness={0.55} />
      </Panel>

      {/* Trapezoidal near-vertical H200 windshield */}
      <Panel
        points={[
          [-0.8, -0.31],
          [0.8, -0.31],
          [0.72, 0.31],
          [-0.72, 0.31],
        ]}
        depth={0.05}
        position={[0, 1.74, 2.535]}
        rotation={[-0.1, 0, 0]}
      >
        <meshStandardMaterial color={GLASS} roughness={0.12} metalness={0.3} />
      </Panel>

      {/* Windshield sky reflection */}
      <mesh position={[0, 1.93, 2.566]} rotation={[-0.1, 0, 0]}>
        <boxGeometry args={[1.32, 0.16, 0.012]} />
        <meshStandardMaterial
          color={GLASS_LIGHT}
          transparent
          opacity={0.22}
          roughness={0.1}
          metalness={0.2}
        />
      </mesh>

      {/* Heavy A-pillars */}
      {[-0.83, 0.83].map((x, i) => (
        <RoundedBox
          key={i}
          args={[0.075, 0.7, 0.07]}
          radius={0.02}
          smoothness={3}
          position={[x, 1.74, 2.54]}
          rotation={[-0.1, 0, 0]}
        >
          <meshStandardMaterial color={FRAME} roughness={0.55} />
        </RoundedBox>
      ))}

      {/* White roof header above the screen */}
      <mesh position={[0, 2.1, 2.48]}>
        <boxGeometry args={[1.58, 0.1, 0.1]} />
        <meshStandardMaterial color={BODY} roughness={0.44} metalness={0.06} />
      </mesh>

      {/* Windscreen cowl */}
      <mesh position={[0, 1.41, 2.59]}>
        <boxGeometry args={[1.7, 0.07, 0.12]} />
        <meshStandardMaterial color={FRAME} roughness={0.7} />
      </mesh>

      {/* Wiper blades: parked along the cowl */}
      {[-0.34, 0.32].map((x, i) => (
        <mesh key={i} position={[x, 1.455, 2.58]} rotation={[0, 0, i === 0 ? 0.1 : -0.1]}>
          <boxGeometry args={[0.4, 0.016, 0.016]} />
          <meshStandardMaterial color="#2a3036" roughness={0.85} />
        </mesh>
      ))}

      {/* Wide black grille surround */}
      <mesh position={[0, 1.16, 2.815]}>
        <boxGeometry args={[1.04, 0.28, 0.06]} />
        <meshStandardMaterial color="#0b0d0f" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.16, 2.835]}>
        <boxGeometry args={[0.92, 0.2, 0.04]} />
        <meshStandardMaterial color="#15181b" roughness={0.65} />
      </mesh>
      {[1.1, 1.16, 1.22].map((y, i) => (
        <mesh key={i} position={[0, y, 2.858]}>
          <boxGeometry args={[0.82, 0.013, 0.018]} />
          <meshStandardMaterial color="#3c434a" roughness={0.5} />
        </mesh>
      ))}
      {/* Chrome grille lip */}
      <mesh position={[0, 1.305, 2.872]}>
        <boxGeometry args={[0.9, 0.022, 0.03]} />
        <meshStandardMaterial color={CHROME} roughness={0.28} metalness={0.4} />
      </mesh>

      {/* Central badge on the grille */}
      <mesh position={[0, 1.16, 2.868]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.052, 0.052, 0.018, 24]} />
        <meshStandardMaterial color="#d3d9dd" roughness={0.2} metalness={0.55} />
      </mesh>

      {/* Rectangular H200 headlight assemblies */}
      {[-0.7, 0.7].map((x, i) => (
        <group key={i}>
          {/* Dark housing makes the lamp read against the white face */}
          <RoundedBox
            args={[0.44, 0.3, 0.08]}
            radius={0.04}
            smoothness={3}
            position={[x, 1.17, 2.79]}
            rotation={[0, i === 0 ? 0.1 : -0.1, 0]}
          >
            <meshStandardMaterial color={FRAME} roughness={0.55} />
          </RoundedBox>
          {/* Clear lens, nearly flush with the fascia */}
          <RoundedBox
            args={[0.38, 0.23, 0.05]}
            radius={0.03}
            smoothness={3}
            position={[x, 1.17, 2.833]}
            rotation={[0, i === 0 ? 0.1 : -0.1, 0]}
          >
            <meshStandardMaterial
              color="#c9d5da"
              emissive="#eef4f4"
              emissiveIntensity={0.12}
              roughness={0.22}
              metalness={0.08}
            />
          </RoundedBox>
          {/* Twin projector lamps */}
          {[-0.075, 0.075].map((dx, j) => (
            <group key={j} position={[x + dx, 1.17, 2.868]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.055, 0.055, 0.02, 20]} />
                <meshStandardMaterial color="#9aa4ab" roughness={0.2} metalness={0.4} />
              </mesh>
              <mesh position={[0, 0, 0.012]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.038, 0.038, 0.015, 18]} />
                <meshStandardMaterial color="#2c343a" roughness={0.35} metalness={0.24} />
              </mesh>
            </group>
          ))}
          {/* Projector lamp */}
          <mesh position={[x + (i === 0 ? -0.07 : 0.07), 1.17, 2.86]}>
            <cylinderGeometry args={[0.06, 0.06, 0.02, 20]} />
            <meshStandardMaterial color="#e8eef0" roughness={0.15} metalness={0.4} />
          </mesh>
          {/* Slim amber outer corner */}
          <mesh position={[i === 0 ? x - 0.2 : x + 0.2, 1.17, 2.862]}>
            <boxGeometry args={[0.05, 0.15, 0.02]} />
            <meshStandardMaterial color={AMBER} emissive={AMBER} emissiveIntensity={0.35} roughness={0.35} />
          </mesh>
        </group>
      ))}

      {/* Front bumper: compact black H200 bumper */}
      <RoundedBox args={[1.84, 0.38, 0.24]} radius={0.09} smoothness={4} position={[0, 0.57, 2.78]}>
        <meshStandardMaterial color={BUMPER} roughness={0.65} />
      </RoundedBox>
      {/* Lower bumper lip */}
      <RoundedBox args={[1.72, 0.12, 0.2]} radius={0.05} smoothness={3} position={[0, 0.33, 2.8]}>
        <meshStandardMaterial color="#171a1d" roughness={0.8} />
      </RoundedBox>
      {/* Bumper intake */}
      <mesh position={[0, 0.7, 2.9]}>
        <boxGeometry args={[1.1, 0.1, 0.03]} />
        <meshStandardMaterial color="#0f1113" roughness={0.85} />
      </mesh>

      {/* Fog lights */}
      {[-0.72, 0.72].map((x, i) => (
        <group key={i}>
          <mesh position={[x, 0.48, 2.903]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.045, 0.045, 0.02, 18]} />
            <meshStandardMaterial color="#7d858c" roughness={0.4} metalness={0.3} />
          </mesh>
          <mesh position={[x, 0.48, 2.912]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.028, 0.028, 0.015, 16]} />
            <meshStandardMaterial color="#dfe5ea" roughness={0.25} metalness={0.2} />
          </mesh>
        </group>
      ))}

      {/* Front plate: white H200-style plate with a dark border */}
      <mesh position={[0, 0.52, 2.902]}>
        <boxGeometry args={[0.47, 0.16, 0.02]} />
        <meshStandardMaterial color="#1a1d20" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.52, 2.912]}>
        <boxGeometry args={[0.42, 0.115, 0.02]} />
        <meshStandardMaterial color="#eef1ee" roughness={0.55} />
      </mesh>

      {/* ---------- Rear: tall lamps, split twin doors ---------- */}
      <RoundedBox args={[1.86, 1.48, 0.2]} radius={0.08} smoothness={3} position={[0, 1.18, -2.7]}>
        <meshStandardMaterial color={BODY} roughness={0.46} metalness={0.05} />
      </RoundedBox>

      {/* Tailgate glass */}
      <mesh position={[0, 1.66, -2.815]}>
        <boxGeometry args={[1.5, 0.66, 0.03]} />
        <meshStandardMaterial color={FRAME} roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.66, -2.82]}>
        <boxGeometry args={[1.4, 0.56, 0.04]} />
        <meshStandardMaterial color={GLASS} roughness={0.12} metalness={0.3} />
      </mesh>
      {/* Twin-door window divider */}
      <mesh position={[0, 1.66, -2.845]}>
        <boxGeometry args={[0.05, 0.64, 0.02]} />
        <meshStandardMaterial color={FRAME} roughness={0.5} />
      </mesh>
      {/* Rear wiper */}
      <mesh position={[0.22, 1.45, -2.846]}>
        <boxGeometry args={[0.46, 0.018, 0.016]} />
        <meshStandardMaterial color="#252b30" roughness={0.85} />
      </mesh>

      {/* Twin-door centre seam, panel seam and handles */}
      <mesh position={[0, 1.12, -2.82]}>
        <boxGeometry args={[0.014, 1.18, 0.02]} />
        <meshStandardMaterial color="#aeb5bb" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.24, -2.806]}>
        <boxGeometry args={[1.66, 0.014, 0.02]} />
        <meshStandardMaterial color="#c3c9cf" roughness={0.7} />
      </mesh>
      {[-0.16, 0.16].map((x, i) => (
        <mesh key={i} position={[x, 1.18, -2.83]}>
          <boxGeometry args={[0.22, 0.045, 0.04]} />
          <meshStandardMaterial color={CHROME} roughness={0.35} metalness={0.4} />
        </mesh>
      ))}

      {/* Tall vertical tail lamps */}
      {[-0.8, 0.8].map((x, i) => (
        <group key={i}>
          <mesh position={[x, 1.22, -2.82]}>
            <boxGeometry args={[0.18, 0.62, 0.075]} />
            <meshStandardMaterial color={RED} emissive={RED} emissiveIntensity={0.16} roughness={0.35} />
          </mesh>
          <mesh position={[x, 1.48, -2.86]}>
            <boxGeometry args={[0.18, 0.11, 0.02]} />
            <meshStandardMaterial color={AMBER} roughness={0.35} />
          </mesh>
          <mesh position={[x, 1.0, -2.86]}>
            <boxGeometry args={[0.18, 0.14, 0.02]} />
            <meshStandardMaterial color="#dfe4e9" emissive="#dfe4e9" emissiveIntensity={0.15} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Rear bumper: black H200 bumper with body-colour lip */}
      <mesh position={[0, 0.82, -2.78]}>
        <boxGeometry args={[1.84, 0.08, 0.16]} />
        <meshStandardMaterial color={BODY} roughness={0.5} metalness={0.05} />
      </mesh>
      <RoundedBox args={[1.9, 0.44, 0.28]} radius={0.08} smoothness={4} position={[0, 0.56, -2.76]}>
        <meshStandardMaterial color={BUMPER} roughness={0.65} />
      </RoundedBox>
      <RoundedBox args={[1.8, 0.14, 0.2]} radius={0.05} smoothness={3} position={[0, 0.34, -2.82]}>
        <meshStandardMaterial color="#171a1d" roughness={0.8} />
      </RoundedBox>

      {/* Rear plate */}
      <mesh position={[0, 0.64, -2.91]}>
        <boxGeometry args={[0.42, 0.13, 0.025]} />
        <meshStandardMaterial color="#f2f4f1" roughness={0.6} />
      </mesh>

      {/* ---------- Sides: large segmented commuter windows ---------- */}
      {[1, -1].map((side) => (
        <group key={side}>
          {/* Full black window band */}
          <mesh position={[side * (SIDE - 0.002), 1.72, -0.28]}>
            <boxGeometry args={[0.03, 0.62, 4.45]} />
            <meshStandardMaterial color={FRAME} roughness={0.5} />
          </mesh>

          {/* Distinct tinted panes: front door, sliding door, rear quarter */}
          {[
            { z: 1.48, len: 0.92 },
            { z: 0.1, len: 1.65 },
            { z: -1.5, len: 1.72 },
          ].map((pane, i) => (
            <RoundedBox
              key={i}
              args={[0.02, 0.48, pane.len]}
              radius={0.01}
              smoothness={3}
              position={[side * (SIDE + 0.012), 1.72, pane.z]}
            >
              <meshStandardMaterial color={GLASS} roughness={0.08} metalness={0.35} />
            </RoundedBox>
          ))}

          {/* Pane sky reflections */}
          {[
            { z: 1.48, len: 0.92 },
            { z: 0.1, len: 1.65 },
            { z: -1.5, len: 1.72 },
          ].map((pane, i) => (
            <mesh key={i} position={[side * (SIDE + 0.024), 1.84, pane.z]}>
              <boxGeometry args={[0.012, 0.09, pane.len * 0.82]} />
              <meshStandardMaterial
                color={GLASS_LIGHT}
                transparent
                opacity={0.32}
                roughness={0.1}
                metalness={0.2}
              />
            </mesh>
          ))}

          {/* Quarter-glass and sliding-vent dividers */}
          {[1.8, 0.55].map((z, i) => (
            <mesh key={i} position={[side * (SIDE + 0.02), 1.72, z]}>
              <boxGeometry args={[0.025, 0.5, 0.045]} />
              <meshStandardMaterial color={FRAME} roughness={0.5} />
            </mesh>
          ))}

          {/* Thick B/C/D pillars */}
          {[1.95, 0.97, -0.68, -2.4].map((z, i) => (
            <mesh key={i} position={[side * (SIDE + 0.014), 1.72, z]}>
              <boxGeometry args={[0.025, 0.62, 0.085]} />
              <meshStandardMaterial color={FRAME} roughness={0.5} />
            </mesh>
          ))}

          {/* Belt line + shoulder crease */}
          <mesh position={[side * (SIDE + 0.002), 1.4, -0.1]}>
            <boxGeometry args={[0.025, 0.03, 4.8]} />
            <meshStandardMaterial color={CHROME} roughness={0.3} metalness={0.35} />
          </mesh>
          <mesh position={[side * (SIDE + 0.004), 1.04, -0.1]}>
            <boxGeometry args={[0.02, 0.025, 4.9]} />
            <meshStandardMaterial color={BODY_LOW} roughness={0.5} />
          </mesh>

          {/* Door lower seams: front door and sliding door */}
          {[
            { z: 1.17, len: 0.45 },
            { z: -0.235, len: 2.37 },
          ].map((seam, i) => (
            <mesh key={i} position={[side * (SIDE + 0.006), 0.66, seam.z]}>
              <boxGeometry args={[0.02, 0.014, seam.len]} />
              <meshStandardMaterial color="#c3c9cf" roughness={0.7} />
            </mesh>
          ))}

          {/* Door seams: front door, sliding door, rear twin door */}
          {[1.9, 0.95, -1.15, -2.22].map((z, i) => (
            <mesh key={i} position={[side * (SIDE + 0.006), 1.15, z]}>
              <boxGeometry args={[0.02, 0.58, 0.014]} />
              <meshStandardMaterial color="#c3c9cf" roughness={0.7} />
            </mesh>
          ))}

          {/* Handles */}
          {[1.25, -0.35].map((z, i) => (
            <mesh key={i} position={[side * (SIDE + 0.012), 1.28, z]}>
              <boxGeometry args={[0.035, 0.055, 0.19]} />
              <meshStandardMaterial color={TRIM} roughness={0.45} metalness={0.15} />
            </mesh>
          ))}

          {/* Sliding-door track */}
          <mesh position={[side * (SIDE + 0.004), 1.34, -0.18]}>
            <boxGeometry args={[0.03, 0.03, 2.15]} />
            <meshStandardMaterial color="#2a2e32" roughness={0.6} />
          </mesh>

          {/* Large body-coloured door mirror */}
          <mesh position={[side * 1.0, 1.46, 1.86]}>
            <boxGeometry args={[0.14, 0.04, 0.18]} />
            <meshStandardMaterial color={TRIM} roughness={0.6} />
          </mesh>
          <RoundedBox
            args={[0.12, 0.19, 0.27]}
            radius={0.04}
            smoothness={3}
            position={[side * 1.1, 1.44, 1.88]}
          >
            <meshStandardMaterial color={BODY} roughness={0.4} metalness={0.1} />
          </RoundedBox>
          <mesh position={[side * 1.165, 1.44, 1.88]}>
            <boxGeometry args={[0.015, 0.13, 0.2]} />
            <meshStandardMaterial color="#a7bcc8" roughness={0.08} metalness={0.55} />
          </mesh>

          {/* Side indicator */}
          <mesh position={[side * (SIDE + 0.006), 1.02, 2.18]}>
            <boxGeometry args={[0.02, 0.05, 0.14]} />
            <meshStandardMaterial color={AMBER} roughness={0.4} />
          </mesh>

          {/* Wheel-arch lips */}
          {[1.82, -1.82].map((z, i) => (
            <mesh
              key={i}
              position={[side * 0.932, 0.39, z]}
              rotation={[0, Math.PI / 2, 0]}
            >
              <torusGeometry args={[0.445, 0.022, 8, 24, Math.PI]} />
              <meshStandardMaterial color="#e0e5e4" roughness={0.45} metalness={0.05} />
            </mesh>
          ))}

          {/* Fuel filler door (left rear quarter) */}
          {side === -1 && (
            <mesh position={[side * (SIDE + 0.006), 1.0, -1.85]} rotation={[0, Math.PI / 2, 0]}>
              <circleGeometry args={[0.09, 20]} />
              <meshStandardMaterial color={BODY_LOW} roughness={0.5} side={2} />
            </mesh>
          )}
        </group>
      ))}

      {/* ---------- Wheels and wheel wells ---------- */}
      {[1.82, -1.82].map((z, i) => (
        <mesh key={i} position={[0, 0.39, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.437, 0.437, 1.56, 28, 1, true]} />
          <meshStandardMaterial color="#171b1e" roughness={0.92} side={2} />
        </mesh>
      ))}

      <Wheel side={1} z={1.82} />
      <Wheel side={-1} z={1.82} />
      <Wheel side={1} z={-1.82} />
      <Wheel side={-1} z={-1.82} />

      {/* Mud flaps */}
      {[1.28, -2.25].map((z, i) => (
        <group key={i}>
          {[1, -1].map((side) => (
            <mesh key={side} position={[side * 0.9, 0.28, z]}>
              <boxGeometry args={[0.03, 0.22, 0.2]} />
              <meshStandardMaterial color="#15181b" roughness={0.85} />
            </mesh>
          ))}
        </group>
      ))}

      {/* ---------- Roof details ---------- */}
      {/* Rain gutters */}
      {[-0.91, 0.91].map((x, i) => (
        <mesh key={i} position={[x, 2.12, -0.1]}>
          <boxGeometry args={[0.05, 0.035, 4.85]} />
          <meshStandardMaterial color={BODY_LOW} roughness={0.5} />
        </mesh>
      ))}

      {/* Shallow roof channels */}
      {[-0.45, 0.45].map((x, i) => (
        <mesh key={i} position={[x, 2.215, -0.1]}>
          <boxGeometry args={[0.02, 0.01, 4.6]} />
          <meshStandardMaterial color={BODY_LOW} roughness={0.55} />
        </mesh>
      ))}

      {/* Rear roof lip */}
      <mesh position={[0, 2.15, -2.52]}>
        <boxGeometry args={[1.7, 0.06, 0.18]} />
        <meshStandardMaterial color={BODY} roughness={0.48} metalness={0.04} />
      </mesh>

      {/* Rear Toyota badge */}
      <mesh position={[0, 1.24, -2.83]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.018, 20]} />
        <meshStandardMaterial color="#d3d9dd" roughness={0.2} metalness={0.55} />
      </mesh>

      {/* High mount stop lamp */}
      <mesh position={[0, 1.94, -2.85]}>
        <boxGeometry args={[0.42, 0.04, 0.03]} />
        <meshStandardMaterial color={RED} emissive={RED} emissiveIntensity={0.2} />
      </mesh>

      {/* Antenna */}
      <mesh position={[0.55, 2.3, -1.9]}>
        <cylinderGeometry args={[0.012, 0.012, 0.24, 8]} />
        <meshStandardMaterial color="#2a2e34" roughness={0.7} />
      </mesh>
    </group>
  );
}

type CameraRequest = {
  position: [number, number, number];
  target: [number, number, number];
  active: boolean;
};

function CameraRig({
  controlsRef,
  request,
}: {
  controlsRef: { current: any };
  request: { current: CameraRequest };
}) {
  const desiredPosition = useMemo(() => new Vector3(), []);
  const desiredTarget = useMemo(() => new Vector3(), []);

  useFrame((state, delta) => {
    if (!request.current.active) return;
    const orbit = controlsRef.current;
    if (!orbit) return;

    desiredPosition.set(...request.current.position);
    desiredTarget.set(...request.current.target);

    const step = 1 - Math.exp(-7 * Math.min(delta, 0.05));
    state.camera.position.lerp(desiredPosition, step);
    orbit.target.lerp(desiredTarget, step);
    orbit.update();

    if (
      state.camera.position.distanceToSquared(desiredPosition) < 0.0004 &&
      orbit.target.distanceToSquared(desiredTarget) < 0.0004
    ) {
      state.camera.position.copy(desiredPosition);
      orbit.target.copy(desiredTarget);
      orbit.update();
      request.current.active = false;
    }
  });

  return null;
}

export default function Vehicle3DViewer({
  height = "450px",
  modelScale = 1,
}: Vehicle3DViewerProps) {
  const controls = useRef<any>(null);
  const cameraRequest = useRef<CameraRequest>({
    position: [4.8, 2.05, 5.9],
    target: [0, 1.02, 0],
    active: false,
  });

  const views: Record<View, [number, number, number]> = {
    front: [0, 1.3, 6.4],
    rear: [0, 1.3, -6.4],
    left: [7.0, 1.32, 0],
    right: [-7.0, 1.32, 0],
  };

  const applyView = (position: [number, number, number]) => {
    cameraRequest.current.position = position;
    cameraRequest.current.target = [0, 1.02, 0];
    cameraRequest.current.active = true;
  };

  const setView = (view: View) => applyView(views[view]);
  const resetView = () => applyView([4.8, 2.05, 5.9]);

  const buttonStyle = {
    padding: "8px 13px",
    border: "1px solid #d7ded8",
    borderRadius: "7px",
    background: "#ffffff",
    color: "#176B3A",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 600,
  } as const;

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
        {(["front", "rear", "left", "right"] as View[]).map((view) => (
          <button key={view} type="button" style={buttonStyle} onClick={() => setView(view)}>
            {view.charAt(0).toUpperCase() + view.slice(1)}
          </button>
        ))}
        <button
          type="button"
          style={{ ...buttonStyle, marginLeft: "auto", background: "#176B3A", color: "#ffffff" }}
          onClick={resetView}
        >
          Reset View
        </button>
      </div>

      <div
        style={{
          width: "100%",
          height,
          overflow: "hidden",
          borderRadius: "12px",
          background: "#F5F6F3",
          border: "1px solid #e1e6e1",
          touchAction: "none",
        }}
      >
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ position: [4.8, 2.05, 5.9], fov: 33, near: 0.1, far: 100 }}
        >
          <color attach="background" args={["#F5F6F3"]} />
          <Environment resolution={256} frames={1} environmentIntensity={0.45}>
            <Lightformer
              form="rect"
              intensity={1.6}
              position={[0, 5, -8]}
              scale={[10, 7, 1]}
              color="#ffffff"
            />
            <Lightformer
              form="rect"
              intensity={1.2}
              position={[-7, 3, 5]}
              rotation={[0, Math.PI / 4, 0]}
              scale={[7, 6, 1]}
              color="#f4f8f6"
            />
            <Lightformer
              form="rect"
              intensity={1}
              position={[7, 2, 4]}
              rotation={[0, -Math.PI / 4, 0]}
              scale={[6, 5, 1]}
              color="#ffffff"
            />
          </Environment>
          <hemisphereLight args={["#ffffff", "#c3ccd4", 0.55]} />
          <ambientLight intensity={0.22} />
          <directionalLight position={[6, 9, 6]} intensity={1.7} />
          <directionalLight position={[-6, 4, -5]} intensity={0.45} />
          <directionalLight position={[0, 3, -8]} intensity={0.3} />

          <CameraRig controlsRef={controls} request={cameraRequest} />
          <CommuterVan scale={modelScale} />

          <ContactShadows
            position={[0, 0.01, 0]}
            scale={13}
            opacity={0.4}
            blur={2.6}
            far={4.5}
            resolution={512}
            frames={1}
            color="#2a3a33"
          />

          <OrbitControls
            ref={controls}
            enableZoom
            enableRotate
            enablePan={false}
            enableDamping
            dampingFactor={0.08}
            target={[0, 1.02, 0]}
            minDistance={4.6}
            maxDistance={15}
            maxPolarAngle={Math.PI / 2 - 0.02}
            onStart={() => {
              cameraRequest.current.active = false;
            }}
          />
        </Canvas>
      </div>

      <p style={{ margin: 0, color: "#737b74", fontSize: "12px", textAlign: "center" }}>
        Drag to rotate · Scroll to zoom · Select a view to change angles
      </p>
    </div>
  );
}
