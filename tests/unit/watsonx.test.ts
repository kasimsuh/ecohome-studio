import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  isWatsonxVectorIndexConfigured,
  retrieveWatsonxGuidance,
} from "@/lib/rag/watsonx"

const originalEnv = {
  apiKey: process.env.WATSONX_API_KEY,
  projectId: process.env.WATSONX_PROJECT_ID,
  url: process.env.WATSONX_URL,
  vectorIndexId: process.env.WATSONX_VECTOR_INDEX_ID,
  timeoutMs: process.env.WATSONX_TIMEOUT_MS,
}

describe("watsonx vector index fallback", () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock)
    process.env.WATSONX_API_KEY = "test-api-key"
    process.env.WATSONX_PROJECT_ID = "test-project-id"
    process.env.WATSONX_URL = "https://us-south.ml.cloud.ibm.com"
    process.env.WATSONX_VECTOR_INDEX_ID = "test-vector-index-id"
    process.env.WATSONX_TIMEOUT_MS = "5000"
    fetchMock.mockReset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    process.env.WATSONX_API_KEY = originalEnv.apiKey
    process.env.WATSONX_PROJECT_ID = originalEnv.projectId
    process.env.WATSONX_URL = originalEnv.url
    process.env.WATSONX_VECTOR_INDEX_ID = originalEnv.vectorIndexId
    process.env.WATSONX_TIMEOUT_MS = originalEnv.timeoutMs
  })

  it("detects when watsonx fallback is configured", () => {
    expect(isWatsonxVectorIndexConfigured()).toBe(true)
  })

  it("retrieves and normalizes snippets from watsonx RAGQuery output", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: "iam-token" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            output: [
              {
                title: "Passive cooling guidance",
                source: "Passive-Design-Guide.pdf",
                page: 14,
                text:
                  "Use generous overhangs and cross-ventilation to keep shared areas comfortable in hot climates.",
              },
              {
                filename: "ONTARIO_RWH_GUIDELINES_2010.pdf",
                page: 12,
                content:
                  "Capture rainwater in a right-sized storage tank and keep the maintenance approach simple for homeowners.",
              },
            ],
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      )

    const result = await retrieveWatsonxGuidance(
      "Sustainable residential design recommendations for a tropical family home in Accra.",
      4,
    )

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(result.matchCount).toBe(2)
    expect(result.snippets).toHaveLength(2)
    expect(result.snippets[0].title).toBe("Passive cooling guidance")
    expect(result.snippets[0].source).toBe("Passive-Design-Guide.pdf (p. 14)")
    expect(result.snippets[1].title.toLowerCase()).toContain(
      "ontario rwh guidelines 2010",
    )
  })
})
