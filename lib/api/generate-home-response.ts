type GuidanceDiagnostics = {
  requestedLimit: number;
  supabaseAttempted: boolean;
  supabaseMatchCount: number;
  localFallbackUsed: boolean;
  localFallbackReason?: string | null;
  supabaseError?: string | null;
  localFallbackError?: string | null;
};

type GenerateHomeResponseOptions = {
  provider: "featherless" | "fallback";
  guidanceSource: string;
  diagnostics: GuidanceDiagnostics;
  providerError?: string;
};

function compactHeaderValue(value: string, maxLength = 180) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

export function buildGenerateHomeResponseHeaders({
  provider,
  guidanceSource,
  diagnostics,
  providerError,
}: GenerateHomeResponseOptions) {
  return {
    "x-ecohome-provider": provider,
    "x-ecohome-guidance": guidanceSource,
    ...(providerError
      ? {
          "x-ecohome-provider-error": compactHeaderValue(providerError),
        }
      : {}),
    "x-ecohome-rag-query-limit": String(diagnostics.requestedLimit),
    "x-ecohome-rag-supabase-attempted": String(diagnostics.supabaseAttempted),
    "x-ecohome-rag-supabase-match-count": String(diagnostics.supabaseMatchCount),
    "x-ecohome-rag-local-fallback-used": String(diagnostics.localFallbackUsed),
    ...(diagnostics.localFallbackReason
      ? {
          "x-ecohome-rag-fallback-reason": compactHeaderValue(
            diagnostics.localFallbackReason,
          ),
        }
      : {}),
    ...(diagnostics.supabaseError
      ? {
          "x-ecohome-rag-supabase-error": compactHeaderValue(
            diagnostics.supabaseError,
          ),
        }
      : {}),
    ...(diagnostics.localFallbackError
      ? {
          "x-ecohome-rag-local-error": compactHeaderValue(
            diagnostics.localFallbackError,
          ),
        }
      : {}),
  };
}
