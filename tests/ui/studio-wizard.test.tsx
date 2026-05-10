import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, vi } from "vitest";

import { StudioWizard } from "@/components/studio/studio-wizard";
import { createGeneratedHomeConcept } from "@/lib/domain/mock-data";
import { sampleStructuredHomeConcept } from "@/lib/domain/sample-structured-home";

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

  it("submits the flow through the structured API and stores an adapted project", async () => {
    const user = userEvent.setup();

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

      if (url.includes("/api/generate-home")) {
        return new Response(JSON.stringify(sampleStructuredHomeConcept));
      }

      return new Response(JSON.stringify({ error: "Unexpected endpoint" }), {
        status: 404
      });
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
      expect(pushMock).toHaveBeenCalledWith("/results/structured-demo");
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/generate-home",
      expect.objectContaining({
        method: "POST"
      })
    );
    expect(
      window.sessionStorage.getItem("ecohome:project:structured-demo")
    ).toContain("Compact warm modern for Toronto, Canada");
  });

  it("falls back to the mock concept endpoint when the structured API fails", async () => {
    const user = userEvent.setup();
    const generatedConcept = createGeneratedHomeConcept(
      {
        description:
          "A light-filled family home with a modern exterior, sustainable materials, and flexible living space.",
        location: "Toronto, Canada",
        climateRegion: "cold",
        budgetLevel: "medium",
        inspirationImages: [],
        styleAnalysis: null
      },
      "generated-test"
    );

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url.includes("/api/generate-home")) {
        return new Response(JSON.stringify({ error: "Provider failed" }), {
          status: 500
        });
      }

      if (url.includes("/api/generate-concept")) {
        return new Response(JSON.stringify(generatedConcept));
      }

      return new Response(
        JSON.stringify({
          styleAnalysis: null,
          inspirationImages: []
        })
      );
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<StudioWizard />);

    await user.type(
      screen.getByLabelText("Dream home brief"),
      "A light-filled family home with a modern exterior, sustainable materials, and flexible living space."
    );
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Generate concept" }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/results/generated-test");
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/generate-home",
      expect.objectContaining({
        method: "POST"
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/generate-concept",
      expect.objectContaining({
        method: "POST"
      })
    );
  });
});
