import { describe, expect, it, vi } from "vitest";

vi.mock("@react-three/fiber", () => ({
  Canvas: () => null
}));

vi.mock("@react-three/drei", () => ({
  ContactShadows: () => null,
  Environment: () => null,
  OrbitControls: () => null,
  Sky: () => null
}));

import { getOpeningRenderPlacement } from "@/components/results/home-3d-preview";
import { sampleStructuredHomeConcept } from "@/lib/domain/sample-structured-home";
import type { ModelOpening } from "@/lib/domain/types";

describe("getOpeningRenderPlacement", () => {
  it("places visible openings outside each exterior wall face", () => {
    const floorPlan = sampleStructuredHomeConcept.floorPlan;
    const baseOpening = {
      offset: 0.5,
      width: 1.2,
      height: 1.2,
      floor: 0,
    } satisfies Omit<ModelOpening, "wall">;

    expect(
      getOpeningRenderPlacement({ ...baseOpening, wall: "south" }, floorPlan, false)
        .position[2],
    ).toBeGreaterThan(floorPlan.height / 2);
    expect(
      getOpeningRenderPlacement({ ...baseOpening, wall: "north" }, floorPlan, false)
        .position[2],
    ).toBeLessThan(-floorPlan.height / 2);
    expect(
      getOpeningRenderPlacement({ ...baseOpening, wall: "east" }, floorPlan, false)
        .position[0],
    ).toBeGreaterThan(floorPlan.width / 2);
    expect(
      getOpeningRenderPlacement({ ...baseOpening, wall: "west" }, floorPlan, false)
        .position[0],
    ).toBeLessThan(-floorPlan.width / 2);
  });
});
