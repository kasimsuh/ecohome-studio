import type { Model3D } from "@/lib/domain/types";

const MAX_FLOORS = 4;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function normalizeStudioModel3D(model: Model3D): Model3D {
  const floors = clamp(Math.round(model.floors), 1, MAX_FLOORS);

  const roofType: Model3D["roofType"] =
    model.roofType === "butterfly" ? "gable" : model.roofType;

  const dormerCount: Model3D["dormerCount"] =
    roofType === "gable"
      ? (clamp(Math.round(model.dormerCount ?? 0), 0, 3) as 0 | 1 | 2 | 3)
      : 0;

  const chimneyCount: Model3D["chimneyCount"] = clamp(
    Math.round(model.chimneyCount ?? 0),
    0,
    2,
  ) as 0 | 1 | 2;

  const hasDeck = (model.hasDeck ?? false) && floors >= 2;

  return { ...model, floors, roofType, dormerCount, chimneyCount, hasDeck };
}
