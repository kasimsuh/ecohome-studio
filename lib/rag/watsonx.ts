import type { GuidanceSnippet } from "@/lib/domain/home-concept-schema"

const iamTokenUrl = "https://iam.cloud.ibm.com/identity/token"
const ragQueryPath = "/v1-beta/utility_agent_tools/run/RAGQuery"
const defaultWatsonxTimeoutMs = 20_000
const maxSnippetTitleLength = 120
const maxSnippetSourceLength = 120
const maxSnippetContentLength = 320

interface WatsonxVectorIndexConfig {
  apiKey: string
  projectId: string
  url: string
  vectorIndexId: string
  timeoutMs: number
}

interface WatsonxPassageCandidate {
  title?: string
  source?: string
  filename?: string
  page?: number
  content: string
}

interface WatsonxGuidanceResult {
  snippets: GuidanceSnippet[]
  matchCount: number
}

type JsonLike =
  | string
  | number
  | boolean
  | null
  | JsonLike[]
  | { [key: string]: JsonLike }

const contentFieldKeys = [
  "pageContent",
  "page_content",
  "content",
  "text",
  "snippet",
  "passage",
  "chunk",
  "summary",
  "output",
]

const titleFieldKeys = [
  "title",
  "heading",
  "name",
  "documentName",
  "document_name",
  "category",
]

const sourceFieldKeys = [
  "source",
  "filename",
  "file_name",
  "documentId",
  "document_id",
]

const nestedFieldKeys = [
  "results",
  "documents",
  "chunks",
  "citations",
  "matches",
  "retrieval_results",
  "search_results",
  "output",
  "context",
  "data",
]

const handledScalarFieldKeys = new Set([
  ...contentFieldKeys,
  ...titleFieldKeys,
  ...sourceFieldKeys,
  "page",
  "pageNumber",
  "page_number",
])

