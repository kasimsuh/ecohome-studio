import type { SupabaseLibArgs } from "@langchain/community/vectorstores/supabase";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const LANGCHAIN_DOCUMENTS_TABLE = "documents";
export const LANGCHAIN_MATCH_FUNCTION = "match_documents";

export interface SupabaseRagConfig {
  url: string;
  serviceRoleKey: string;
  tableName: string;
  queryName: string;
}

function readRequiredEnvVar(env: NodeJS.ProcessEnv, name: string) {
  const value = env[name]?.trim();

  if (!value) {
    throw new Error(`Expected ${name} for Supabase-backed RAG.`);
  }

  return value;
}

export function getSupabaseRagConfig(
  env: NodeJS.ProcessEnv = process.env,
): SupabaseRagConfig {
  return {
    url: readRequiredEnvVar(env, "SUPABASE_URL"),
    serviceRoleKey: readRequiredEnvVar(env, "SUPABASE_SERVICE_ROLE_KEY"),
    tableName: LANGCHAIN_DOCUMENTS_TABLE,
    queryName: LANGCHAIN_MATCH_FUNCTION,
  };
}

export function createSupabaseRagClient(
  env: NodeJS.ProcessEnv = process.env,
): SupabaseClient {
  const { url, serviceRoleKey } = getSupabaseRagConfig(env);

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function getSupabaseVectorStoreConfig(
  env: NodeJS.ProcessEnv = process.env,
): Pick<SupabaseLibArgs, "client" | "tableName" | "queryName"> {
  const { tableName, queryName } = getSupabaseRagConfig(env);

  return {
    client: createSupabaseRagClient(env),
    tableName,
    queryName,
  };
}
