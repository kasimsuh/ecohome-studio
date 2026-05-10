import { promises as fs } from "node:fs";
import path from "node:path";

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export const defaultRagDocsDirectory = path.join(process.cwd(), "rag-docs");
export const defaultChunkSize = 1000;
export const defaultChunkOverlap = 200;
export const supportedRagFileExtensions = [".pdf", ".md", ".txt"] as const;

export interface RagChunkingConfig {
  chunkSize: number;
  chunkOverlap: number;
}

export interface RagFileMetadata {
  source: string;
  filename: string;
  category: string;
  page?: number;
}

export interface PreparedRagDocuments {
  sourceDocuments: Document<RagFileMetadata>[];
  chunkedDocuments: Document<RagFileMetadata & { chunkIndex: number }>[];
}

type SupportedRagFileExtension = (typeof supportedRagFileExtensions)[number];

function isIgnoredFilename(fileName: string) {
  const normalizedName = fileName.trim().toLowerCase();

  return (
    normalizedName === "" ||
    normalizedName.startsWith(".") ||
    normalizedName === "readme.md" ||
    normalizedName === "readme.txt"
  );
}

export function isSupportedRagFile(filePath: string) {
  const extension = path.extname(filePath).toLowerCase();

  return supportedRagFileExtensions.includes(
    extension as SupportedRagFileExtension,
  );
}

export function inferRagCategory(fileName: string) {
  const normalizedName = fileName.toLowerCase();

  if (
    normalizedName.includes("passive") ||
    normalizedName.includes("cooling") ||
    normalizedName.includes("ventilation") ||
    normalizedName.includes("shading")
  ) {
    return "passive-cooling";
  }

  if (
    normalizedName.includes("water") ||
    normalizedName.includes("rain") ||
    normalizedName.includes("harvest")
  ) {
    return "water-efficiency";
  }

  if (
    normalizedName.includes("material") ||
    normalizedName.includes("timber") ||
    normalizedName.includes("concrete")
  ) {
    return "sustainable-materials";
  }

  if (
    normalizedName.includes("climate") ||
    normalizedName.includes("resilience") ||
    normalizedName.includes("flood") ||
    normalizedName.includes("storm")
  ) {
    return "climate-resilience";
  }

  if (
    normalizedName.includes("budget") ||
    normalizedName.includes("cost") ||
    normalizedName.includes("tradeoff")
  ) {
    return "budget-tradeoffs";
  }

  return "general";
}

function normalizePageNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function buildRagFileMetadata(
  filePath: string,
  rootDirectory: string,
  page?: number,
): RagFileMetadata {
  const relativeSource = path.relative(rootDirectory, filePath) || path.basename(filePath);
  const filename = path.basename(filePath);

  return {
    source: relativeSource,
    filename,
    category: inferRagCategory(filename),
    ...(page ? { page } : {}),
  };
}

export async function collectRagFilePaths(rootDirectory = defaultRagDocsDirectory) {
  const entries = await fs.readdir(rootDirectory, { withFileTypes: true });
  const filePaths: string[] = [];

  for (const entry of entries) {
    if (isIgnoredFilename(entry.name)) {
      continue;
    }

    const entryPath = path.join(rootDirectory, entry.name);

    if (entry.isDirectory()) {
      filePaths.push(...(await collectRagFilePaths(entryPath)));
      continue;
    }

    if (entry.isFile() && isSupportedRagFile(entryPath)) {
      filePaths.push(entryPath);
    }
  }

  return filePaths.sort((left, right) => left.localeCompare(right));
}

async function loadPdfDocuments(filePath: string, rootDirectory: string) {
  const loader = new PDFLoader(filePath, { splitPages: true });
  const documents = await loader.load();

  return documents
    .filter((document) => document.pageContent.trim().length > 0)
    .map(
      (document) =>
        new Document<RagFileMetadata>({
          pageContent: document.pageContent.trim(),
          metadata: buildRagFileMetadata(
            filePath,
            rootDirectory,
            normalizePageNumber(document.metadata?.loc?.pageNumber),
          ),
        }),
    );
}

