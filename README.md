# EcoHome Studio

EcoHome Studio is a Next.js app for turning a dream-home brief into a compact, sustainability-focused home concept. The product is aimed at an early design phase: helping a user combine atmosphere, climate, budget, materials, and resilience into a single concept that feels both aspirational and grounded.

In its current state, the app already supports:

- a minimal landing page with a prompt-first entry point
- a guided studio flow for brief, inspiration, climate, and budget
- inspiration image analysis based on uploaded image pixels
- structured home-concept generation through Featherless.ai
- retrieval-augmented sustainability guidance with layered fallbacks
- a results experience with a detailed report rail and interactive 3D preview
- LangChain ingestion tooling for sustainability source documents

## Current Product Flow

The app currently follows this path:

1. The user starts on `/` and writes a home-design brief.
2. The user moves into `/studio`.
3. In the studio, the user can:
   - refine the brief
   - upload inspiration images
   - set location, climate region, and budget
4. The app analyzes uploaded images for palette, materials, and style cues.
5. The app generates a structured home concept through `/api/generate-home`.
6. The results are stored in browser session storage.
7. The user is routed to `/results/[projectId]`.
8. The results page shows:
   - concept summary
   - sustainability score
   - climate and budget narratives
   - design direction
   - upgrades
   - environmental impact
   - visual prompt starters
   - an interactive 3D home preview when geometry is available

There is also a permanent `/results/demo` route for a sample result.

## What Is Real vs Legacy

The project contains both the newer structured generation path and an older legacy mock path.

### Current primary path

- `app/api/generate-home/route.ts`
- `lib/ai/featherless.ts`
- `lib/rag/retriever.ts`
- `lib/domain/home-concept-schema.ts`
- `components/studio/studio-wizard.tsx`

This is the path the studio now prefers.

### Legacy fallback path

- `app/api/generate-concept/route.ts`
- `lib/ai/mock-provider.ts`
- `lib/domain/mock-data.ts`

This still exists as a demo-safe fallback if the structured API path fails.

## Tech Stack

### App and UI

- Next.js 15 with App Router
- React 19
- TypeScript
- Tailwind CSS v4

### AI and retrieval

- Featherless.ai via OpenAI-compatible API for structured JSON generation
- LangChain for ingestion and vector-store integration
- Supabase pgvector as the primary vector retrieval path
- Optional watsonx.ai vector-index fallback if Supabase retrieval is unavailable
- Local markdown seed-doc fallback if both remote retrieval paths fail

### 3D and visual rendering

- `three`
- `@react-three/fiber`
- `@react-three/drei`
- SVG-based floor plan rendering

### Validation and testing

- Zod
- Vitest
- Testing Library

## Architecture Overview

### Routes

- `app/page.tsx`
  Landing page with a minimal Claude-inspired composition and a prompt box.

- `app/studio/page.tsx`
  The guided concept-building flow.

- `app/results/[projectId]/page.tsx`
  Loads a generated project from session storage and renders the results experience.

### API routes

- `app/api/analyze-inspiration/route.ts`
  Accepts uploaded images, validates them, runs pixel-based inspiration analysis, and falls back to filename-based mock analysis if needed.

- `app/api/generate-home/route.ts`
  Validates the structured request, retrieves sustainability context, calls Featherless, and returns a structured payload. If generation fails, it returns a structured fallback concept instead.

- `app/api/generate-concept/route.ts`
  The older mock route still used as a backup path.

## Generation Pipeline

The newer generation pipeline looks like this:

1. `StudioWizard` builds a `GenerateHomeRequest`
2. `/api/generate-home` validates the payload with Zod
3. `lib/rag/retriever.ts` retrieves guidance
4. `lib/ai/featherless.ts` sends the user brief plus retrieved context to Featherless
5. Featherless is asked to return strict JSON only
6. The output is normalized and validated against the home-concept schema
7. The structured payload is stored in session storage
8. The results page adapts that payload for the current report UI

### Retrieval fallback order

The current retrieval order is:

1. Supabase pgvector via LangChain
2. watsonx.ai vector index, if configured
3. local seed guidance markdown files

This makes the app resilient for demos even when external providers are slow or unavailable.

## Inspiration Analysis

Inspiration image handling is no longer filename-only.

`lib/inspiration/analyze-uploaded-images.ts` uses `sharp` to inspect uploaded image pixels and infer:

- aesthetic direction
- palette
- likely material cues
- lighting character
- layout hints
- a short summary

If the pixel-based analyzer fails, the API falls back to the older provider-based mock analysis.

## Results Experience

The results UI is split into two major pieces:

- `components/results/results-rail.tsx`
  The report-style side rail with summaries, scores, narratives, and upgrades

- `components/results/home-3d-preview.tsx`
  The interactive 3D view and floor-plan overlay

`components/results/results-view.tsx` lazy-loads the heavy 3D view so the report rail can appear faster.

## Session Storage

Generated concepts are intentionally stored in browser session storage for demo simplicity.

- Storage helper: `lib/session.ts`
- Key shape: `ecohome:project:<projectId>`

This means:

- generated concepts are not persisted across browsers or devices
- a cleared session removes generated results
- the demo route is useful when no stored result exists

## Domain Model

The main structured schema lives in:

- `lib/domain/home-concept-schema.ts`

It defines:

- request payloads
- the canonical structured home concept
- the generated home concept payload returned by the API

Important concept sections include:

