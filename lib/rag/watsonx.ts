import type {
  GenerateHomeRequest,
  GuidanceSnippet,
} from "@/lib/domain/home-concept-schema";
import { retrieveLocalGuidance } from "@/lib/rag/local-knowledge";

const WATSONX_RERANK_MODEL = "cross-encoder/ms-marco-minilm-l-12-v2";
const WATSONX_API_VERSION = "2024-10-17";

interface RetrievedGuidanceResult {
  snippets: GuidanceSnippet[];
  source: "watsonx-rerank" | "local-heuristic";
}

interface WatsonxRerankResponse {
  results?: Array<{
    index: number;
    score: number;
  }>;
}

function getWatsonxConfig() {
  const apiKey = process.env.WATSONX_API_KEY;
  const projectId = process.env.WATSONX_PROJECT_ID;
  const baseUrl = process.env.WATSONX_URL;

  return {
    apiKey,
    projectId,
    baseUrl: baseUrl?.replace(/\/$/, ""),
  };
}

async function getWatsonxBearerToken(apiKey: string) {
  const response = await fetch("https://iam.cloud.ibm.com/identity/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ibm:params:oauth:grant-type:apikey",
      apikey: apiKey,
    }),
  });

  if (!response.ok) {
    throw new Error("Could not authenticate with watsonx.ai.");
  }

  const payload = (await response.json()) as { access_token?: string };

  if (!payload.access_token) {
    throw new Error("watsonx.ai token response was missing an access token.");
  }

  return payload.access_token;
}

async function rerankLocalGuidanceWithWatsonx({
  input,
  candidates,
}: {
  input: GenerateHomeRequest;
  candidates: GuidanceSnippet[];
}) {
  const { apiKey, projectId, baseUrl } = getWatsonxConfig();

  if (!apiKey || !projectId || !baseUrl || !candidates.length) {
    return null;
  }

  const token = await getWatsonxBearerToken(apiKey);
  const query =
    `Dream home brief: ${input.description}\n` +
    `Location: ${input.location}\n` +
    `Climate: ${input.climateRegion}\n` +
    `Budget: ${input.budgetLevel}\n` +
    "Return the guidance passages that are most useful for sustainable home concept generation.";

  const response = await fetch(
    `${baseUrl}/ml/v1/text/rerank?version=${WATSONX_API_VERSION}`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query,
        inputs: candidates.map((snippet) => ({
          text: `${snippet.title}: ${snippet.content}`,
        })),
        parameters: {
          truncate_input_tokens: 512,
          return_options: {
            inputs: true,
            top_n: Math.min(4, candidates.length),
          },
        },
        model_id: WATSONX_RERANK_MODEL,
        project_id: projectId,
      }),
    },
  );

  if (!response.ok) {
    throw new Error("watsonx.ai rerank request failed.");
  }

  const payload = (await response.json()) as WatsonxRerankResponse;
  const indexes = payload.results?.map((result) => result.index) ?? [];

  if (!indexes.length) {
    return null;
  }

  return indexes
    .map((index) => candidates[index])
    .filter((snippet): snippet is GuidanceSnippet => Boolean(snippet));
}

export async function retrieveGroundingGuidance(
  input: GenerateHomeRequest,
): Promise<RetrievedGuidanceResult> {
  const localCandidates = await retrieveLocalGuidance(input, 6);

  try {
    const reranked = await rerankLocalGuidanceWithWatsonx({
      input,
      candidates: localCandidates,
    });

    if (reranked?.length) {
      return {
        snippets: reranked,
        source: "watsonx-rerank",
      };
    }
  } catch {
    // Fall through to the local heuristic retrieval below.
  }

  return {
    snippets: localCandidates.slice(0, 4),
    source: "local-heuristic",
  };
}
