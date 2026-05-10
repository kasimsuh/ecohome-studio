import { loadEnvConfig } from "@next/env";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";

import {
  createEmbeddingModel,
  getEmbeddingProviderConfig,
} from "../lib/rag/embeddings";
import {
  defaultRagDocsDirectory,
  getRagChunkingConfig,
  prepareRagDocuments,
} from "../lib/rag/ingestion";
import { getSupabaseVectorStoreConfig } from "../lib/rag/supabase";

loadEnvConfig(process.cwd());

async function main() {
  const docsDirectory = process.env.RAG_DOCS_DIR?.trim() || defaultRagDocsDirectory;
  const chunkingConfig = getRagChunkingConfig();
  const embeddingConfig = getEmbeddingProviderConfig();

  const { sourceDocuments, chunkedDocuments } = await prepareRagDocuments(
    docsDirectory,
    chunkingConfig,
  );

  if (sourceDocuments.length === 0) {
    throw new Error(
      `No supported RAG documents were found in ${docsDirectory}. Add PDFs, .md, or .txt files to rag-docs/ before running ingestion.`,
    );
  }

  const vectorStore = await SupabaseVectorStore.fromExistingIndex(
    createEmbeddingModel(),
    getSupabaseVectorStoreConfig(),
  );

  await vectorStore.addDocuments(chunkedDocuments);

  const uniqueSources = new Set(sourceDocuments.map((document) => document.metadata.source));
  const pagesWithNumbers = sourceDocuments.filter(
    (document) => typeof document.metadata.page === "number",
  ).length;

  console.log("EcoHome Studio RAG ingestion complete.");
  console.log(`Directory: ${docsDirectory}`);
  console.log(
    `Embedding provider: ${embeddingConfig.provider} (${embeddingConfig.model})`,
  );
  console.log(
    `Chunking: size=${chunkingConfig.chunkSize}, overlap=${chunkingConfig.chunkOverlap}`,
  );
  console.log(`Files ingested: ${uniqueSources.size}`);
  console.log(`Loaded source documents: ${sourceDocuments.length}`);
  console.log(`Chunked documents written: ${chunkedDocuments.length}`);
  console.log(`Page-based source docs: ${pagesWithNumbers}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);

  console.error(`RAG ingestion failed: ${message}`);
  process.exitCode = 1;
});
