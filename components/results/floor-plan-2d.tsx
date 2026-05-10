"use client";

import { useMemo } from "react";

import { Card, CardTitle } from "@/components/ui/card";
import type {
  FloorPlan,
  FloorPlanRoom,
  FloorPlanRoomType,
  Model3D,
  ModelOpening
} from "@/lib/domain/types";

const PX_PER_METER = 22;
const SITE_PADDING = 70;
const HOUSE_PAD = 6;

const roomColors: Record<FloorPlanRoomType, string> = {
  social: "#b8d0b5",
  private: "#d8c7a7",
  service: "#c9c0b6",
  work: "#adc6c9",
  circulation: "#e0d8ca",
  outdoor: "#b7c79a"
};

const roomTypeLabels: Record<FloorPlanRoomType, string> = {
  social: "Social",
  private: "Private",
  service: "Service",
  work: "Work",
  circulation: "Circulation",
  outdoor: "Outdoor"
};

const sustainabilityAccent = "#1f6b52";
const wallStroke = "#3d3a32";
const trimStroke = "#7a716a";

function floorLabel(floor: number) {
  if (floor === 0) return "Ground floor";
  if (floor === 1) return "Second floor";
  if (floor === 2) return "Third floor";
  return `Floor ${floor + 1}`;
}

function ordinalArea(width: number, height: number) {
  return Math.round(width * height);
}

function WindowMarker({
  opening,
  floorPlan,
  ox,
  oy
}: {
  opening: ModelOpening;
  floorPlan: FloorPlan;
  ox: number;
  oy: number;
}) {
  const widthPx = opening.width * PX_PER_METER;
  const wallThickness = 7;
  const isSouthFacing = opening.wall === "south";
  const stroke = isSouthFacing ? sustainabilityAccent : "#5b8aa4";

  if (opening.wall === "north" || opening.wall === "south") {
    const x =
      ox + opening.offset * floorPlan.width * PX_PER_METER - widthPx / 2;
    const y =
      opening.wall === "north"
        ? oy - wallThickness / 2
        : oy + floorPlan.height * PX_PER_METER - wallThickness / 2;
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={widthPx}
          height={wallThickness}
          fill="#ffffff"
        />
        <rect
          x={x}
          y={y + wallThickness / 2 - 1}
          width={widthPx}
          height={2}
          fill={stroke}
        />
      </g>
    );
  }

  const heightPx = opening.width * PX_PER_METER;
  const x =
    opening.wall === "east"
      ? ox + floorPlan.width * PX_PER_METER - wallThickness / 2
      : ox - wallThickness / 2;
  const y =
    oy + opening.offset * floorPlan.height * PX_PER_METER - heightPx / 2;
  return (
    <g>
      <rect x={x} y={y} width={wallThickness} height={heightPx} fill="#ffffff" />
      <rect
        x={x + wallThickness / 2 - 1}
        y={y}
        width={2}
        height={heightPx}
        fill={stroke}
      />
    </g>
  );
}

function DoorMarker({
  opening,
  floorPlan,
  ox,
  oy
}: {
  opening: ModelOpening;
  floorPlan: FloorPlan;
  ox: number;
  oy: number;
}) {
  const widthPx = Math.max(opening.width * PX_PER_METER, 16);
  const wallThickness = 7;

  if (opening.wall === "north" || opening.wall === "south") {
    const x =
      ox + opening.offset * floorPlan.width * PX_PER_METER - widthPx / 2;
    const y =
      opening.wall === "north"
        ? oy - wallThickness / 2
        : oy + floorPlan.height * PX_PER_METER - wallThickness / 2;
    const swingDirection = opening.wall === "south" ? -1 : 1;
    const arcStart = `${x} ${y + wallThickness / 2}`;
    const arcEnd = `${x + widthPx} ${y + wallThickness / 2 + swingDirection * widthPx}`;
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={widthPx}
          height={wallThickness}
          fill="#ffffff"
        />
        <path
          d={`M ${arcStart} A ${widthPx} ${widthPx} 0 0 ${swingDirection === 1 ? 1 : 0} ${arcEnd}`}
          stroke={trimStroke}
          strokeWidth={1}
          fill="none"
          strokeDasharray="3 2"
        />
        <line
          x1={x}
          y1={y + wallThickness / 2}
          x2={x + widthPx}
          y2={y + wallThickness / 2}
          stroke={wallStroke}
          strokeWidth={1.5}
        />
      </g>
    );
  }

  const heightPx = widthPx;
  const x =
    opening.wall === "east"
      ? ox + floorPlan.width * PX_PER_METER - wallThickness / 2
      : ox - wallThickness / 2;
  const y =
    oy + opening.offset * floorPlan.height * PX_PER_METER - heightPx / 2;
  return (
    <g>
      <rect x={x} y={y} width={wallThickness} height={heightPx} fill="#ffffff" />
      <line
        x1={x + wallThickness / 2}
        y1={y}
        x2={x + wallThickness / 2}
        y2={y + heightPx}
        stroke={wallStroke}
        strokeWidth={1.5}
      />
    </g>
  );
}

