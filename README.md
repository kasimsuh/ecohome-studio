# EcoHome Studio

EcoHome Studio is a Next.js hackathon starter for an AI-powered sustainable home design assistant. It is structured around the core flow of `brief -> inspiration upload -> climate + budget context -> generated results`.

## What is included

- App Router Next.js project with TypeScript and Tailwind CSS
- Landing page, guided studio flow, and results dashboard shell
- Typed domain model for dream home inputs, recommendations, scores, and outputs
- Provider-ready mock AI layer for concept generation and inspiration analysis
- API route handlers for `analyze-inspiration` and `generate-concept`
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

## Provider integration points

- `lib/ai/index.ts` selects the active provider
- `lib/ai/contracts.ts` defines the expected AI capabilities
- `app/api/analyze-inspiration/route.ts` is where image analysis wiring lands
- `app/api/generate-concept/route.ts` is where text generation and recommendation logic can be swapped from mock to real providers

## Notes

- Generated projects are stored in session storage by default. This keeps the starter lightweight and demo-friendly.
- `/results/demo` always works as a sample output route even without generating a new concept.
- The inspiration image analysis is mocked intentionally, so you can iterate on UX before handling real upload storage or model calls.
