import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { OpenAIEmbeddings } from "@langchain/openai";

export const defaultEmbeddingProvider = "openai";
export const defaultEmbeddingModel = "text-embedding-3-small";
export const defaultEmbeddingDimensions = 1536;

export type SupportedEmbeddingProvider = "openai";

export interface EmbeddingProviderConfig {
  provider: SupportedEmbeddingProvider;
  model: string;
  dimensions?: number;
}

function parseOptionalPositiveInteger(
  value: string | undefined,
  name: string,
): number | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const parsedValue = Number.parseInt(value, 10);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(`Expected ${name} to be a positive integer when provided.`);
  }

  return parsedValue;
}

export function getEmbeddingProviderConfig(
  env: NodeJS.ProcessEnv = process.env,
): EmbeddingProviderConfig {
  const provider =
    (env.EMBEDDING_PROVIDER?.trim().toLowerCase() ??
      defaultEmbeddingProvider) as string;
  const model = env.EMBEDDING_MODEL?.trim() || defaultEmbeddingModel;
  const dimensions = parseOptionalPositiveInteger(
    env.EMBEDDING_DIMENSIONS,
    "EMBEDDING_DIMENSIONS",
  );

  if (provider !== "openai") {
    throw new Error(
      `Unsupported EMBEDDING_PROVIDER "${provider}". Add a provider adapter in lib/rag/embeddings.ts before using it.`,
    );
  }

  return {
    provider,
    model,
    dimensions,
  };
}

export function getEmbeddingVectorDimensions(
  env: NodeJS.ProcessEnv = process.env,
) {
  const config = getEmbeddingProviderConfig(env);

  if (config.dimensions) {
    return config.dimensions;
  }

  if (config.model === "text-embedding-3-large") {
    return 3072;
  }

  return defaultEmbeddingDimensions;
}

export function createEmbeddingModel(
  env: NodeJS.ProcessEnv = process.env,
): EmbeddingsInterface {
  const config = getEmbeddingProviderConfig(env);

  switch (config.provider) {
    case "openai": {
      const apiKey = env.OPENAI_API_KEY?.trim();

      if (!apiKey) {
        throw new Error(
          "Expected OPENAI_API_KEY when EMBEDDING_PROVIDER is openai.",
        );
      }

      return new OpenAIEmbeddings({
        apiKey,
        model: config.model,
        batchSize: 512,
        ...(config.dimensions ? { dimensions: config.dimensions } : {}),
      });
    }
  }
}