function SiteFeatures({
  floorPlan,
  model3D,
  ox,
  oy
}: {
  floorPlan: FloorPlan;
  model3D: Model3D;
  ox: number;
  oy: number;
}) {
  const features = model3D.sustainabilityFeatures;
  const houseW = floorPlan.width * PX_PER_METER;
  const houseH = floorPlan.height * PX_PER_METER;

  return (
    <g>
      {features.permeableDriveway ? (
        <g>
          <pattern
            id="permeable-pattern"
            patternUnits="userSpaceOnUse"
            width={10}
            height={10}
          >
            <rect width={10} height={10} fill="#c4cdc4" />
            <path
              d="M 0 5 L 10 5 M 5 0 L 5 10"
              stroke="#94a394"
              strokeWidth={0.8}
            />
          </pattern>
          <rect
            x={ox + houseW * 0.05}
            y={oy + houseH + 12}
            width={houseW * 0.32}
            height={36}
            fill="url(#permeable-pattern)"
            stroke="#7e8a86"
            strokeWidth={1}
            rx={2}
          />
          <text
            x={ox + houseW * 0.05 + houseW * 0.16}
            y={oy + houseH + 60}
            textAnchor="middle"
            fontSize={9}
            fill="var(--muted)"
            style={{ fontWeight: 600, letterSpacing: "0.04em" }}
          >
            PERMEABLE DRIVE
          </text>
        </g>
      ) : null}

      {features.rainwaterTank ? (
        <g>
          <circle
            cx={ox + houseW + 30}
            cy={oy + houseH * 0.65}
            r={11}
            fill="#4f9aa8"
            stroke="#2d6f7c"
            strokeWidth={1.5}
          />
          <circle
            cx={ox + houseW + 30}
            cy={oy + houseH * 0.65}
            r={5}
            fill="#7bbac4"
          />
          <text
            x={ox + houseW + 30}
            y={oy + houseH * 0.65 + 26}
            textAnchor="middle"
            fontSize={9}
            fill="var(--muted)"
            style={{ fontWeight: 600, letterSpacing: "0.04em" }}
          >
            RAINWATER
          </text>
        </g>
      ) : null}

      {features.trees ? (
        <g>
          {[
            [ox - 32, oy + houseH * 0.2],
            [ox - 44, oy + houseH * 0.65],
            [ox + houseW + 36, oy + houseH * 0.2],
            [ox + houseW * 0.85, oy + houseH + 50],
            [ox + houseW * 0.55, oy - 28]
          ].map(([x, y], i) => (
            <g key={`tree-${i}`}>
              <circle cx={x} cy={y} r={9} fill="#5b8a4d" opacity={0.95} />
              <circle cx={x - 3} cy={y - 3} r={5} fill="#79a861" opacity={0.95} />
            </g>
          ))}
        </g>
      ) : null}
    </g>
  );
}

