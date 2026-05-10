import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildRagFileMetadata,
  collectRagFilePaths,
  defaultChunkOverlap,
  defaultChunkSize,
  getRagChunkingConfig,
  inferRagCategory,
  loadRagSourceDocuments,
  splitRagSourceDocuments,
} from "@/lib/rag/ingestion";

describe("RAG ingestion helpers", () => {
  it("infers sustainability categories from filenames", () => {
    expect(inferRagCategory("passive-cooling-guide.pdf")).toBe("passive-cooling");
    expect(inferRagCategory("water-efficiency-notes.md")).toBe("water-efficiency");
    expect(inferRagCategory("sustainable-materials.txt")).toBe("sustainable-materials");
    expect(inferRagCategory("coastal-climate-resilience.pdf")).toBe("climate-resilience");
    expect(inferRagCategory("budget-tradeoffs.md")).toBe("budget-tradeoffs");
    expect(inferRagCategory("general-housing-notes.txt")).toBe("general");
  });

  it("builds relative metadata for loaded files", () => {
    expect(
      buildRagFileMetadata(
        "/tmp/rag-docs/water-efficiency.md",
        "/tmp/rag-docs",
        2,
      ),
    ).toEqual({
      source: "water-efficiency.md",
      filename: "water-efficiency.md",
      category: "water-efficiency",
      page: 2,
    });
  });

  it("loads supported .md and .txt files while skipping README and unsupported files", async () => {
    const rootDirectory = await mkdtemp(path.join(tmpdir(), "ecohome-rag-"));

    try {
      await writeFile(
        path.join(rootDirectory, "passive-cooling.md"),
        "Use shading, cross-ventilation, and compact building massing.",
      );
      await writeFile(
        path.join(rootDirectory, "budget-tradeoffs.txt"),
        "Prioritize envelope quality before premium finishes.",
      );
      await writeFile(path.join(rootDirectory, "README.md"), "Ignore this file.");
      await writeFile(path.join(rootDirectory, "notes.json"), '{"skip":true}');

      const nestedDirectory = path.join(rootDirectory, "nested");
      await mkdir(nestedDirectory);
      await writeFile(
        path.join(nestedDirectory, "water-efficiency.md"),
        "Harvest rainwater and reduce turf irrigation.",
      );

      const filePaths = await collectRagFilePaths(rootDirectory);
      expect(
        filePaths
          .map((filePath) => path.basename(filePath))
          .sort((left, right) => left.localeCompare(right)),
      ).toEqual([
        "budget-tradeoffs.txt",
        "passive-cooling.md",
        "water-efficiency.md",
      ]);

      const documents = await loadRagSourceDocuments(rootDirectory);
      expect(documents).toHaveLength(3);
      const documentsByFilename = new Map(
        documents.map((document) => [document.metadata.filename, document]),
      );

      expect(documentsByFilename.get("budget-tradeoffs.txt")?.metadata.category).toBe(
        "budget-tradeoffs",
      );
      expect(documentsByFilename.get("passive-cooling.md")?.metadata.category).toBe(
        "passive-cooling",
      );
      expect(
        documentsByFilename.get("water-efficiency.md")?.metadata.source,
      ).toBe(path.join("nested", "water-efficiency.md"));
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });

  it("splits source documents and assigns chunk indexes per source", async () => {
    const longText = "Passive cooling and shading strategies. ".repeat(80);
    const chunks = await splitRagSourceDocuments(
      [
        {
          pageContent: longText,
          metadata: {
            source: "passive-cooling.md",
            filename: "passive-cooling.md",
            category: "passive-cooling",
          },
        },
      ],
      { chunkSize: 120, chunkOverlap: 20 },
    );

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0]?.metadata.chunkIndex).toBe(0);
    expect(chunks[1]?.metadata.chunkIndex).toBe(1);
  });

  it("uses sensible default chunking and validates bad overrides", () => {
    expect(getRagChunkingConfig({})).toEqual({
      chunkSize: defaultChunkSize,
      chunkOverlap: defaultChunkOverlap,
    });

    expect(() =>
      getRagChunkingConfig({
        RAG_CHUNK_SIZE: "100",
        RAG_CHUNK_OVERLAP: "100",
      }),
    ).toThrow(/must be smaller/);
    expect(() =>
      getRagChunkingConfig({
        RAG_CHUNK_SIZE: "bad",
      }),
    ).toThrow(/RAG_CHUNK_SIZE/);
  });
});
