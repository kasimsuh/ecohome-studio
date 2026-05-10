import { describe, expect, it } from "vitest";

import { sanitizeHomeGeometry } from "@/lib/domain/home-geometry";
import { sampleStructuredHomeConcept } from "@/lib/domain/sample-structured-home";

function span(opening: { offset: number; width: number }) {
  const center = opening.offset * sampleStructuredHomeConcept.floorPlan.width;

  return {
    start: center - opening.width / 2,
    end: center + opening.width / 2,
  };
}

describe("sanitizeHomeGeometry", () => {
  it("repairs malformed rooms, openings, floors, and missing entries", () => {
    const concept = sanitizeHomeGeometry({
      floorPlan: {
        width: 5,
        height: 4,
        rooms: [
          {
            name: "Living Room",
            x: 12,
            y: 9,
            width: 0.2,
            height: 0.4,
            floor: 6,
            type: "social",
          },
        ],
      },
      model3D: {
        ...sampleStructuredHomeConcept.model3D,
        floors: 1,
        windows: [
          {
            wall: "south",
            offset: 0,
            width: 8,
            height: 4,
            floor: 9,
            roomName: "Missing Room",
          },
          {
            wall: "south",
            offset: 0.01,
            width: 8,
            height: 4,
            floor: 9,
            roomName: "Missing Room",
          },
        ],
        doors: [],
      },
    });

    expect(concept.floorPlan.width).toBeGreaterThanOrEqual(6);
    expect(concept.floorPlan.height).toBeGreaterThanOrEqual(6);
    expect(concept.floorPlan.rooms[0]).toEqual(
      expect.objectContaining({
        x: 4.2,
        y: 4.2,
        width: 1.8,
        height: 1.8,
        floor: 3,
      }),
    );
    expect(concept.model3D.floors).toBe(4);
    expect(concept.model3D.doors).toHaveLength(1);
    expect(concept.model3D.doors[0]).toEqual(
      expect.objectContaining({
        wall: "south",
        floor: 0,
        height: 2.2,
      }),
    );
    expect(concept.model3D.windows[0]?.floor).toBeLessThan(concept.model3D.floors);
    expect(concept.model3D.windows[0]?.width).toBeLessThanOrEqual(1.92);
    expect(concept.model3D.windows[0]?.height).toBe(1.5);
    expect(concept.model3D.windows[0]?.roomName).toBeUndefined();
    expect(
      concept.model3D.windows[1].offset - concept.model3D.windows[0].offset,
    ).toBeGreaterThanOrEqual(0.25);
  });

  it("forces doors to ground level and keeps openings fully on their wall", () => {
    const concept = sanitizeHomeGeometry({
      floorPlan: sampleStructuredHomeConcept.floorPlan,
      model3D: {
        ...sampleStructuredHomeConcept.model3D,
        doors: [
          {
            wall: "east",
            offset: 0.99,
            width: 12,
            height: 4,
            floor: 2,
          },
        ],
        windows: [],
      },
    });
    const door = concept.model3D.doors[0];
    const wallLength = concept.floorPlan.height;
    const halfWidthRatio = door.width / wallLength / 2;

    expect(door.floor).toBe(0);
    expect(door.width).toBeLessThanOrEqual(2.4);
    expect(door.height).toBe(2.5);
    expect(door.offset).toBeLessThanOrEqual(1 - halfWidthRatio - 0.04);
    expect(concept.model3D.windows.length).toBeGreaterThanOrEqual(3);
  });

  it("moves or removes windows that collide with doors or other wide windows", () => {
    const concept = sanitizeHomeGeometry({
      floorPlan: sampleStructuredHomeConcept.floorPlan,
      model3D: {
        ...sampleStructuredHomeConcept.model3D,
        doors: [
          {
            wall: "south",
            offset: 0.5,
            width: 2,
            height: 2.2,
            floor: 0,
          },
        ],
        windows: [
          {
            wall: "south",
            offset: 0.5,
            width: 3.2,
            height: 2,
            floor: 0,
          },
          {
            wall: "south",
            offset: 0.52,
            width: 3.2,
            height: 2,
            floor: 0,
          },
        ],
      },
    });

    const door = concept.model3D.doors[0];
    const doorSpan = span(door);

    concept.model3D.windows.forEach((window, index) => {
      const windowSpan = span(window);

      expect(window.height).toBeLessThanOrEqual(1.5);
      expect(
        windowSpan.end <= doorSpan.start - 0.15 ||
          windowSpan.start >= doorSpan.end + 0.15,
      ).toBe(true);

      const next = concept.model3D.windows[index + 1];
      if (next) {
        expect(span(next).start - windowSpan.end).toBeGreaterThanOrEqual(0.15);
      }
    });
  });
});
