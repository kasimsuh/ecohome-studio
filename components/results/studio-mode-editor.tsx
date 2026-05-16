"use client";

import { exteriorColorMap } from "@/components/results/home-3d-preview";
import {
  bodyStyleValues,
  facadeMaterialValues,
  roofMaterialValues,
  roofTypeValues,
  type BodyStyle,
  type FacadeMaterial,
  type Model3D,
  type RoofMaterial,
  type RoofType,
} from "@/lib/domain/types";
import { cn } from "@/lib/utils";

const sustainabilityLabels: Record<
  keyof Model3D["sustainabilityFeatures"],
  string
> = {
  solarPanels: "Solar panels",
  greenRoof: "Green roof",
  rainwaterTank: "Rainwater tank",
  trees: "Native trees",
  permeableDriveway: "Permeable driveway",
  crossVentilation: "Cross ventilation",
};

const facadeLabels: Record<FacadeMaterial, string> = {
  "timber-board": "Timber board",
  brick: "Brick",
  "rendered-plaster": "Plaster",
  "stone-veneer": "Stone",
  "metal-panel": "Metal panel",
  "fiber-cement": "Fiber cement",
};

// Butterfly is intentionally excluded — visually unstable; normalizer migrates
// any pre-existing butterfly data to gable on first open.
const editableRoofTypes = roofTypeValues.filter(
  (t): t is Exclude<RoofType, "butterfly"> => t !== "butterfly",
);

const roofTypeLabels: Record<Exclude<RoofType, "butterfly">, string> = {
  flat: "Flat",
  gable: "Gable",
  hip: "Hip",
  shed: "Shed",
};

const roofMaterialLabels: Record<RoofMaterial, string> = {
  "metal-standing-seam": "Standing seam",
  "clay-tile": "Clay tile",
  "asphalt-shingle": "Asphalt shingle",
  "rubber-membrane": "Rubber membrane",
};

const bodyStyleLabels: Record<BodyStyle, string> = {
  box: "Box",
  "l-shape": "L-shape",
  "split-level": "Split-level",
};

const colorOrder: Array<keyof typeof exteriorColorMap> = [
  "warm-white",
  "linen",
  "sandstone-beige",
  "warm-grey",
  "soft-grey",
  "charcoal",
  "cedar",
  "sage",
];