function compactText(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, " ").trim()

  if (normalized.length <= maxLength) {
    return normalized
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`
}

function humanizeIdentifier(value: string) {
  const withoutExtension = value.replace(/\.[a-z0-9]+$/i, "")

  return withoutExtension
    .split(/[\\/_-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ")
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message.replace(/\s+/g, " ").trim()
  }

  return String(error).replace(/\s+/g, " ").trim()
}

function getNumericEnvValue(name: string, fallback: number) {
  const rawValue = process.env[name]

  if (!rawValue) {
    return fallback
  }

  const parsed = Number(rawValue)

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }

  return parsed
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "")
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function getFirstStringValue(
  record: Record<string, unknown>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const value = record[key]

    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim()
    }
  }

  return undefined
}

function getFirstNumberValue(
  record: Record<string, unknown>,
  keys: string[],
): number | undefined {
  for (const key of keys) {
    const value = record[key]

    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      return value
    }
  }

  return undefined
}

function splitCandidateContent(value: string) {
  return value
    .replace(/\r/g, "\n")
    .split(/\n{2,}|(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((segment) => segment.replace(/\s+/g, " ").trim())
    .filter((segment) => segment.length > 40)
}

function dedupeSnippets(snippets: GuidanceSnippet[], limit: number) {
  const seen = new Set<string>()

  return snippets.filter((snippet) => {
    const key = `${snippet.title}::${snippet.source}::${snippet.content}`

    if (seen.has(key) || seen.size >= limit) {
      return false
    }

    seen.add(key)
    return true
  })
}

function createSnippetTitle(candidate: WatsonxPassageCandidate, index: number) {
  if (candidate.title) {
    return compactText(candidate.title, maxSnippetTitleLength)
  }

  if (candidate.filename) {
    return compactText(
      `${humanizeIdentifier(candidate.filename)} guidance`,
      maxSnippetTitleLength,
    )
  }

  if (candidate.source) {
    return compactText(
      `${humanizeIdentifier(candidate.source)} guidance`,
      maxSnippetTitleLength,
    )
  }

  return `Watsonx guidance ${index + 1}`
}

function createSnippetSource(candidate: WatsonxPassageCandidate) {
  const baseSource = candidate.source ?? candidate.filename ?? "watsonx.ai vector index"
  const withPage = candidate.page ? `${baseSource} (p. ${candidate.page})` : baseSource

  return compactText(withPage, maxSnippetSourceLength)
}

function mapCandidatesToSnippets(
  candidates: WatsonxPassageCandidate[],
  limit: number,
) {
  return dedupeSnippets(
    candidates
      .flatMap((candidate) =>
        splitCandidateContent(candidate.content).map((content) => ({
          ...candidate,
          content,
        })),
      )
      .map((candidate, index) => ({
        title: createSnippetTitle(candidate, index),
        source: createSnippetSource(candidate),
        content: compactText(candidate.content, maxSnippetContentLength),
      }))
      .filter((snippet) => snippet.content.length > 0),
    limit,
  )
}

function collectPassageCandidates(
  value: unknown,
  candidates: WatsonxPassageCandidate[],
  seen: WeakSet<object>,
) {
  if (typeof value === "string") {
    const normalized = value.replace(/\s+/g, " ").trim()

    if (normalized.length > 40) {
      candidates.push({ content: normalized })
    }

    return
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectPassageCandidates(item, candidates, seen))
    return
  }

  if (!isRecord(value)) {
    return
  }

  if (seen.has(value)) {
    return
  }

  seen.add(value)

  const content = getFirstStringValue(value, contentFieldKeys)

  if (content && content.replace(/\s+/g, " ").trim().length > 40) {
    candidates.push({
      title: getFirstStringValue(value, titleFieldKeys),
      source: getFirstStringValue(value, sourceFieldKeys),
      filename: getFirstStringValue(value, ["filename", "file_name"]),
      page: getFirstNumberValue(value, ["page", "pageNumber", "page_number"]),
      content,
    })
  }

  for (const key of nestedFieldKeys) {
    if (key in value) {
      collectPassageCandidates(value[key], candidates, seen)
    }
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    if (handledScalarFieldKeys.has(key)) {
      continue
    }

    if (
      typeof nestedValue === "string" ||
      typeof nestedValue === "number" ||
      typeof nestedValue === "boolean" ||
      nestedValue === null
    ) {
      continue
    }

    collectPassageCandidates(nestedValue, candidates, seen)
  }
}

function buildCandidatesFromWatsonxPayload(payload: JsonLike) {
  const candidates: WatsonxPassageCandidate[] = []

  collectPassageCandidates(payload, candidates, new WeakSet())

  return candidates
}

function parseWatsonxResponse(payload: JsonLike, limit: number) {
  const candidates = buildCandidatesFromWatsonxPayload(payload)
  const snippets = mapCandidatesToSnippets(candidates, limit)

  return {
    snippets,
    matchCount: snippets.length,
  }
}

function createAbortSignal(timeoutMs: number) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  return {
    signal: controller.signal,
    clear: () => clearTimeout(timeoutId),
  }
}

async function readJsonResponse(response: Response) {
  const text = await response.text()

  if (!text.trim()) {
    return null
  }

  try {
    return JSON.parse(text) as JsonLike
  } catch {
    return text
  }
}

async function getWatsonxAccessToken(config: WatsonxVectorIndexConfig) {
  const { signal, clear } = createAbortSignal(config.timeoutMs)

  try {
    const response = await fetch(iamTokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        grant_type: "urn:ibm:params:oauth:grant-type:apikey",
        apikey: config.apiKey,
      }),
      signal,
    })

    const payload = (await readJsonResponse(response)) as
      | { access_token?: string; errorMessage?: string; error_description?: string }
      | string
      | null

    if (!response.ok) {
      const message =
        typeof payload === "string"
          ? payload
          : payload?.errorMessage ?? payload?.error_description ?? response.statusText

      throw new Error(`watsonx IAM token request failed: ${message}`)
    }

    if (!payload || typeof payload === "string" || !payload.access_token) {
      throw new Error("watsonx IAM token response did not include an access token")
    }

    return payload.access_token
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("watsonx IAM token request timed out")
    }

    throw error
  } finally {
    clear()
  }
}

export function isWatsonxVectorIndexConfigured() {
  return Boolean(
    process.env.WATSONX_API_KEY &&
      process.env.WATSONX_PROJECT_ID &&
      process.env.WATSONX_URL &&
      process.env.WATSONX_VECTOR_INDEX_ID,
  )
}

export function getWatsonxVectorIndexConfig(): WatsonxVectorIndexConfig {
  const apiKey = process.env.WATSONX_API_KEY?.trim()
  const projectId = process.env.WATSONX_PROJECT_ID?.trim()
  const url = process.env.WATSONX_URL?.trim()
  const vectorIndexId = process.env.WATSONX_VECTOR_INDEX_ID?.trim()

  if (!apiKey || !projectId || !url || !vectorIndexId) {
    throw new Error(
      "watsonx vector index fallback is not fully configured. Set WATSONX_API_KEY, WATSONX_PROJECT_ID, WATSONX_URL, and WATSONX_VECTOR_INDEX_ID.",
    )
  }

  return {
    apiKey,
    projectId,
    url: trimTrailingSlash(url),
    vectorIndexId,
    timeoutMs: getNumericEnvValue("WATSONX_TIMEOUT_MS", defaultWatsonxTimeoutMs),
  }
}

export async function retrieveWatsonxGuidance(
  query: string,
  limit: number,
): Promise<WatsonxGuidanceResult> {
  const config = getWatsonxVectorIndexConfig()
  const accessToken = await getWatsonxAccessToken(config)
  const { signal, clear } = createAbortSignal(config.timeoutMs)

  try {
    const response = await fetch(`${config.url}${ragQueryPath}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        input: query,
        config: {
          projectId: config.projectId,
          vectorIndexId: config.vectorIndexId,
        },
      }),
      signal,
    })

    const payload = await readJsonResponse(response)

    if (!response.ok) {
      const message =
        typeof payload === "string"
          ? payload
          : isRecord(payload)
            ? getFirstStringValue(payload, [
                "message",
                "error",
                "description",
                "detail",
              ]) ?? response.statusText
            : response.statusText

      throw new Error(`watsonx RAGQuery failed: ${message}`)
    }

    return parseWatsonxResponse(payload as JsonLike, limit)
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("watsonx RAGQuery timed out")
    }

    throw new Error(getErrorMessage(error))
  } finally {
    clear()
  }
}
