import { describe, expect, it } from "vitest";

import {
  createSupabaseRagClient,
  getSupabaseRagConfig,
  getSupabaseVectorStoreConfig,
  LANGCHAIN_DOCUMENTS_TABLE,
  LANGCHAIN_MATCH_FUNCTION,
} from "@/lib/rag/supabase";

const testEnv = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
};

describe("Supabase RAG config", () => {
  it("returns the LangChain-compatible table and function names", () => {
    expect(getSupabaseRagConfig(testEnv)).toEqual({
      url: "https://example.supabase.co",
      serviceRoleKey: "service-role-key",
      tableName: LANGCHAIN_DOCUMENTS_TABLE,
      queryName: LANGCHAIN_MATCH_FUNCTION,
    });
  });

  it("creates a vector-store config with a Supabase client", () => {
    const config = getSupabaseVectorStoreConfig(testEnv);

    expect(config.tableName).toBe(LANGCHAIN_DOCUMENTS_TABLE);
    expect(config.queryName).toBe(LANGCHAIN_MATCH_FUNCTION);
    expect(config.client).toBeTruthy();
  });

  it("fails clearly when required env vars are missing", () => {
    expect(() => getSupabaseRagConfig({})).toThrow(/SUPABASE_URL/);
    expect(() =>
      createSupabaseRagClient({
        SUPABASE_URL: "https://example.supabase.co",
      }),
    ).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });
});
