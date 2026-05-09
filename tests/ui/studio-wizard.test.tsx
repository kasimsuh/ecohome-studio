import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, vi } from "vitest";

import { StudioWizard } from "@/components/studio/studio-wizard";
import { createGeneratedHomeConcept } from "@/lib/domain/mock-data";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock
  })
}));

describe("StudioWizard", () => {
  beforeEach(() => {
    pushMock.mockReset();
    window.sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("shows a validation message if the brief is too short", async () => {
    const user = userEvent.setup();
    render(<StudioWizard />);

    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Describe the dream home"
    );
  });

  it("rejects unsupported upload file types", async () => {
    const user = userEvent.setup({ applyAccept: false });
    render(<StudioWizard />);

    await user.type(
      screen.getByLabelText("Dream home brief"),
      "A warm and bright family home with garden access, durable materials, and a flexible office."
    );
    await user.click(screen.getByRole("button", { name: "Continue" }));

    const fileInput = screen.getByLabelText("Upload inspiration images");
    const invalidFile = new File(["fake"], "plan.pdf", {
      type: "application/pdf"
    });

    await user.upload(fileInput, invalidFile);

    expect(screen.getByText(/Only JPG, PNG, and WEBP/)).toBeInTheDocument();
  });

  it("submits the flow and stores the generated project", async () => {
    const user = userEvent.setup();
    const generatedConcept = createGeneratedHomeConcept(
      {
        description:
          "A light-filled family home with a modern exterior, sustainable materials, and flexible living space.",
        location: "Toronto, Canada",
        climateRegion: "cold",
        budgetLevel: "medium",
        inspirationImages: [
          {
            id: "img-1",
            name: "warm-wood-modern-home.jpg",
            type: "image/jpeg",
            size: 1000
          }
        ],
        styleAnalysis: {
          aesthetic: "warm organic contemporary",
          palette: ["oak", "linen", "sage"],
          materials: ["light timber", "tile"],
          lighting: ["daylit living"],
          layoutPatterns: ["garden-facing living"],
          summary: "Warm organic contemporary inspiration."
        }
      },
      "generated-test"
    );

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url.includes("/api/analyze-inspiration")) {
        return new Response(
          JSON.stringify({
            styleAnalysis: {
              aesthetic: "warm organic contemporary",
              palette: ["oak", "linen", "sage"],
              materials: ["light timber", "tile"],
              lighting: ["daylit living"],
              layoutPatterns: ["garden-facing living"],
              summary: "Warm organic contemporary inspiration."
            },
            inspirationImages: [
              {
                id: "img-1",
                name: "warm-wood-modern-home.jpg",
                type: "image/jpeg",
                size: 1000
              }
            ]
          })
        );
      }

      return new Response(JSON.stringify(generatedConcept));
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<StudioWizard />);

    await user.type(
      screen.getByLabelText("Dream home brief"),
      "A light-filled family home with a modern exterior, sustainable materials, and flexible living space."
    );
    await user.click(screen.getByRole("button", { name: "Continue" }));

    const fileInput = screen.getByLabelText("Upload inspiration images");
    const validFile = new File(["fake"], "warm-wood-modern-home.jpg", {
      type: "image/jpeg"
    });
    await user.upload(fileInput, validFile);

    await waitFor(() =>
      expect(screen.getByText("warm organic contemporary")).toBeInTheDocument()
    );

    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Generate concept" }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/results/generated-test");
    });

    expect(window.sessionStorage.getItem("ecohome:project:generated-test")).toContain(
      "generated-test"
    );
  });
});
