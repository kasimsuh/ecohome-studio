import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
  it("renders the key results sections and toggles the floor plan overlay", async () => {
    const user = userEvent.setup();

    render(<ResultsView project={sampleGeneratedHomeConcept} />);

    expect(
      screen.getByRole("heading", { name: sampleGeneratedHomeConcept.heroTitle })
    ).toBeInTheDocument();
    expect(screen.getByText("EcoHome Studio")).toBeInTheDocument();
    expect(screen.queryByText("Back to dashboard")).not.toBeInTheDocument();
    expect(screen.getByText("Sustainability Upgrades")).toBeInTheDocument();
    expect(screen.getByText("Environmental Impact")).toBeInTheDocument();
    expect(screen.getByText("Visual Prompt Starters")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Your sustainable dream home" })
    ).toBeInTheDocument();
    expect(screen.getByTestId("home-3d-canvas")).toBeInTheDocument();

    expect(screen.queryByTestId("floor-plan-overlay")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show floor plan" }));

    expect(screen.getByTestId("floor-plan-overlay")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hide floor plan" })).toBeInTheDocument();
    expect(screen.getByText("Living Room")).toBeInTheDocument();
    expect(screen.getByText("Ground floor")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Hide floor plan" }));

    expect(screen.queryByTestId("floor-plan-overlay")).not.toBeInTheDocument();
  });
});
