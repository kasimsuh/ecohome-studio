"use client";

import { useMemo, useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sky, Environment, ContactShadows } from "@react-three/drei";

import { FloorPlanDrawing } from "@/components/results/floor-plan-2d";
import { Card, CardTitle } from "@/components/ui/card";
import type {
  FloorPlan,
  GeneratedHomeConcept,
  Model3D,
  ModelOpening,
  RoofType,
} from "@/lib/domain/types";
import { cn } from "@/lib/utils";

const FLOOR_HEIGHT = 2.7;
const FOUNDATION_HEIGHT = 0.4;
const FOUNDATION_OVERHANG = 0.35;
const ROOF_OVERHANG = 0.45;
const WINDOW_SILL = 0.95;
const WALL_THICKNESS = 0.28;

const exteriorColorMap: Record<string, string> = {
  "sandstone-beige": "#dcc8a4",
  "warm-white": "#ece6d6",
  "warm-grey": "#bcb6ac",
  "soft-grey": "#c5beb4",
  charcoal: "#4d4942",
  cedar: "#a17350",
  sage: "#a3ae8d",
  linen: "#e6dcc6",
  white: "#f1ece1",
  beige: "#dcc8a4",
};

function resolveExteriorColor(value: string) {
  if (!value) return "#dcc8a4";
  const key = value.toLowerCase().trim().replace(/\s+/g, "-");
  return exteriorColorMap[key] ?? "#dcc8a4";
}

const sustainabilityAccent: Record<
  keyof Model3D["sustainabilityFeatures"],
  string
> = {
  solarPanels: "#3a6db5",
  greenRoof: "#7fae5e",
  rainwaterTank: "#4f9aa8",
  trees: "#5b8a4d",
  permeableDriveway: "#9eaab2",
  crossVentilation: "#7cc6c8",
};

const sustainabilityLabels: Record<
  keyof Model3D["sustainabilityFeatures"],
  string
> = {
  solarPanels: "Solar array",
  greenRoof: "Green roof",
  rainwaterTank: "Rainwater capture",
  trees: "Native canopy",
  permeableDriveway: "Permeable driveway",
  crossVentilation: "Cross ventilation",
};

function openingTransform(
  opening: ModelOpening,
  floorPlan: FloorPlan,
  isDoor: boolean,
  outsetDepth: number,
) {
  const baseY = FOUNDATION_HEIGHT + opening.floor * FLOOR_HEIGHT;
  const sill = isDoor ? 0 : WINDOW_SILL;
  const y = baseY + sill + opening.height / 2;
  const alongW = opening.offset * floorPlan.width - floorPlan.width / 2;
  const alongH = opening.offset * floorPlan.height - floorPlan.height / 2;

  switch (opening.wall) {
    case "south":
      return {
        position: [alongW, y, floorPlan.height / 2 + outsetDepth] as [
          number,
          number,
          number,
        ],
        rotationY: 0,
      };
    case "north":
      return {
        position: [alongW, y, -floorPlan.height / 2 - outsetDepth] as [
          number,
          number,
          number,
        ],
        rotationY: Math.PI,
      };
    case "east":
      return {
        position: [floorPlan.width / 2 + outsetDepth, y, alongH] as [
          number,
          number,
          number,
        ],
        rotationY: -Math.PI / 2,
      };
    case "west":
    default:
      return {
        position: [-floorPlan.width / 2 - outsetDepth, y, alongH] as [
          number,
          number,
          number,
        ],
        rotationY: Math.PI / 2,
      };
  }
}

function Window({
  opening,
  floorPlan,
}: {
  opening: ModelOpening;
  floorPlan: FloorPlan;
}) {
  const frameT = 0.08;
  const frameDepth = 0.16;
  const t = openingTransform(opening, floorPlan, false, -WALL_THICKNESS / 2);
  const w = opening.width;
  const h = opening.height;

  return (
    <group position={t.position} rotation={[0, t.rotationY, 0]}>
      <mesh position={[0, h / 2 + frameT / 2, 0]}>
        <boxGeometry args={[w + frameT * 2, frameT, frameDepth]} />
        <meshStandardMaterial color="#3d3a32" roughness={0.7} />
      </mesh>
      <mesh position={[0, -h / 2 - frameT / 2, 0]}>
        <boxGeometry args={[w + frameT * 2, frameT, frameDepth]} />
        <meshStandardMaterial color="#3d3a32" roughness={0.7} />
      </mesh>
      <mesh position={[-w / 2 - frameT / 2, 0, 0]}>
        <boxGeometry args={[frameT, h, frameDepth]} />
        <meshStandardMaterial color="#3d3a32" roughness={0.7} />
      </mesh>
      <mesh position={[w / 2 + frameT / 2, 0, 0]}>
        <boxGeometry args={[frameT, h, frameDepth]} />
        <meshStandardMaterial color="#3d3a32" roughness={0.7} />
      </mesh>
      {/* Glass pane – physical transmission for real glass look */}
      <mesh>
        <boxGeometry args={[w, h, 0.04]} />
        <meshPhysicalMaterial
          color="#c8e8e4"
          transmission={0.84}
          roughness={0.04}
          metalness={0}
          ior={1.5}
          thickness={0.06}
        />
      </mesh>
      {/* Horizontal mid-rail divider */}
      <mesh position={[0, 0, 0.025]}>
        <boxGeometry args={[w, frameT * 0.5, 0.03]} />
        <meshStandardMaterial color="#3d3a32" roughness={0.7} />
      </mesh>
      {/* Vertical mid-post divider */}
      <mesh position={[0, 0, 0.025]}>
        <boxGeometry args={[frameT * 0.5, h, 0.03]} />
        <meshStandardMaterial color="#3d3a32" roughness={0.7} />
      </mesh>
      {/* Exterior sill – protruding shelf below the frame */}
      <mesh position={[0, -h / 2 - frameT * 0.6, frameDepth / 2 + 0.06]} castShadow>
        <boxGeometry args={[w + frameT * 2 + 0.12, 0.06, 0.15]} />
        <meshStandardMaterial color="#3d3a32" roughness={0.75} />
      </mesh>
    </group>
  );
}

