import React from "react";
import { render, screen } from "@testing-library/react";

import { ResultsView } from "@/components/results/results-view";
import { sampleGeneratedHomeConcept } from "@/lib/domain/sample-project";

describe("ResultsView", () => {
  it("renders the key results sections", () => {
    render(<ResultsView project={sampleGeneratedHomeConcept} />);

    expect(
      screen.getByRole("heading", { name: sampleGeneratedHomeConcept.heroTitle })
    ).toBeInTheDocument();
    expect(screen.getByText("Sustainability upgrades")).toBeInTheDocument();
    expect(screen.getByText("Environmental impact snapshot")).toBeInTheDocument();
    expect(screen.getByText("Visual prompt starters")).toBeInTheDocument();
  });
});
