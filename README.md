# EcoHome Studio

EcoHome Studio is a Next.js hackathon starter for an AI-powered sustainable home design assistant. It is structured around the core flow of `brief -> inspiration upload -> climate + budget context -> generated results`.

## What is included

- App Router Next.js project with TypeScript and Tailwind CSS
- Landing page, guided studio flow, and results dashboard shell
- Typed domain model for dream home inputs, recommendations, scores, and outputs
- Provider-ready mock AI layer for concept generation and inspiration analysis
- API route handlers for `analyze-inspiration`, legacy `generate-concept`, and structured `generate-home`
- Vitest and Testing Library coverage for mock generation and core UI flow

## Getting started

1. Install dependencies:

```bash
npm install
```

2. Copy the environment template if you want to wire providers later:

```bash
cp .env.example .env
```

3. Start the dev server:

```bash
npm run dev
```

4. Open `http://localhost:3000`

## AI integration points

- `lib/ai/index.ts` selects the active provider
- `lib/ai/contracts.ts` defines the expected AI capabilities
- `app/api/analyze-inspiration/route.ts` is where image analysis wiring lands
- `app/api/generate-concept/route.ts` is the legacy mock concept route currently used by the studio UI
- `app/api/generate-home/route.ts` is the newer structured generation route used for the real Featherless + RAG migration
- `lib/rag/retriever.ts` is the neutral retrieval layer that currently prefers LangChain + Supabase pgvector, can fall back to a watsonx.ai vector index if configured, and finally falls back to local seed docs

## Notes

- Generated projects are stored in session storage by default. This keeps the starter lightweight and demo-friendly.
- `/results/demo` always works as a sample output route even without generating a new concept.
- The inspiration image analysis is mocked intentionally, so you can iterate on UX before handling real upload storage or model calls.
- LangChain + Supabase pgvector remains the primary retrieval path.
- If Supabase retrieval is unavailable, you can optionally configure a watsonx.ai vector index fallback with `WATSONX_API_KEY`, `WATSONX_PROJECT_ID`, `WATSONX_URL`, and `WATSONX_VECTOR_INDEX_ID`.