function FloorSvg({
  floorPlan,
  model3D,
  floor
}: {
  floorPlan: FloorPlan;
  model3D: Model3D;
  floor: number;
}) {
  const houseW = floorPlan.width * PX_PER_METER;
  const houseH = floorPlan.height * PX_PER_METER;
  const svgW = houseW + SITE_PADDING * 2;
  const svgH = houseH + SITE_PADDING * 2 + 24;
  const ox = SITE_PADDING;
  const oy = SITE_PADDING;

  const rooms: FloorPlanRoom[] = useMemo(
    () => floorPlan.rooms.filter((r) => r.floor === floor),
    [floorPlan.rooms, floor]
  );

  const windows = useMemo(
    () => model3D.windows.filter((w) => w.floor === floor),
    [model3D.windows, floor]
  );
  const doors = useMemo(
    () => model3D.doors.filter((d) => d.floor === floor),
    [model3D.doors, floor]
  );

  const isGround = floor === 0;

  return (
    <div className="flex w-full max-w-[560px] flex-col items-center rounded-[1.25rem] border border-[color:var(--border)] bg-[rgba(255,250,242,0.94)] p-5 shadow-[0_18px_45px_rgba(68,56,38,0.12)]">
      <p className="font-tech mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
        {floorLabel(floor)}
      </p>
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        width="100%"
        role="img"
        aria-label={`${floorLabel(floor)} plan`}
        preserveAspectRatio="xMidYMid meet"
        style={{ height: "auto" }}
      >
        <rect
          x={0}
          y={0}
          width={svgW}
          height={svgH}
          fill="#f4ecdf"
          rx={14}
        />

        {isGround ? (
          <SiteFeatures
            floorPlan={floorPlan}
            model3D={model3D}
            ox={ox}
            oy={oy}
          />
        ) : null}

        <rect
          x={ox - HOUSE_PAD}
          y={oy - HOUSE_PAD}
          width={houseW + HOUSE_PAD * 2}
          height={houseH + HOUSE_PAD * 2}
          fill="#ffffff"
          stroke={wallStroke}
          strokeWidth={3.5}
          rx={2}
        />

        {rooms.map((room) => {
          const x = ox + room.x * PX_PER_METER;
          const y = oy + room.y * PX_PER_METER;
          const w = room.width * PX_PER_METER;
          const h = room.height * PX_PER_METER;
          return (
            <g key={`${room.floor}-${room.name}`}>
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                fill={roomColors[room.type]}
                stroke={trimStroke}
                strokeWidth={1.2}
              />
              <text
                x={x + w / 2}
                y={y + h / 2 - 4}
                textAnchor="middle"
                fontSize={Math.min(11, Math.max(9, w / 12))}
                fill="#1f1d18"
                style={{ fontWeight: 600 }}
              >
                {room.name}
              </text>
              <text
                x={x + w / 2}
                y={y + h / 2 + 9}
                textAnchor="middle"
                fontSize={9}
                fill="#5d574c"
              >
                {ordinalArea(room.width, room.height)} m²
              </text>
            </g>
          );
        })}

        {windows.map((opening, i) => (
          <WindowMarker
            key={`win-${i}`}
            opening={opening}
            floorPlan={floorPlan}
            ox={ox}
            oy={oy}
          />
        ))}
        {doors.map((opening, i) => (
          <DoorMarker
            key={`door-${i}`}
            opening={opening}
            floorPlan={floorPlan}
            ox={ox}
            oy={oy}
          />
        ))}

        <text
          x={ox + houseW / 2}
          y={oy - 18}
          textAnchor="middle"
          fontSize={9}
          fill={trimStroke}
          style={{ letterSpacing: "0.18em", fontWeight: 600 }}
        >
          NORTH
        </text>
      </svg>
    </div>
  );
}

export function FloorPlanDrawing({
  floorPlan,
  model3D
}: {
  floorPlan: FloorPlan;
  model3D: Model3D;
}) {
  const floors = useMemo(() => {
    const set = new Set<number>();
    floorPlan.rooms.forEach((r) => set.add(r.floor));
    return Array.from(set).sort((a, b) => a - b);
  }, [floorPlan.rooms]);

  const hasSouthGlazing = useMemo(
    () => model3D.windows.some((w) => w.wall === "south"),
    [model3D.windows]
  );

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col">
      <div
        className="grid grid-cols-2 items-start gap-10"
      >
        {floors.map((floor) => (
          <FloorSvg
            key={floor}
            floorPlan={floorPlan}
            model3D={model3D}
            floor={floor}
          />
        ))}
      </div>

      <div className="mt-3 grid gap-2 border-t border-[color:var(--border)] pt-3">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
          Room zones
        </p>
        <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2 xl:grid-cols-3">
          {(Object.keys(roomColors) as FloorPlanRoomType[]).map((type) => (
            <div key={type} className="flex items-center gap-3 text-base">
              <span
                className="inline-block h-4 w-7 shrink-0 rounded-sm border border-[color:var(--border)]"
                style={{ backgroundColor: roomColors[type] }}
                aria-hidden
              />
              <span className="text-[color:var(--muted)]">
                {roomTypeLabels[type]}
              </span>
            </div>
          ))}
          <div className="flex items-center gap-3 text-sm text-[color:var(--muted)]">
            <span
              className="inline-block h-3 w-7 shrink-0 rounded-full"
              style={{ backgroundColor: sustainabilityAccent }}
              aria-hidden
            />
            {hasSouthGlazing ? "South-facing solar window" : "Window strategy"}
          </div>
        </div>
      </div>
    </div>
  );
}

export function FloorPlan2D({
  floorPlan,
  model3D
}: {
  floorPlan: FloorPlan;
  model3D: Model3D;
}) {
  const hasSouthGlazing = useMemo(
    () => model3D.windows.some((w) => w.wall === "south"),
    [model3D.windows]
  );

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-tech text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
            2D floor plan
          </p>
          <CardTitle className="mt-2">Layout drawing</CardTitle>
        </div>
        <p className="max-w-md text-sm text-[color:var(--muted)]">
          Top-down plan showing room zones, openings, and site features.
          {hasSouthGlazing
            ? " South-facing glazing is highlighted to mark the passive solar strategy."
            : ""}
        </p>
      </div>

      <div className="mt-6">
        <FloorPlanDrawing floorPlan={floorPlan} model3D={model3D} />
      </div>
    </Card>
  );
}