- `conceptSummary`
- `sustainabilityScore`
- `floorPlan`
- `model3D`
- `upgrades`
- `materials`
- `visualPrompts`
- `sources`

There is also an adapter layer in:

- `lib/domain/structured-home-adapter.ts`

That adapter lets the newer structured payload feed the older results presentation model without rewriting the entire UI at once.

## Project Structure

### App layer

```text
app/
  api/
    analyze-inspiration/
    generate-concept/
    generate-home/
  results/
    [projectId]/
  studio/
  fonts/
  globals.css
  layout.tsx
  page.tsx
```

### UI components

```text
components/
  results/
    floor-plan-2d.tsx
    home-3d-preview.tsx
    results-client.tsx
    results-rail.tsx
    results-view.tsx
  site/
    site-brand.tsx
    site-footer.tsx
    site-header.tsx
  studio/
    studio-wizard.tsx
    studio-wizard-panels.tsx
  ui/
    button.tsx
    card.tsx
    section-heading.tsx
```

### Business logic and providers

```text
lib/
  ai/
    contracts.ts
    featherless.ts
    index.ts
    mock-provider.ts
  api/
    generate-home-response.ts
  domain/
    constants.ts
    home-concept-schema.ts
    home-geometry.ts
    mock-data.ts
    sample-project.ts
    sample-structured-home.ts
    structured-home-adapter.ts
    structured-home-fallback.ts
    types.ts
    validation.ts
  inspiration/
    analyze-uploaded-images.ts
  rag/
    embeddings.ts
    ingestion.ts
    local-knowledge.ts
    retriever.ts
    supabase.ts
    watsonx.ts
    knowledge/
  session.ts
```

### Tooling and infrastructure

```text
scripts/
  ingest-rag-docs.ts

supabase/
  langchain_vector_setup.sql

tests/
  ui/
  unit/
```

## Styling and Design Direction

The current design language is intentional and should be treated as part of the project identity:

- beige and warm neutral backgrounds
- green as the primary text and accent color
- a minimal, calm homepage with a centered prompt flow
- Silkscreen as a display font for headings and labels only
- regular body sans font for readable paragraphs and form text

The local Silkscreen font lives in:

- `app/fonts/silkscreen/`
- `app/fonts.ts`

## Environment Variables

Copy `.env.example` into `.env` before wiring providers:

```bash
cp .env.example .env
```

Current env variables include:

- `FEATHERLESS_API_KEY`
- `FEATHERLESS_MODEL`
- `FEATHERLESS_BASE_URL`
- `FEATHERLESS_TIMEOUT_MS`
- `FEATHERLESS_MAX_TOKENS`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `EMBEDDING_PROVIDER`
- `EMBEDDING_MODEL`
- `EMBEDDING_DIMENSIONS`
- `OPENAI_API_KEY`
- `OPENAI_EMBEDDING_TIMEOUT_MS`
- `WATSONX_API_KEY`
- `WATSONX_PROJECT_ID`
- `WATSONX_URL`
- `WATSONX_VECTOR_INDEX_ID`
- `WATSONX_TIMEOUT_MS`
- `RAG_SUPABASE_TIMEOUT_MS`
- `RAG_DOCS_DIR`
- `RAG_CHUNK_SIZE`
- `RAG_CHUNK_OVERLAP`

### Practical note

You do not need every provider configured for the app to run. The project is designed to degrade gracefully:

- Featherless missing: structured fallback concept is returned
- Supabase unavailable: retrieval falls back
- watsonx unavailable: retrieval falls back again

## Supabase and RAG Setup

If you want the primary RAG path working end-to-end:

1. Create a Supabase project
2. Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to `.env`
3. Run the SQL in `supabase/langchain_vector_setup.sql`
4. Add source PDFs, markdown files, or text files to `rag-docs/`
5. Configure embeddings env vars
6. Run:

```bash
npm run rag:ingest
```

The ingestion script:

- loads PDF, `.md`, and `.txt` files
- splits them with `RecursiveCharacterTextSplitter`
- tags metadata like source, filename, category, and page
- writes the resulting chunks into Supabase through LangChain

## Local Development

Install dependencies:

```bash
npm install
```

Start the app:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Scripts

- `npm run dev`
  Start the Next.js development server

- `npm run build`
  Build the production app

- `npm run start`
  Run the built app

- `npm run lint`
  Lint the repository

- `npm run test`
  Run all tests once

- `npm run test:watch`
  Run tests in watch mode

- `npm run rag:ingest`
  Ingest RAG source documents into Supabase

## Testing

Tests currently cover:

- schema validation
- retrieval behavior
- Featherless normalization and fallback handling
- inspiration image analysis
- generation route behavior
- studio flow
- results rendering
- 3D geometry helpers

Run the main checks with:

```bash
npm run lint
npm run test
npm run build
```

## Current State Summary

Right now the project is beyond a pure mock starter, but not yet a fully productionized system.

Implemented today:

- real structured generation endpoint
- real retrieval abstraction
- real LangChain ingestion setup
- real pixel-based inspiration analysis
- real 3D result rendering
- graceful fallbacks across providers

Still intentionally lightweight or transitional:

- browser-only session storage persistence
- legacy `generate-concept` path still present as backup
- structured payload still adapted into an older report model for parts of the results UI
- external providers may fall back depending on credentials, latency, quota, or environment

That tradeoff is deliberate: the app is optimized to stay demoable even when some AI infrastructure is unavailable.