export function StudioModeEditor({
  draft,
  onChange,
}: {
  draft: Model3D;
  onChange: (next: Model3D) => void;
}) {
  function update<K extends keyof Model3D>(key: K, value: Model3D[K]) {
    onChange({ ...draft, [key]: value });
  }

  function toggleFeature(key: keyof Model3D["sustainabilityFeatures"]) {
    onChange({
      ...draft,
      sustainabilityFeatures: {
        ...draft.sustainabilityFeatures,
        [key]: !draft.sustainabilityFeatures[key],
      },
    });
  }

  const showGreenRoofHint =
    draft.sustainabilityFeatures.greenRoof && draft.roofType !== "flat";

  // Roof type may legally be "butterfly" in data (legacy) but the picker only
  // exposes editableRoofTypes; cast for PillRow generic narrowing.
  const visibleRoofType = (
    draft.roofType === "butterfly" ? "gable" : draft.roofType
  ) as Exclude<RoofType, "butterfly">;

  return (
    <div className="h-full overflow-y-auto">
      <Section title="Color & Facade">
        <SubLabel>Exterior color</SubLabel>
        <div className="mt-2.5 grid grid-cols-4 gap-2">
          {colorOrder.map((name) => {
            const hex = exteriorColorMap[name];
            const active = draft.exteriorColor === name;
            return (
              <button
                key={name}
                type="button"
                onClick={() => update("exteriorColor", name)}
                className="flex flex-col items-center gap-1.5 text-[0.65rem] font-medium text-[color:var(--muted)]"
                aria-pressed={active}
              >
                <span
                  className={cn(
                    "h-12 w-full rounded-lg border border-black/10 ring-offset-2 ring-offset-[color:var(--surface)] transition",
                    active
                      ? "ring-2 ring-[color:var(--accent)]"
                      : "ring-0 hover:ring-1 hover:ring-[color:var(--border)]",
                  )}
                  style={{ backgroundColor: hex }}
                  aria-hidden
                />
                <span
                  className={cn(
                    "capitalize",
                    active && "text-[color:var(--accent-dark)]",
                  )}
                >
                  {name.replace(/-/g, " ")}
                </span>
              </button>
            );
          })}
        </div>

        <SubLabel className="mt-5">Facade material</SubLabel>
        <PillRow
          values={facadeMaterialValues}
          labels={facadeLabels}
          active={draft.facadeMaterial}
          onSelect={(v) => update("facadeMaterial", v)}
        />
      </Section>

      <Section title="Roof">
        <SubLabel>Roof type</SubLabel>
        <PillRow
          values={editableRoofTypes}
          labels={roofTypeLabels}
          active={visibleRoofType}
          onSelect={(v) => update("roofType", v)}
        />

        <SubLabel className="mt-5">Roof material</SubLabel>
        <PillRow
          values={roofMaterialValues}
          labels={roofMaterialLabels}
          active={draft.roofMaterial}
          onSelect={(v) => update("roofMaterial", v)}
        />
      </Section>

      <Section title="Sustainability">
        <div className="grid grid-cols-2 gap-2">
          {(
            Object.keys(sustainabilityLabels) as Array<
              keyof Model3D["sustainabilityFeatures"]
            >
          ).map((key) => {
            const active = draft.sustainabilityFeatures[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleFeature(key)}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition-colors",
                  active
                    ? "border-transparent bg-[color:var(--accent)] text-white"
                    : "border-[color:var(--border)] text-[color:var(--foreground)] hover:border-[color:var(--accent)]",
                )}
                aria-pressed={active}
              >
                <span className="block leading-tight">
                  {sustainabilityLabels[key]}
                </span>
                <span
                  className={cn(
                    "mt-1 block text-[0.6rem] font-medium uppercase tracking-wider",
                    active ? "text-white/75" : "text-[color:var(--muted)]",
                  )}
                >
                  {active ? "On" : "Off"}
                </span>
              </button>
            );
          })}
        </div>
        {showGreenRoofHint && (
          <p className="mt-3 text-[0.7rem] italic text-[color:var(--muted)]">
            Green roof renders on flat roofs.
          </p>
        )}
      </Section>

      <Section title="Structure" last>
        <div className="space-y-5">
          <Stepper
            label="Floors"
            value={draft.floors}
            min={1}
            max={3}
            onChange={(v) => update("floors", v)}
          />

          <div>
            <SubLabel>Body shape</SubLabel>
            <PillRow
              values={bodyStyleValues}
              labels={bodyStyleLabels}
              active={draft.bodyStyle}
              onSelect={(v) => update("bodyStyle", v)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Stepper
              label="Dormers"
              value={draft.dormerCount ?? 0}
              min={0}
              max={3}
              onChange={(v) =>
                update("dormerCount", v as Model3D["dormerCount"])
              }
              disabled={draft.roofType !== "gable"}
              hint={
                draft.roofType !== "gable"
                  ? "Gable roof only."
                  : undefined
              }
            />
            <Stepper
              label="Chimneys"
              value={draft.chimneyCount ?? 0}
              min={0}
              max={2}
              onChange={(v) =>
                update("chimneyCount", v as Model3D["chimneyCount"])
              }
            />
          </div>

          <div>
            <button
              type="button"
              onClick={() => update("hasDeck", !draft.hasDeck)}
              disabled={draft.floors < 2}
              className={cn(
                "w-full rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                draft.hasDeck
                  ? "border-transparent bg-[color:var(--accent)] text-white"
                  : "border-[color:var(--border)] text-[color:var(--foreground)] hover:border-[color:var(--accent)] disabled:hover:border-[color:var(--border)]",
              )}
              aria-pressed={Boolean(draft.hasDeck)}
            >
              <span className="block leading-tight">Outdoor deck</span>
              <span
                className={cn(
                  "mt-1 block text-[0.6rem] font-medium uppercase tracking-wider",
                  draft.hasDeck ? "text-white/75" : "text-[color:var(--muted)]",
                )}
              >
                {draft.hasDeck ? "On" : "Off"}
              </span>
            </button>
            {draft.floors < 2 && (
              <p className="mt-1.5 text-[0.7rem] italic text-[color:var(--muted)]">
                Needs at least 2 floors.
              </p>
            )}
          </div>
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
  last = false,
}: {
  title: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <section
      className={cn(
        "px-5 py-5",
        !last && "border-b border-[color:var(--border)]",
      )}
    >
      <h3 className="font-tech text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function SubLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]",
        className,
      )}
    >
      {children}
    </p>
  );
}

function PillRow<T extends string>({
  values,
  labels,
  active,
  onSelect,
}: {
  values: readonly T[];
  labels: Record<T, string>;
  active: T | undefined;
  onSelect: (value: T) => void;
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {values.map((value) => {
        const isActive = active === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onSelect(value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              isActive
                ? "border-transparent bg-[color:var(--accent)] text-white"
                : "border-[color:var(--border)] text-[color:var(--foreground)] hover:border-[color:var(--accent)]",
            )}
            aria-pressed={isActive}
          >
            {labels[value]}
          </button>
        );
      })}
    </div>
  );
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
  disabled = false,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <SubLabel>{label}</SubLabel>
      <div
        className={cn(
          "mt-2 flex items-center gap-3",
          disabled && "opacity-50",
        )}
      >
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={disabled || value <= min}
          className="h-8 w-8 rounded-full border border-[color:var(--border)] text-base font-bold text-[color:var(--foreground)] transition-colors hover:border-[color:var(--accent)] disabled:opacity-40 disabled:hover:border-[color:var(--border)]"
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <span className="min-w-[2ch] text-center text-base font-semibold tabular-nums text-[color:var(--foreground)]">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={disabled || value >= max}
          className="h-8 w-8 rounded-full border border-[color:var(--border)] text-base font-bold text-[color:var(--foreground)] transition-colors hover:border-[color:var(--accent)] disabled:opacity-40 disabled:hover:border-[color:var(--border)]"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
      {hint && (
        <p className="mt-1.5 text-[0.7rem] italic text-[color:var(--muted)]">
          {hint}
        </p>
      )}
    </div>
  );
}
