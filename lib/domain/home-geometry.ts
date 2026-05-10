import type { HomeConcept } from "@/lib/domain/home-concept-schema";

type FloorPlan = HomeConcept["floorPlan"];
type Model3D = HomeConcept["model3D"];
type ModelOpening = Model3D["windows"][number];

type GeometryInput = {
  floorPlan: FloorPlan;
  model3D: Model3D;
};

const MAX_FLOORS = 4;
const MIN_PLAN_WIDTH = 6;
const MIN_PLAN_HEIGHT = 6;
const MIN_ROOM_WIDTH = 1.8;
const MIN_ROOM_HEIGHT = 1.8;
const RENDER_FLOOR_HEIGHT = 2.7;
const WINDOW_SILL = 0.95;
const WINDOW_TOP_CLEARANCE = 0.25;
const MIN_OPENING_SPACING = 0.25;
const OPENING_EDGE_MARGIN = 0.04;

const WINDOW_LIMITS = {
  minWidth: 0.6,
  maxWidth: 3.2,
  minHeight: 0.6,
  maxHeight: 2
};

const DOOR_LIMITS = {
  minWidth: 0.8,
  maxWidth: 2.4,
  minHeight: 2,
  maxHeight: 2.5
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

function roundMetric(value: number) {
  return Math.round(value * 100) / 100;
}

function getWallLength(opening: ModelOpening, floorPlan: FloorPlan) {
  return opening.wall === "north" || opening.wall === "south"
    ? floorPlan.width
    : floorPlan.height;
}

function sanitizeRooms(floorPlan: FloorPlan) {
  const width = Math.max(MIN_PLAN_WIDTH, floorPlan.width);
  const height = Math.max(MIN_PLAN_HEIGHT, floorPlan.height);

  const rooms = floorPlan.rooms.map((room) => {
    const x = clamp(room.x, 0, Math.max(0, width - MIN_ROOM_WIDTH));
    const y = clamp(room.y, 0, Math.max(0, height - MIN_ROOM_HEIGHT));
    const maxWidth = Math.max(MIN_ROOM_WIDTH, width - x);
    const maxHeight = Math.max(MIN_ROOM_HEIGHT, height - y);

    return {
      ...room,
      x: roundMetric(x),
      y: roundMetric(y),
      width: roundMetric(clamp(room.width, MIN_ROOM_WIDTH, maxWidth)),
      height: roundMetric(clamp(room.height, MIN_ROOM_HEIGHT, maxHeight)),
      floor: clamp(Math.round(room.floor), 0, MAX_FLOORS - 1)
    };
  });

  return {
    width: roundMetric(width),
    height: roundMetric(height),
    rooms
  };
}

function getValidRoomNamesByFloor(floorPlan: FloorPlan) {
  return floorPlan.rooms.reduce<Map<number, Set<string>>>((roomsByFloor, room) => {
    const roomNames = roomsByFloor.get(room.floor) ?? new Set<string>();
    roomNames.add(room.name);
    roomsByFloor.set(room.floor, roomNames);
    return roomsByFloor;
  }, new Map<number, Set<string>>());
}

function getOffsetRange(opening: ModelOpening, floorPlan: FloorPlan) {
  const halfWidthRatio = opening.width / getWallLength(opening, floorPlan) / 2;
  const minimumOffset = Math.min(0.5, halfWidthRatio + OPENING_EDGE_MARGIN);
  const maximumOffset = Math.max(minimumOffset, 1 - halfWidthRatio - OPENING_EDGE_MARGIN);

  return { minimumOffset, maximumOffset };
}

function getOpeningSpan(opening: ModelOpening, floorPlan: FloorPlan) {
  const wallLength = getWallLength(opening, floorPlan);
  const center = opening.offset * wallLength;

  return {
    start: center - opening.width / 2,
    end: center + opening.width / 2
  };
}

function spansOverlap(
  opening: ModelOpening,
  other: ModelOpening,
  floorPlan: FloorPlan,
  spacing = MIN_OPENING_SPACING
) {
  const left = getOpeningSpan(opening, floorPlan);
  const right = getOpeningSpan(other, floorPlan);

  return left.start < right.end + spacing && right.start < left.end + spacing;
}

function sanitizeOpening({
  opening,
  floorPlan,
  floors,
  isDoor,
  roomNamesByFloor
}: {
  opening: ModelOpening;
  floorPlan: FloorPlan;
  floors: number;
  isDoor: boolean;
  roomNamesByFloor: Map<number, Set<string>>;
}) {
  const limits = isDoor ? DOOR_LIMITS : WINDOW_LIMITS;
  const floor = isDoor ? 0 : clamp(Math.round(opening.floor), 0, floors - 1);
  const wallLength = getWallLength(opening, floorPlan);
  const maxWidth = Math.max(limits.minWidth, Math.min(limits.maxWidth, wallLength * 0.32));
  const maxHeight = isDoor
    ? limits.maxHeight
    : Math.min(limits.maxHeight, RENDER_FLOOR_HEIGHT - WINDOW_SILL - WINDOW_TOP_CLEARANCE);
  const width = roundMetric(clamp(opening.width, limits.minWidth, maxWidth));
  const height = roundMetric(clamp(opening.height, limits.minHeight, maxHeight));
  const offsetProbe = { ...opening, width };
  const { minimumOffset, maximumOffset } = getOffsetRange(offsetProbe, floorPlan);
  const roomNames = roomNamesByFloor.get(floor);
  const roomName =
    opening.roomName && roomNames?.has(opening.roomName)
      ? opening.roomName
      : undefined;

  return {
    ...opening,
    offset: roundMetric(clamp(opening.offset, minimumOffset, maximumOffset)),
    width,
    height,
    floor,
    roomName
  };
}

function spreadOpenings(openings: ModelOpening[], floorPlan: FloorPlan) {
  const grouped = new Map<string, ModelOpening[]>();

  openings.forEach((opening) => {
    const key = `${opening.floor}:${opening.wall}`;
    grouped.set(key, [...(grouped.get(key) ?? []), opening]);
  });

  return Array.from(grouped.values())
    .flatMap((group) => {
      const sorted = [...group].sort((left, right) => left.offset - right.offset);
      const spaced: ModelOpening[] = [];

      sorted.forEach((opening) => {
        const { minimumOffset, maximumOffset } = getOffsetRange(opening, floorPlan);
        const wallLength = getWallLength(opening, floorPlan);
        const previous = spaced.at(-1);
        const previousSpan = previous ? getOpeningSpan(previous, floorPlan) : null;
        const desiredCenter = previousSpan
          ? Math.max(
              opening.offset * wallLength,
              previousSpan.end + MIN_OPENING_SPACING + opening.width / 2
            )
          : opening.offset * wallLength;
        const candidate = {
          ...opening,
          offset: roundMetric(clamp(desiredCenter / wallLength, minimumOffset, maximumOffset))
        };

        if (previous && spansOverlap(candidate, previous, floorPlan, MIN_OPENING_SPACING * 0.6)) {
          return;
        }

        spaced.push(candidate);
      });

      return spaced;
    })
    .sort((left, right) => left.floor - right.floor || left.wall.localeCompare(right.wall));
}

function avoidDoorConflict(
  window: ModelOpening,
  doors: ModelOpening[],
  floorPlan: FloorPlan
) {
  const conflictingDoors = doors.filter(
    (door) =>
      door.floor === window.floor &&
      door.wall === window.wall &&
      spansOverlap(window, door, floorPlan)
  );

  if (!conflictingDoors.length) {
    return window;
  }

  const { minimumOffset, maximumOffset } = getOffsetRange(window, floorPlan);
  const wallLength = getWallLength(window, floorPlan);
  const originalCenter = window.offset * wallLength;
  const candidates = conflictingDoors.flatMap((door) => {
    const span = getOpeningSpan(door, floorPlan);

    return [
      span.start - MIN_OPENING_SPACING - window.width / 2,
      span.end + MIN_OPENING_SPACING + window.width / 2
    ];
  });

  return candidates
    .map((center) => clamp(center / wallLength, minimumOffset, maximumOffset))
    .map((offset) => ({
      ...window,
      offset: roundMetric(offset)
    }))
    .filter(
      (candidate) =>
        !doors.some(
          (door) =>
            door.floor === candidate.floor &&
            door.wall === candidate.wall &&
            spansOverlap(candidate, door, floorPlan)
        )
    )
    .sort(
      (left, right) =>
        Math.abs(left.offset * wallLength - originalCenter) -
        Math.abs(right.offset * wallLength - originalCenter)
    )[0] ?? null;
}

function removeDoorConflicts(
  windows: ModelOpening[],
  doors: ModelOpening[],
  floorPlan: FloorPlan
) {
  return windows
    .map((window) => avoidDoorConflict(window, doors, floorPlan))
    .filter((window): window is ModelOpening => window !== null)
    .filter(
      (window) =>
        !doors.some(
          (door) =>
            door.floor === window.floor &&
            door.wall === window.wall &&
            spansOverlap(window, door, floorPlan, MIN_OPENING_SPACING * 0.6)
        )
    );
}

function createFallbackDoor(floorPlan: FloorPlan): ModelOpening {
  const width = clamp(floorPlan.width * 0.11, DOOR_LIMITS.minWidth, DOOR_LIMITS.maxWidth);

  return {
    wall: "south",
    offset: 0.18,
    width: roundMetric(width),
    height: 2.2,
    floor: 0
  };
}

function createFallbackWindows(floorPlan: FloorPlan, floors: number): ModelOpening[] {
  const width = roundMetric(clamp(floorPlan.width * 0.12, 1, 1.6));
  const groundFloor: ModelOpening[] = [
    { wall: "south", offset: 0.48, width, height: 1.25, floor: 0 },
    { wall: "south", offset: 0.72, width, height: 1.25, floor: 0 },
    { wall: "north", offset: 0.36, width: 1, height: 1.1, floor: 0 }
  ];

  if (floors < 2) {
    return groundFloor;
  }

  return [
    ...groundFloor,
    { wall: "south", offset: 0.36, width: 1.1, height: 1.15, floor: 1 },
    { wall: "south", offset: 0.62, width: 1.1, height: 1.15, floor: 1 }
  ];
}

export function sanitizeHomeGeometry<T extends GeometryInput>(concept: T): T {
  const floorPlan = sanitizeRooms(concept.floorPlan);
  const highestRoomFloor = Math.max(0, ...floorPlan.rooms.map((room) => room.floor));
  const floors = clamp(
    Math.max(Math.round(concept.model3D.floors), highestRoomFloor + 1),
    1,
    MAX_FLOORS
  );
  const roomNamesByFloor = getValidRoomNamesByFloor(floorPlan);
  const sanitize = (opening: ModelOpening, isDoor: boolean) =>
    sanitizeOpening({
      opening,
      floorPlan,
      floors,
      isDoor,
      roomNamesByFloor
    });

  const doors = spreadOpenings(
    concept.model3D.doors.map((door) => sanitize(door, true)),
    floorPlan
  );
  const safeDoors = doors.length ? doors : [sanitize(createFallbackDoor(floorPlan), true)];
  const windows = spreadOpenings(
    removeDoorConflicts(
      spreadOpenings(
        concept.model3D.windows.map((window) => sanitize(window, false)),
        floorPlan
      ),
      safeDoors,
      floorPlan
    ),
    floorPlan
  );
  const fallbackWindows = createFallbackWindows(floorPlan, floors).map((window) =>
    sanitize(window, false)
  );
  const model3D = {
    ...concept.model3D,
    floors,
    doors: safeDoors,
    windows: windows.length
      ? windows
      : removeDoorConflicts(fallbackWindows, safeDoors, floorPlan)
  };

  return {
    ...concept,
    floorPlan,
    model3D
  };
}
