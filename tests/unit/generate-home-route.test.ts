import { POST } from "@/app/api/generate-home/route";

describe("POST /api/generate-home", () => {
  const originalApiKey = process.env.FEATHERLESS_API_KEY;
  const originalModel = process.env.FEATHERLESS_MODEL;

  afterEach(() => {
    process.env.FEATHERLESS_API_KEY = originalApiKey;
    process.env.FEATHERLESS_MODEL = originalModel;
  });

  it("returns a structured fallback concept when provider credentials are missing", async () => {
    delete process.env.FEATHERLESS_API_KEY;
    delete process.env.FEATHERLESS_MODEL;

    const request = new Request("http://localhost/api/generate-home", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        description:
          "A compact sustainable home in Toronto with flexible living space, durable materials, and passive solar gain.",
        location: "Toronto, Canada",
        climateRegion: "cold",
        budgetLevel: "medium",
        inspirationImages: []
      })
    });

    const response = await POST(request);
    const payload = (await response.json()) as {
      projectId: string;
      floorPlan?: { rooms: unknown[] };
      model3D?: { floors: number };
    };

    expect(response.status).toBe(200);
    expect(payload.projectId).toMatch(/^eco-/);
    expect(payload.floorPlan?.rooms.length).toBeGreaterThan(0);
    expect(payload.model3D?.floors).toBeGreaterThan(0);
    expect(response.headers.get("x-ecohome-provider")).toBe("fallback");
    expect(response.headers.get("x-ecohome-provider-error")).toContain(
      "Featherless credentials are not configured",
    );
    expect(response.headers.get("x-ecohome-rag-local-fallback-used")).toBe("true");
  });
});