function Door({
  opening,
  floorPlan,
}: {
  opening: ModelOpening;
  floorPlan: FloorPlan;
}) {
  const frameT = 0.1;
  const frameDepth = 0.18;
  const t = openingTransform(opening, floorPlan, true, -WALL_THICKNESS / 2);
  const w = opening.width;
  const h = opening.height;

  return (
    <group position={t.position} rotation={[0, t.rotationY, 0]}>
      <mesh position={[0, h / 2 + frameT / 2, 0]}>
        <boxGeometry args={[w + frameT * 2, frameT, frameDepth]} />
        <meshStandardMaterial color="#2f2c25" roughness={0.7} />
      </mesh>
      <mesh position={[-w / 2 - frameT / 2, 0, 0]}>
        <boxGeometry args={[frameT, h + frameT, frameDepth]} />
        <meshStandardMaterial color="#2f2c25" roughness={0.7} />
      </mesh>
      <mesh position={[w / 2 + frameT / 2, 0, 0]}>
        <boxGeometry args={[frameT, h + frameT, frameDepth]} />
        <meshStandardMaterial color="#2f2c25" roughness={0.7} />
      </mesh>
      <mesh>
        <boxGeometry args={[w, h, 0.07]} />
        <meshStandardMaterial color="#7a5b3b" roughness={0.75} />
      </mesh>
      <mesh position={[w * 0.32, 0, 0.05]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial color="#c8a86a" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

function Foundation({ floorPlan }: { floorPlan: FloorPlan }) {
  const w = floorPlan.width + FOUNDATION_OVERHANG * 2;
  const d = floorPlan.height + FOUNDATION_OVERHANG * 2;
  return (
    <mesh position={[0, FOUNDATION_HEIGHT / 2, 0]} receiveShadow castShadow>
      <boxGeometry args={[w, FOUNDATION_HEIGHT, d]} />
      <meshStandardMaterial color="#9b9085" roughness={0.95} />
    </mesh>
  );
}

function WallsWithOpenings({
  floorPlan,
  model3D,
}: {
  floorPlan: FloorPlan;
  model3D: Model3D;
}) {
  const color = resolveExteriorColor(model3D.exteriorColor);
  const T = WALL_THICKNESS;
  const fW = floorPlan.width;
  const fH = floorPlan.height;

  const wallDefs = useMemo(() => {
    type WallDef = {
      geo: THREE.BufferGeometry;
      position: [number, number, number];
      rotationY: number;
    };
    const result: WallDef[] = [];

    const wallConfigs = [
      {
        key: "south" as const,
        wallW: fW,
        pos: (baseY: number): [number, number, number] => [
          0,
          baseY,
          fH / 2 - T,
        ],
        rotY: 0,
        holeX: (offset: number) => offset * fW - fW / 2,
      },
      {
        key: "north" as const,
        wallW: fW,
        pos: (baseY: number): [number, number, number] => [
          0,
          baseY,
          -fH / 2 + T,
        ],
        rotY: Math.PI,
        holeX: (offset: number) => fW / 2 - offset * fW,
      },
      {
        key: "east" as const,
        wallW: fH,
        pos: (baseY: number): [number, number, number] => [
          fW / 2 - T,
          baseY,
          0,
        ],
        rotY: Math.PI / 2,
        holeX: (offset: number) => fH / 2 - offset * fH,
      },
      {
        key: "west" as const,
        wallW: fH,
        pos: (baseY: number): [number, number, number] => [
          -fW / 2 + T,
          baseY,
          0,
        ],
        rotY: -Math.PI / 2,
        holeX: (offset: number) => offset * fH - fH / 2,
      },
    ];

    for (let floor = 0; floor < model3D.floors; floor++) {
      const baseY = FOUNDATION_HEIGHT + floor * FLOOR_HEIGHT;

      for (const cfg of wallConfigs) {
        const shape = new THREE.Shape();
        shape.moveTo(-cfg.wallW / 2, 0);
        shape.lineTo(cfg.wallW / 2, 0);
        shape.lineTo(cfg.wallW / 2, FLOOR_HEIGHT);
        shape.lineTo(-cfg.wallW / 2, FLOOR_HEIGHT);
        shape.lineTo(-cfg.wallW / 2, 0);

        const wins = model3D.windows.filter(
          (o) => o.wall === cfg.key && o.floor === floor,
        );
        const drs = model3D.doors.filter(
          (o) => o.wall === cfg.key && o.floor === floor,
        );

        for (const o of wins) {
          const cx = cfg.holeX(o.offset);
          const cy = WINDOW_SILL + o.height / 2;
          const p = new THREE.Path();
          p.moveTo(cx - o.width / 2, cy - o.height / 2);
          p.lineTo(cx + o.width / 2, cy - o.height / 2);
          p.lineTo(cx + o.width / 2, cy + o.height / 2);
          p.lineTo(cx - o.width / 2, cy + o.height / 2);
          p.lineTo(cx - o.width / 2, cy - o.height / 2);
          shape.holes.push(p);
        }
        for (const o of drs) {
          const cx = cfg.holeX(o.offset);
          const cy = o.height / 2;
          const p = new THREE.Path();
          p.moveTo(cx - o.width / 2, cy - o.height / 2);
          p.lineTo(cx + o.width / 2, cy - o.height / 2);
          p.lineTo(cx + o.width / 2, cy + o.height / 2);
          p.lineTo(cx - o.width / 2, cy + o.height / 2);
          p.lineTo(cx - o.width / 2, cy - o.height / 2);
          shape.holes.push(p);
        }

        const geo = new THREE.ExtrudeGeometry(shape, {
          depth: T,
          bevelEnabled: false,
        });
        result.push({ geo, position: cfg.pos(baseY), rotationY: cfg.rotY });
      }
    }

    return result;
  }, [fW, fH, model3D, T]);

  return (
    <group>
      {wallDefs.map((def, i) => (
        <mesh
          key={i}
          geometry={def.geo}
          position={def.position}
          rotation={[0, def.rotationY, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color={color} roughness={0.85} />
        </mesh>
      ))}

      {Array.from({ length: Math.max(0, model3D.floors - 1) }).map((_, i) => (
        <mesh
          key={`band-${i}`}
          position={[0, FOUNDATION_HEIGHT + (i + 1) * FLOOR_HEIGHT, 0]}
        >
          <boxGeometry args={[fW + 0.1, 0.08, fH + 0.1]} />
          <meshStandardMaterial color="#3d3a32" roughness={0.7} />
        </mesh>
      ))}

      {Array.from({ length: model3D.floors - 1 }).map((_, i) => (
        <mesh
          key={`slab-${i}`}
          position={[0, FOUNDATION_HEIGHT + (i + 1) * FLOOR_HEIGHT, 0]}
          receiveShadow
        >
          <boxGeometry args={[fW - T * 2, 0.15, fH - T * 2]} />
          <meshStandardMaterial color="#9b9085" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function FlatRoof({
  floorPlan,
  top,
  greenRoof,
}: {
  floorPlan: FloorPlan;
  top: number;
  greenRoof: boolean;
}) {
  const w = floorPlan.width + ROOF_OVERHANG * 2;
  const d = floorPlan.height + ROOF_OVERHANG * 2;
  const surface = greenRoof ? sustainabilityAccent.greenRoof : "#5d5e51";

  return (
    <group position={[0, top, 0]}>
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, 0.2, d]} />
        <meshStandardMaterial
          color={surface}
          roughness={0.9}
          emissive={greenRoof ? "#4a8a34" : "#000000"}
          emissiveIntensity={greenRoof ? 0.9 : 0}
        />
      </mesh>
      <mesh position={[0, 0.34, d / 2 - 0.06]}>
        <boxGeometry args={[w, 0.28, 0.12]} />
        <meshStandardMaterial color="#3d3a32" />
      </mesh>
      <mesh position={[0, 0.34, -d / 2 + 0.06]}>
        <boxGeometry args={[w, 0.28, 0.12]} />
        <meshStandardMaterial color="#3d3a32" />
      </mesh>
      <mesh position={[w / 2 - 0.06, 0.34, 0]}>
        <boxGeometry args={[0.12, 0.28, d]} />
        <meshStandardMaterial color="#3d3a32" />
      </mesh>
      <mesh position={[-w / 2 + 0.06, 0.34, 0]}>
        <boxGeometry args={[0.12, 0.28, d]} />
        <meshStandardMaterial color="#3d3a32" />
      </mesh>
    </group>
  );
}

function GableRoof({ floorPlan, top }: { floorPlan: FloorPlan; top: number }) {
  const w = floorPlan.width + ROOF_OVERHANG * 2;
  const d = floorPlan.height + ROOF_OVERHANG * 2;
  // Peak proportional to depth so slope reads on the south face
  const peak = d * 0.38;

  // Shape describes the gable END (south-north cross-section) in XY plane:
  // X here will map to world Z after rotation, Y stays as world Y.
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-d / 2, 0); // south eave
    s.lineTo(d / 2, 0); // north eave
    s.lineTo(0, peak); // ridge apex
    s.lineTo(-d / 2, 0);
    return s;
  }, [d, peak]);

  // Rotate -90° around Y: local X → world -Z, local Z → world +X.
  // With position [-w/2, top, 0] the extrusion runs from x=-w/2 to x=+w/2 (east-west ridge).
  // Shape x=-d/2 maps to world z=+d/2 (south eave); x=+d/2 maps to z=-d/2 (north eave).
  return (
    <group position={[0, top, 0]}>
      <mesh
        position={[w / 2, 0, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        castShadow
        receiveShadow
      >
        <extrudeGeometry args={[shape, { depth: w, bevelEnabled: false }]} />
        <meshStandardMaterial color="#4a4339" roughness={0.92} />
      </mesh>
      {/* Ridge cap beam running east-west */}
      <mesh position={[0, peak + 0.05, 0]} castShadow>
        <boxGeometry args={[w + 0.06, 0.1, 0.2]} />
        <meshStandardMaterial color="#2f2c25" />
      </mesh>
      {/* Eave fascia boards – south and north edges */}
      <mesh position={[0, 0.09, d / 2]} castShadow>
        <boxGeometry args={[w + 0.06, 0.2, 0.09]} />
        <meshStandardMaterial color="#2f2c25" roughness={0.82} />
      </mesh>
      <mesh position={[0, 0.09, -d / 2]} castShadow>
        <boxGeometry args={[w + 0.06, 0.2, 0.09]} />
        <meshStandardMaterial color="#2f2c25" roughness={0.82} />
      </mesh>
    </group>
  );
}

function HipRoof({ floorPlan, top }: { floorPlan: FloorPlan; top: number }) {
  const w = floorPlan.width + ROOF_OVERHANG * 2;
  const d = floorPlan.height + ROOF_OVERHANG * 2;
  const peak = Math.min(w, d) * 0.32;

  const geometry = useMemo(() => {
    const halfW = w / 2;
    const halfD = d / 2;
    const apex: [number, number, number] = [0, peak, 0];
    const v0: [number, number, number] = [-halfW, 0, -halfD];
    const v1: [number, number, number] = [halfW, 0, -halfD];
    const v2: [number, number, number] = [halfW, 0, halfD];
    const v3: [number, number, number] = [-halfW, 0, halfD];

    const positions = new Float32Array([
      ...v0,
      ...v1,
      ...apex,
      ...v1,
      ...v2,
      ...apex,
      ...v2,
      ...v3,
      ...apex,
      ...v3,
      ...v0,
      ...apex,
    ]);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.computeVertexNormals();
    return geo;
  }, [w, d, peak]);

  return (
    <group position={[0, top, 0]}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial color="#4a4339" side={THREE.DoubleSide} roughness={0.92} />
      </mesh>
      {/* Eave fascia – all 4 edges */}
      <mesh position={[0, 0.05, d / 2]} castShadow>
        <boxGeometry args={[w + 0.06, 0.18, 0.09]} />
        <meshStandardMaterial color="#2f2c25" roughness={0.82} />
      </mesh>
      <mesh position={[0, 0.05, -d / 2]} castShadow>
        <boxGeometry args={[w + 0.06, 0.18, 0.09]} />
        <meshStandardMaterial color="#2f2c25" roughness={0.82} />
      </mesh>
      <mesh position={[w / 2, 0.05, 0]} castShadow>
        <boxGeometry args={[0.09, 0.18, d]} />
        <meshStandardMaterial color="#2f2c25" roughness={0.82} />
      </mesh>
      <mesh position={[-w / 2, 0.05, 0]} castShadow>
        <boxGeometry args={[0.09, 0.18, d]} />
        <meshStandardMaterial color="#2f2c25" roughness={0.82} />
      </mesh>
    </group>
  );
}

function ShedRoof({ floorPlan, top }: { floorPlan: FloorPlan; top: number }) {
  const w = floorPlan.width + ROOF_OVERHANG * 2;
  const d = floorPlan.height + ROOF_OVERHANG * 2;
  const rise = w * 0.18;
  const angle = Math.atan2(rise, w);

  return (
    <group position={[0, top, 0]} rotation={[0, 0, angle]}>
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[w / Math.cos(angle), 0.2, d]} />
        <meshStandardMaterial color="#4a4339" roughness={0.92} />
      </mesh>
    </group>
  );
}

function ButterflyRoof({
  floorPlan,
  top,
}: {
  floorPlan: FloorPlan;
  top: number;
}) {
  const w = floorPlan.width + ROOF_OVERHANG * 2;
  const halfW = w / 2;
  const d = floorPlan.height + ROOF_OVERHANG * 2;
  const rise = w * 0.1;
  const angle = Math.atan2(rise, halfW);

  return (
    <group position={[0, top, 0]}>
      <group position={[-halfW / 2, 0, 0]} rotation={[0, 0, -angle]}>
        <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
          <boxGeometry args={[halfW / Math.cos(angle), 0.18, d]} />
          <meshStandardMaterial color="#4a4339" roughness={0.92} />
        </mesh>
      </group>
      <group position={[halfW / 2, 0, 0]} rotation={[0, 0, angle]}>
        <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
          <boxGeometry args={[halfW / Math.cos(angle), 0.18, d]} />
          <meshStandardMaterial color="#4a4339" roughness={0.92} />
        </mesh>
      </group>
    </group>
  );
}

function Roof({
  floorPlan,
  model3D,
}: {
  floorPlan: FloorPlan;
  model3D: Model3D;
}) {
  const top = FOUNDATION_HEIGHT + model3D.floors * FLOOR_HEIGHT;
  const greenRoof = model3D.sustainabilityFeatures.greenRoof;
  const type: RoofType = model3D.roofType;

  if (type === "gable") return <GableRoof floorPlan={floorPlan} top={top} />;
  if (type === "hip") return <HipRoof floorPlan={floorPlan} top={top} />;
  if (type === "shed") return <ShedRoof floorPlan={floorPlan} top={top} />;
  if (type === "butterfly")
    return <ButterflyRoof floorPlan={floorPlan} top={top} />;
  return <FlatRoof floorPlan={floorPlan} top={top} greenRoof={greenRoof} />;
}

function SolarArray({
  floorPlan,
  model3D,
}: {
  floorPlan: FloorPlan;
  model3D: Model3D;
}) {
  const top = FOUNDATION_HEIGHT + model3D.floors * FLOOR_HEIGHT;
  const roofD = floorPlan.height + ROOF_OVERHANG * 2;
  const cols = 4;
  const rows = 3;
  const panelW = 1.2;
  const panelD = 0.78;
  const gap = 0.08;

  // For gable roof: place array on the south-facing slope.
  // Peak = roofD * 0.38 (matches GableRoof). South slope runs from eave (z=+roofD/2, y=top)
  // to ridge (z=0, y=top+peak). Array sits midway: z=roofD/4, y=top+peak/2.
  const gablePeak = roofD * 0.38;
  const slopeAngle = Math.atan2(gablePeak, roofD / 2);

  const isGable = model3D.roofType === "gable";
  const isFlat = model3D.roofType === "flat";

  const posY = isGable ? top + gablePeak * 0.5 : top + 0.32;
  const posZ = isGable ? roofD / 4 : 0;
  const tiltX = isGable ? slopeAngle : isFlat ? -0.18 : -0.28;

  const panelMaterial = (
    <meshStandardMaterial
      color="#1a232b"
      metalness={0.55}
      roughness={0.22}
      emissive="#4499ff"
      emissiveIntensity={1.5}
      toneMapped={false}
    />
  );

  return (
    <group position={[0, posY, posZ]} rotation={[tiltX, 0, 0]}>
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => (
          <mesh
            key={`panel-${r}-${c}`}
            position={[
              (c - (cols - 1) / 2) * (panelW + gap),
              0,
              (r - (rows - 1) / 2) * (panelD + gap),
            ]}
            castShadow
          >
            <boxGeometry args={[panelW, 0.05, panelD]} />
            {panelMaterial}
          </mesh>
        )),
      )}
      <mesh position={[0, -0.03, 0]}>
        <boxGeometry
          args={[
            cols * panelW + (cols - 1) * gap + 0.4,
            0.06,
            rows * panelD + (rows - 1) * gap + 0.4,
          ]}
        />
        <meshStandardMaterial color="#1a1a1a" roughness={0.7} metalness={0.3} />
      </mesh>
      {/* Point light beneath the array to cast blue-tinted glow on roof surface */}
      <pointLight
        color={sustainabilityAccent.solarPanels}
        intensity={0.6}
        distance={5}
        position={[0, -0.5, 0]}
      />
    </group>
  );
}

function RainwaterTank({ floorPlan }: { floorPlan: FloorPlan }) {
  return (
    <group
      position={[
        floorPlan.width / 2 + 1.0,
        FOUNDATION_HEIGHT + 0.75,
        floorPlan.height / 2 - 1.6,
      ]}
    >
      <mesh castShadow>
        <cylinderGeometry args={[0.42, 0.42, 1.5, 28]} />
        <meshStandardMaterial
          color={sustainabilityAccent.rainwaterTank}
          roughness={0.35}
          metalness={0.3}
          emissive="#00eeff"
          emissiveIntensity={1.4}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0.82, 0]}>
        <cylinderGeometry args={[0.44, 0.44, 0.1, 28]} />
        <meshStandardMaterial color="#33606b" />
      </mesh>
      <mesh position={[0, -0.78, 0]}>
        <cylinderGeometry args={[0.46, 0.46, 0.06, 28]} />
        <meshStandardMaterial color="#33606b" />
      </mesh>
      <pointLight
        color={sustainabilityAccent.rainwaterTank}
        intensity={0.6}
        distance={4}
        position={[0, 0.5, 0]}
      />
    </group>
  );
}

function PermeableDriveway({ floorPlan }: { floorPlan: FloorPlan }) {
  const widthM = Math.min(floorPlan.width * 0.34, 5);
  const depthM = 1.8;
  const tile = 0.55;
  const cols = Math.max(1, Math.floor(widthM / tile));
  const rows = Math.max(1, Math.floor(depthM / tile));
  const startX = -floorPlan.width * 0.3;

  return (
    <group position={[startX, 0.02, floorPlan.height / 2 + 1.6]}>
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => (
          <mesh
            key={`tile-${r}-${c}`}
            position={[
              (c - (cols - 1) / 2) * tile,
              0,
              (r - (rows - 1) / 2) * tile,
            ]}
            receiveShadow
          >
            <boxGeometry args={[tile * 0.9, 0.04, tile * 0.9]} />
            <meshStandardMaterial
              color={
                (r + c) % 2 === 0
                  ? sustainabilityAccent.permeableDriveway
                  : "#7e8a86"
              }
              roughness={0.95}
            />
          </mesh>
        )),
      )}
    </group>
  );
}