async function loadPlainTextDocuments(filePath: string, rootDirectory: string) {
  const content = (await fs.readFile(filePath, "utf8")).trim();

  if (!content) {
    return [];
  }

  return [
    new Document<RagFileMetadata>({
      pageContent: content,
      metadata: buildRagFileMetadata(filePath, rootDirectory),
    }),
  ];
}

export async function loadRagSourceDocuments(
  rootDirectory = defaultRagDocsDirectory,
) {
  const filePaths = await collectRagFilePaths(rootDirectory);
  const documents: Document<RagFileMetadata>[] = [];

  for (const filePath of filePaths) {
    const extension = path.extname(filePath).toLowerCase();

    switch (extension) {
      case ".pdf":
        documents.push(...(await loadPdfDocuments(filePath, rootDirectory)));
        break;
      case ".md":
      case ".txt":
        documents.push(...(await loadPlainTextDocuments(filePath, rootDirectory)));
        break;
      default:
        break;
    }
  }

  return documents;
}

export function getRagChunkingConfig(
  env: NodeJS.ProcessEnv = process.env,
): RagChunkingConfig {
  const rawChunkSize = env.RAG_CHUNK_SIZE?.trim();
  const rawChunkOverlap = env.RAG_CHUNK_OVERLAP?.trim();

  const chunkSize = rawChunkSize ? Number.parseInt(rawChunkSize, 10) : defaultChunkSize;
  const chunkOverlap = rawChunkOverlap
    ? Number.parseInt(rawChunkOverlap, 10)
    : defaultChunkOverlap;

  if (!Number.isInteger(chunkSize) || chunkSize <= 0) {
    throw new Error("Expected RAG_CHUNK_SIZE to be a positive integer.");
  }

  if (!Number.isInteger(chunkOverlap) || chunkOverlap < 0) {
    throw new Error("Expected RAG_CHUNK_OVERLAP to be a non-negative integer.");
  }

  if (chunkOverlap >= chunkSize) {
    throw new Error("RAG_CHUNK_OVERLAP must be smaller than RAG_CHUNK_SIZE.");
  }

  return { chunkSize, chunkOverlap };
}

export async function splitRagSourceDocuments(
  documents: Document<RagFileMetadata>[],
  config: RagChunkingConfig = getRagChunkingConfig(),
) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: config.chunkSize,
    chunkOverlap: config.chunkOverlap,
  });
  const splitDocuments = await splitter.splitDocuments(documents);
  const chunkIndexes = new Map<string, number>();

  return splitDocuments.map((document) => {
    const metadata = document.metadata as RagFileMetadata;
    const sourceKey = `${metadata.source}::${metadata.page ?? "full"}`;
    const nextChunkIndex = chunkIndexes.get(sourceKey) ?? 0;
    chunkIndexes.set(sourceKey, nextChunkIndex + 1);

    return new Document<RagFileMetadata & { chunkIndex: number }>({
      pageContent: document.pageContent.trim(),
      metadata: {
        source: metadata.source,
        filename: metadata.filename,
        category: metadata.category,
        ...(typeof metadata.page === "number" ? { page: metadata.page } : {}),
        chunkIndex: nextChunkIndex,
      },
    });
  });
}

export async function prepareRagDocuments(
  rootDirectory = defaultRagDocsDirectory,
  config: RagChunkingConfig = getRagChunkingConfig(),
): Promise<PreparedRagDocuments> {
  const sourceDocuments = await loadRagSourceDocuments(rootDirectory);

  if (sourceDocuments.length === 0) {
    return {
      sourceDocuments,
      chunkedDocuments: [],
    };
  }

  return {
    sourceDocuments,
    chunkedDocuments: await splitRagSourceDocuments(sourceDocuments, config),
  };
}
