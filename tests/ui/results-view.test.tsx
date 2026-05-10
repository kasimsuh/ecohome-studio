import React from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { ResultsView } from "@/components/results/results-view";
import { sampleGeneratedHomeConcept } from "@/lib/domain/sample-project";

vi.mock("@react-three/fiber", () => ({
  Canvas: () => <div data-testid="mock-three-canvas" />
}));

vi.mock("@react-three/drei", () => ({
  OrbitControls: () => null
}));

describe("ResultsView", () => {
  it("renders the key results sections", () => {
    render(<ResultsView project={sampleGeneratedHomeConcept} />);

    expect(
      screen.getByRole("heading", { name: sampleGeneratedHomeConcept.heroTitle })
    ).toBeInTheDocument();
    expect(screen.getByText("Sustainability upgrades")).toBeInTheDocument();
    expect(screen.getByText("Environmental impact snapshot")).toBeInTheDocument();
    expect(screen.getByText("Visual prompt starters")).toBeInTheDocument();
    expect(screen.getByText("Generated 3D preview")).toBeInTheDocument();
    expect(screen.getByTestId("home-3d-canvas")).toBeInTheDocument();
    expect(screen.getByText("2D floor plan")).toBeInTheDocument();
    expect(screen.getByText("Living Room")).toBeInTheDocument();
    expect(screen.getByText("Ground floor")).toBeInTheDocument();
  });
});