function CrossVentilationArrows({
  floorPlan,
  model3D,
}: {
  floorPlan: FloorPlan;
  model3D: Model3D;
}) {
  // Float above the gable ridge so the arrows are always visible
  const top = FOUNDATION_HEIGHT + model3D.floors * FLOOR_HEIGHT;
  const roofD = floorPlan.height + ROOF_OVERHANG * 2;
  const gablePeak = model3D.roofType === "gable" ? roofD * 0.38 : 0.5;
  const y = top + gablePeak + 1.2;
  const span = floorPlan.width + 3;

  return (
    <group position={[0, y, 0]}>
      <mesh>
        <boxGeometry args={[span, 0.14, 0.14]} />
        <meshStandardMaterial
          color={sustainabilityAccent.crossVentilation}
          emissive="#aaeeff"
          emissiveIntensity={1.8}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[span / 2, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.26, 0.6, 22]} />
        <meshStandardMaterial
          color={sustainabilityAccent.crossVentilation}
          emissive="#aaeeff"
          emissiveIntensity={1.8}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[-span / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.26, 0.6, 22]} />
        <meshStandardMaterial
          color={sustainabilityAccent.crossVentilation}
          emissive="#aaeeff"
          emissiveIntensity={1.8}
          toneMapped={false}
        />
      </mesh>
      <pointLight
        color={sustainabilityAccent.crossVentilation}
        intensity={0.8}
        distance={8}
        position={[0, 0, 0]}
      />
    </group>
  );
}

