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

import {
  getCrossVentilationArrowHeight,
  getFurniturePlacements,
  getOpeningRenderPlacement,
  getRainwaterTankPlacement,
  getRoofPeakHeight,
  getTreePlacements,
  resolveExteriorColor,
  resolveRoofColor,
  resolveSceneStyleProfile,
} from "@/components/results/home-3d-preview";
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

describe("3D scene deterministic helpers", () => {
  it("creates stable but varied tree and rainwater placements", () => {
    const floorPlan = sampleStructuredHomeConcept.floorPlan;

    expect(getTreePlacements(floorPlan, "seed-a")).toEqual(
      getTreePlacements(floorPlan, "seed-a"),
    );
    expect(getTreePlacements(floorPlan, "seed-a")).not.toEqual(
      getTreePlacements(floorPlan, "seed-b"),
    );
    expect(getRainwaterTankPlacement(floorPlan, "seed-a")).toEqual(
      getRainwaterTankPlacement(floorPlan, "seed-a"),
    );
    expect(getRainwaterTankPlacement(floorPlan, "seed-a")).not.toEqual(
      getRainwaterTankPlacement(floorPlan, "seed-b"),
    );
  });

  it("resolves freeform exterior and roof colors from generated JSON text", () => {
    expect(resolveExteriorColor("soft beige-green")).toBe("#9dad88");
    expect(resolveExteriorColor("charcoal cedar")).not.toBe("#dcc8a4");
    expect(resolveExteriorColor("white lime plaster")).not.toBe("#dcc8a4");
    expect(resolveExteriorColor("generated color name")).not.toBe("#dcc8a4");
    expect(
      resolveRoofColor({
        ...sampleStructuredHomeConcept.model3D,
        exteriorColor: "charcoal cedar",
      }),
    ).toBe("#34312c");
  });

  it("derives realistic scene styling from prompt and material cues", () => {
    const baseModel = sampleStructuredHomeConcept.model3D;

    expect(
      resolveSceneStyleProfile(
        { ...baseModel, wallMaterial: "cedar cladding", exteriorColor: "warm cedar" },
        { architecturalStyle: "Modern mass timber cabin" },
      ),
    ).toMatchObject({
      materialFamily: "wood",
      mood: "cabin",
      facadeDetail: "wood-slat",
    });

    expect(
      resolveSceneStyleProfile(
        { ...baseModel, wallMaterial: "white lime plaster", exteriorColor: "soft white" },
        { architecturalStyle: "minimal coastal light-filled home" },
      ),
    ).toMatchObject({
      materialFamily: "plaster",
      mood: "coastal",
      facadeDetail: "plaster",
    });

    expect(
      resolveSceneStyleProfile(
        { ...baseModel, wallMaterial: "local stone", exteriorColor: "stone cottage" },
        { materials: [{ name: "limestone", reason: "durable", sustainabilityBenefit: "local" }] },
      ),
    ).toMatchObject({
      materialFamily: "stone",
      facadeDetail: "stone-base",
    });

    expect(
      resolveSceneStyleProfile(
        { ...baseModel, wallMaterial: "unknown finish", exteriorColor: "generated color name" },
        { summary: "A personal dream home with a calm natural palette" },
      ).wallColor,
    ).not.toBe("#dcc8a4");
  });

  it("places cross ventilation above the highest roof point for each roof type", () => {
    const floorPlan = sampleStructuredHomeConcept.floorPlan;

    (["flat", "gable", "hip", "shed", "butterfly"] as const).forEach((roofType) => {
      const model3D = {
        ...sampleStructuredHomeConcept.model3D,
        roofType,
      };

      expect(getCrossVentilationArrowHeight(floorPlan, model3D)).toBeGreaterThan(
        getRoofPeakHeight(floorPlan, model3D),
      );
    });
  });

  it("creates stable dummy furniture from floor plan room types", () => {
    const floorPlan = sampleStructuredHomeConcept.floorPlan;
    const furniture = getFurniturePlacements(floorPlan, "seed-a");

    expect(furniture).toEqual(getFurniturePlacements(floorPlan, "seed-a"));
    expect(furniture).not.toEqual(getFurniturePlacements(floorPlan, "seed-b"));
    expect(furniture.map((item) => item.kind)).toEqual(
      expect.arrayContaining(["sofa", "table", "bed", "desk", "cabinet"]),
    );
    expect(
      furniture.every(
        (item) =>
          item.position[0] >= -floorPlan.width / 2 &&
          item.position[0] <= floorPlan.width / 2 &&
          item.position[2] >= -floorPlan.height / 2 &&
          item.position[2] <= floorPlan.height / 2,
      ),
    ).toBe(true);
  });
});
