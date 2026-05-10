import { OpenAIEmbeddings } from "@langchain/openai";
import { describe, expect, it } from "vitest";

import {
  createEmbeddingModel,
  defaultEmbeddingDimensions,
  defaultEmbeddingModel,
  getEmbeddingProviderConfig,
  getEmbeddingVectorDimensions,
} from "@/lib/rag/embeddings";

describe("embedding helpers", () => {
  it("defaults to the OpenAI embedding configuration", () => {
    expect(
      getEmbeddingProviderConfig({
        OPENAI_API_KEY: "test-key",
      }),
    ).toEqual({
      provider: "openai",
      model: defaultEmbeddingModel,
      dimensions: undefined,
    });
    expect(
      getEmbeddingVectorDimensions({
        OPENAI_API_KEY: "test-key",
      }),
    ).toBe(defaultEmbeddingDimensions);
  });

  it("supports explicit dimensions for embedding models", () => {
    expect(
      getEmbeddingProviderConfig({
        EMBEDDING_PROVIDER: "openai",
        EMBEDDING_MODEL: "text-embedding-3-small",
        EMBEDDING_DIMENSIONS: "1024",
        OPENAI_API_KEY: "test-key",
      }),
    ).toEqual({
      provider: "openai",
      model: "text-embedding-3-small",
      dimensions: 1024,
    });
    expect(
      getEmbeddingVectorDimensions({
        EMBEDDING_PROVIDER: "openai",
        EMBEDDING_MODEL: "text-embedding-3-small",
        EMBEDDING_DIMENSIONS: "1024",
        OPENAI_API_KEY: "test-key",
      }),
    ).toBe(1024);
  });

  it("rejects unsupported providers and invalid dimensions", () => {
    expect(() =>
      getEmbeddingProviderConfig({
        EMBEDDING_PROVIDER: "featherless",
      }),
    ).toThrow(/Unsupported EMBEDDING_PROVIDER/);
    expect(() =>
      getEmbeddingProviderConfig({
        EMBEDDING_PROVIDER: "openai",
        EMBEDDING_DIMENSIONS: "zero",
      }),
    ).toThrow(/EMBEDDING_DIMENSIONS/);
  });

  it("creates an OpenAI embeddings client when env is complete", () => {
    const model = createEmbeddingModel({
      EMBEDDING_PROVIDER: "openai",
      EMBEDDING_MODEL: "text-embedding-3-small",
      OPENAI_API_KEY: "test-key",
    });

    expect(model).toBeInstanceOf(OpenAIEmbeddings);
  });
});