function Trees({ floorPlan }: { floorPlan: FloorPlan }) {
  const positions: Array<[number, number, number, number]> = [
    [-floorPlan.width / 2 - 1.6, -floorPlan.height / 2 - 1.0, 0.95, 1],
    [-floorPlan.width / 2 - 2.4, -floorPlan.height / 2 + 1.4, 1.15, 0.88],
    [floorPlan.width / 2 + 1.4, -floorPlan.height / 2 + 0.4, 0.85, 1.05],
    [floorPlan.width / 2 + 2.2, floorPlan.height / 2 + 0.6, 1.05, 0.92],
    [-floorPlan.width / 2 - 1.0, floorPlan.height / 2 + 1.6, 1.0, 1],
    [floorPlan.width / 2 + 1.6, -floorPlan.height / 2 - 1.7, 0.78, 0.95],
  ];

  return (
    <>
      {positions.map(([x, z, scale, hue], i) => {
        const dark = hue > 1 ? "#4a7a40" : "#5b8a4d";
        const mid = hue > 1 ? "#5b8a4d" : "#6e9a58";
        const light = "#79a861";
        return (
          <group key={`tree-${i}`} position={[x, 0, z]} scale={[scale, scale, scale]}>
            {/* Tapered trunk – two stacked cylinders */}
            <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.09, 0.14, 0.6, 10]} />
              <meshStandardMaterial color="#6a5236" roughness={0.97} />
            </mesh>
            <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.06, 0.09, 0.48, 10]} />
              <meshStandardMaterial color="#7a6040" roughness={0.97} />
            </mesh>
            {/* Canopy – 5 overlapping spheres for organic silhouette */}
            <mesh position={[0, 1.15, 0]} castShadow receiveShadow>
              <sphereGeometry args={[0.52, 14, 14]} />
              <meshStandardMaterial color={dark} roughness={0.93} />
            </mesh>
            <mesh position={[-0.28, 1.38, 0.18]} castShadow>
              <sphereGeometry args={[0.38, 12, 12]} />
              <meshStandardMaterial color={mid} roughness={0.92} />
            </mesh>
            <mesh position={[0.3, 1.45, -0.15]} castShadow>
              <sphereGeometry args={[0.36, 12, 12]} />
              <meshStandardMaterial color={mid} roughness={0.92} />
            </mesh>
            <mesh position={[0.1, 1.72, 0.08]} castShadow>
              <sphereGeometry args={[0.30, 12, 12]} />
              <meshStandardMaterial color={light} roughness={0.91} />
            </mesh>
            <mesh position={[-0.12, 1.9, -0.1]} castShadow>
              <sphereGeometry args={[0.22, 10, 10]} />
              <meshStandardMaterial color={light} roughness={0.90} />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

function Ground({ floorPlan }: { floorPlan: FloorPlan }) {
  const w = floorPlan.width + 12;
  const d = floorPlan.height + 12;
  return (
    <mesh
      position={[0, -0.01, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial color="#e1d6bf" roughness={1} />
    </mesh>
  );
}

function EntryCanopy({
  floorPlan,
  model3D,
}: {
  floorPlan: FloorPlan;
  model3D: Model3D;
}) {
  const door = model3D.doors.find((d) => d.wall === "south" && d.floor === 0);
  if (!door) return null;

  const doorX = door.offset * floorPlan.width - floorPlan.width / 2;
  const canopyY = FOUNDATION_HEIGHT + door.height + 0.04;
  const canopyW = door.width + 0.9;
  const canopyProtrude = 0.7;
  const slabT = 0.09;
  const postH = door.height + 0.04;

  return (
    <group position={[doorX, canopyY, floorPlan.height / 2]}>
      {/* Canopy slab */}
      <mesh castShadow receiveShadow position={[0, slabT / 2, canopyProtrude / 2]}>
        <boxGeometry args={[canopyW, slabT, canopyProtrude]} />
        <meshStandardMaterial color="#3d3a32" roughness={0.78} />
      </mesh>
      {/* Left support post */}
      <mesh castShadow position={[-(canopyW / 2 - 0.07), -postH / 2, canopyProtrude - 0.05]}>
        <boxGeometry args={[0.09, postH, 0.09]} />
        <meshStandardMaterial color="#2f2c25" roughness={0.85} />
      </mesh>
      {/* Right support post */}
      <mesh castShadow position={[canopyW / 2 - 0.07, -postH / 2, canopyProtrude - 0.05]}>
        <boxGeometry args={[0.09, postH, 0.09]} />
        <meshStandardMaterial color="#2f2c25" roughness={0.85} />
      </mesh>
    </group>
  );
}

function HomeScene({
  floorPlan,
  model3D,
}: {
  floorPlan: FloorPlan;
  model3D: Model3D;
}) {
  const features = model3D.sustainabilityFeatures;

  return (
    <>
      <Sky sunPosition={[50, 20, 30]} turbidity={5} rayleigh={0.5} mieCoefficient={0.005} mieDirectionalG={0.8} />
      <Environment preset="sunset" />
      <ambientLight intensity={0.22} />
      <directionalLight
        position={[12, 16, 9]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.001}
        shadow-camera-near={0.5}
        shadow-camera-far={60}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      <directionalLight position={[-10, 8, -6]} intensity={0.3} />

      <Ground floorPlan={floorPlan} />
      <ContactShadows position={[0, 0.02, 0]} opacity={0.32} scale={50} blur={2.8} far={12} />
      <Foundation floorPlan={floorPlan} />
      <WallsWithOpenings floorPlan={floorPlan} model3D={model3D} />
      <Roof floorPlan={floorPlan} model3D={model3D} />

      {model3D.windows.map((w, i) => (
        <Window key={`win-${i}`} opening={w} floorPlan={floorPlan} />
      ))}
      {model3D.doors.map((d, i) => (
        <Door key={`door-${i}`} opening={d} floorPlan={floorPlan} />
      ))}
      <EntryCanopy floorPlan={floorPlan} model3D={model3D} />

      {features.solarPanels ? (
        <SolarArray floorPlan={floorPlan} model3D={model3D} />
      ) : null}
      {features.rainwaterTank ? <RainwaterTank floorPlan={floorPlan} /> : null}
      {features.permeableDriveway ? (
        <PermeableDriveway floorPlan={floorPlan} />
      ) : null}
      {features.crossVentilation ? (
        <CrossVentilationArrows floorPlan={floorPlan} model3D={model3D} />
      ) : null}
      {features.trees ? <Trees floorPlan={floorPlan} /> : null}

      <OrbitControls
        makeDefault
        enablePan
        enableZoom
        target={[0, FLOOR_HEIGHT * 1.1, 0]}
        minDistance={10}
        maxDistance={42}
      />
    </>
  );
}

const featureDescriptions: Record<keyof Model3D["sustainabilityFeatures"], { headline: string; body: string }> = {
  solarPanels: {
    headline: "Solar array",
    body: "Photovoltaic panels are integrated across your roof, converting sunlight directly into electricity. This cuts your energy bills, reduces dependence on the grid, and lowers your home's lifetime carbon footprint — often producing more energy than the home consumes.",
  },
  greenRoof: {
    headline: "Living green roof",
    body: "A planted roof layer of drought-tolerant sedums and grasses acts as natural insulation, slowing heat gain in summer and heat loss in winter. It also absorbs stormwater, supports local biodiversity, and extends the lifespan of the roof membrane beneath.",
  },
  rainwaterTank: {
    headline: "Rainwater harvesting",
    body: "A dedicated tank captures roof runoff and stores it for garden irrigation, toilet flushing, and laundry. This can cut mains water use by up to 40%, building household resilience during dry periods and reducing pressure on local stormwater systems.",
  },
  trees: {
    headline: "Native canopy",
    body: "Carefully placed native trees provide summer shading that passively cools the home and outdoor spaces, while shelter from prevailing winds reduces heating demand in winter. Over their lifetime they sequester carbon and create habitat for local wildlife.",
  },
  permeableDriveway: {
    headline: "Permeable driveway",
    body: "A permeable paving system lets rainwater filter naturally through joints and into the soil below, rather than rushing into stormwater drains. This reduces local flood risk, recharges groundwater, and keeps the site cool by avoiding the heat-island effect of sealed surfaces.",
  },
  crossVentilation: {
    headline: "Cross ventilation",
    body: "Strategically placed openings on opposite walls channel prevailing breezes through the home, flushing out heat and moisture without any mechanical system. This passive cooling strategy is one of the most effective ways to keep a home comfortable year-round at zero running cost.",
  },
};

function FeaturePopup({
  featureKey,
  color,
  onClose,
}: {
  featureKey: keyof Model3D["sustainabilityFeatures"];
  color: string;
  onClose: () => void;
}) {
  const info = featureDescriptions[featureKey];
  return (
    <div className="rounded-[1.25rem] border border-[rgba(61,93,72,0.18)] bg-[rgba(255,250,242,0.96)] p-4 shadow-[0_18px_55px_rgba(45,39,28,0.18)] backdrop-blur-xl">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className="mt-0.5 inline-block h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
            aria-hidden
          />
          <p className="font-tech text-sm font-semibold uppercase tracking-[0.14em] text-[color:var(--foreground)]">
            {info.headline}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-2.5 py-1 text-xs font-semibold text-[color:var(--muted)] transition hover:border-[color:var(--accent)] hover:bg-[color:var(--accent)] hover:text-white"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
      <p className="text-sm leading-6 text-[color:var(--muted)]">{info.body}</p>
    </div>
  );
}

export function Home3DPreview({
  floorPlan,
  model3D,
  upgrades,
  materials,
  className,
  variant = "card",
}: {
  floorPlan: FloorPlan;
  model3D: Model3D;
  upgrades?: GeneratedHomeConcept["upgrades"];
  materials?: GeneratedHomeConcept["materials"];
  className?: string;
  variant?: "card" | "workspace";
}) {
  const [showFloorPlan, setShowFloorPlan] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<keyof Model3D["sustainabilityFeatures"] | null>(null);

  function toggleFeature(key: keyof Model3D["sustainabilityFeatures"]) {
    setSelectedFeature((prev) => (prev === key ? null : key));
  }
  const activeFeatures = useMemo(
    () =>
      (
        Object.entries(model3D.sustainabilityFeatures) as Array<
          [keyof Model3D["sustainabilityFeatures"], boolean]
        >
      )
        .filter(([, enabled]) => enabled)
        .map(([key]) => ({
          key,
          label: sustainabilityLabels[key],
          color: sustainabilityAccent[key],
        })),
    [model3D.sustainabilityFeatures],
  );

  const cameraDistance = Math.max(floorPlan.width, floorPlan.height) * 1.65;

  if (variant === "workspace") {
    return (
      <section
        className={cn(
          "relative h-[72vh] min-h-[620px] overflow-hidden bg-[linear-gradient(180deg,#f4ecdf,#e8ddca)] lg:h-screen lg:min-h-0",
          className,
        )}
      >
        <div className="absolute inset-0" data-testid="home-3d-canvas">
          <Canvas
            shadows
            camera={{
              position: [cameraDistance, FLOOR_HEIGHT * 2.2, cameraDistance],
              fov: 50,
            }}
          >
            <HomeScene floorPlan={floorPlan} model3D={model3D} />
          </Canvas>
        </div>

        <div className="pointer-events-none absolute inset-x-4 top-4 z-10 flex flex-col gap-3 sm:inset-x-5 sm:top-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="pointer-events-auto rounded-[1.25rem] border border-[rgba(61,93,72,0.18)] bg-[rgba(255,250,242,0.72)] p-4 shadow-[0_18px_55px_rgba(45,39,28,0.14)] backdrop-blur-xl">
            <p className="font-tech text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
              Ecohome Presents
            </p>
            <h2 className="font-tech mt-1 text-2xl tracking-[0.03em] text-[color:var(--foreground)]">
              Your sustainable dream home
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setShowFloorPlan((current) => !current)}
            className="pointer-events-auto rounded-full border border-[rgba(61,93,72,0.18)] bg-[rgba(255,250,242,0.78)] px-4 py-2 text-sm font-semibold text-[color:var(--foreground)] shadow-[0_12px_35px_rgba(45,39,28,0.12)] backdrop-blur-xl transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent-dark)]"
            aria-pressed={showFloorPlan}
          >
            {showFloorPlan ? "Hide floor plan" : "Show floor plan"}
          </button>
        </div>

        <div className="pointer-events-none absolute inset-x-4 bottom-4 z-10 grid gap-3 sm:inset-x-5 sm:bottom-5 xl:grid-cols-[1fr_1fr]">
          {/* Left col – sustainability badges */}
          <div className="pointer-events-auto rounded-[1.25rem] border border-[rgba(61,93,72,0.16)] bg-[rgba(255,250,242,0.7)] p-3 shadow-[0_18px_55px_rgba(45,39,28,0.12)] backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
              Sustainability layer · tap to learn more
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {activeFeatures.map((feature) => (
                <li key={feature.key}>
                  <button
                    type="button"
                    onClick={() => toggleFeature(feature.key)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.68rem] font-semibold transition",
                      selectedFeature === feature.key
                        ? "bg-[color:var(--accent)] text-white"
                        : "bg-[rgba(255,248,239,0.88)] text-[color:var(--foreground)] hover:bg-[rgba(255,248,239,1)]",
                    )}
                  >
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: selectedFeature === feature.key ? "rgba(255,255,255,0.7)" : feature.color,
                        boxShadow: selectedFeature === feature.key ? "none" : `0 0 8px ${feature.color}`,
                      }}
                      aria-hidden
                    />
                    {feature.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Right col – feature popup when open, top upgrades when closed */}
          <div className="pointer-events-auto hidden xl:flex xl:flex-col">
            {selectedFeature ? (
              <FeaturePopup
                featureKey={selectedFeature}
                color={sustainabilityAccent[selectedFeature]}
                onClose={() => setSelectedFeature(null)}
              />
            ) : upgrades?.length ? (
              <div className="flex h-full flex-col rounded-[1.25rem] border border-[rgba(61,93,72,0.16)] bg-[rgba(255,250,242,0.7)] p-3 shadow-[0_18px_55px_rgba(45,39,28,0.12)] backdrop-blur-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                  Top upgrades
                </p>
                <div className="mt-2 grid gap-2">
                  {upgrades.slice(0, 2).map((upgrade) => (
                    <div key={upgrade.title}>
                      <p className="text-sm font-semibold text-[color:var(--foreground)]">
                        {upgrade.title}
                      </p>
                      <p className="text-xs text-[color:var(--muted)]">
                        {upgrade.category} · {upgrade.impactLevel} impact
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {showFloorPlan ? (
          <div
            className="absolute left-6 right-6 top-6 z-20 flex max-h-[calc(100%-3rem)] flex-col overflow-hidden rounded-[1.5rem] border border-[color:var(--border)] bg-[rgba(255,250,242,0.9)] shadow-[0_24px_80px_rgba(45,39,28,0.2)] backdrop-blur-xl"
            data-testid="floor-plan-overlay"
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[color:var(--border)] px-6 py-5">
              <div>
                <p className="font-tech text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                  Floor plan
                </p>
                <p className="mt-1 text-base text-[color:var(--foreground)]">
                  Top-down room layout and openings
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFloorPlan(false)}
                className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-1.5 text-xs font-semibold text-[color:var(--muted)] transition hover:border-[color:var(--accent)] hover:bg-[color:var(--accent)] hover:text-white"
              >
                Close
              </button>
            </div>
            <div className="overflow-auto px-8 py-6">
              <FloorPlanDrawing
                floorPlan={floorPlan}
                model3D={model3D}
              />
            </div>
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <Card
      className={cn(
        "flex min-h-[640px] flex-col overflow-hidden p-4 md:p-5 lg:h-full lg:min-h-0",
        className,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-tech text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
            Generated 3D preview
          </p>
          <CardTitle className="mt-2">Your sustainable dream home</CardTitle>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-sm text-[color:var(--muted)]">
            {model3D.floors} floor{model3D.floors === 1 ? "" : "s"} ·{" "}
            {model3D.roofType} roof
          </div>
          <button
            type="button"
            onClick={() => setShowFloorPlan((current) => !current)}
            className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-2 text-sm font-semibold text-[color:var(--foreground)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent-dark)]"
            aria-pressed={showFloorPlan}
          >
            {showFloorPlan ? "Hide floor plan" : "Show floor plan"}
          </button>
        </div>
      </div>

      <div className="mt-4 flex min-h-0 flex-1 flex-col gap-4">
        <div
          className="relative min-h-[440px] flex-1 overflow-hidden rounded-[1.5rem] border border-[color:var(--border)] bg-[linear-gradient(180deg,#f4ecdf,#e8ddca)] lg:min-h-0"
          data-testid="home-3d-canvas"
        >
          <Canvas
            shadows
            camera={{
              position: [cameraDistance, FLOOR_HEIGHT * 1.4, cameraDistance],
              fov: 32,
            }}
          >
            <HomeScene floorPlan={floorPlan} model3D={model3D} />
          </Canvas>

          {showFloorPlan ? (
            <div
              className="absolute left-1/2 top-3 z-20 flex w-[min(calc(100%-1.5rem),1240px)] -translate-x-1/2 flex-col overflow-hidden rounded-[1.25rem] border border-[color:var(--border)] bg-[rgba(255,250,242,0.9)] px-5 py-4 shadow-[0_18px_55px_rgba(45,39,28,0.18)] backdrop-blur-xl sm:px-6 sm:py-5"
              data-testid="floor-plan-overlay"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-tech text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                    Floor plan
                  </p>
                  <p className="mt-1 text-base text-[color:var(--foreground)]">
                    Top-down room layout and openings
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFloorPlan(false)}
                  className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-1.5 text-xs font-semibold text-[color:var(--muted)] transition hover:border-[color:var(--accent)] hover:bg-[color:var(--accent)] hover:text-white"
                >
                  Close
                </button>
              </div>
              <FloorPlanDrawing
                floorPlan={floorPlan}
                model3D={model3D}
              />
            </div>
          ) : null}
        </div>

        <aside className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
              Sustainability layer · tap to learn more
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {activeFeatures.map((feature) => (
                <li key={feature.key}>
                  <button
                    type="button"
                    onClick={() => toggleFeature(feature.key)}
                    className={cn(
                      "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                      selectedFeature === feature.key
                        ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-white"
                        : "border-[color:var(--border)] bg-[color:var(--surface-strong)] text-[color:var(--foreground)] hover:border-[color:var(--accent)]",
                    )}
                  >
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: selectedFeature === feature.key ? "rgba(255,255,255,0.7)" : feature.color,
                        boxShadow: selectedFeature === feature.key ? "none" : `0 0 8px ${feature.color}`,
                      }}
                      aria-hidden
                    />
                    {feature.label}
                  </button>
                </li>
              ))}
            </ul>
            {selectedFeature ? (
              <div className="mt-3">
                <FeaturePopup
                  featureKey={selectedFeature}
                  color={sustainabilityAccent[selectedFeature]}
                  onClose={() => setSelectedFeature(null)}
                />
              </div>
            ) : null}
          </div>

          {upgrades?.length ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                Top upgrades
              </p>
              <div className="mt-3 grid gap-2">
                {upgrades.slice(0, 2).map((upgrade) => (
                  <div
                    key={upgrade.title}
                    className="rounded-[1rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-2"
                  >
                    <p className="text-sm font-semibold text-[color:var(--foreground)]">
                      {upgrade.title}
                    </p>
                    <p className="mt-1 text-xs text-[color:var(--muted)]">
                      {upgrade.category} · {upgrade.impactLevel} impact
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {materials?.[0] ? (
            <p className="rounded-[1rem] bg-[color:var(--surface-muted)] p-3 text-sm leading-6 text-[color:var(--muted)] xl:col-span-2">
              Material cue:{" "}
              <span className="font-semibold text-[color:var(--foreground)]">
                {materials[0].name}
              </span>
            </p>
          ) : null}
        </aside>
      </div>
    </Card>
  );
}
