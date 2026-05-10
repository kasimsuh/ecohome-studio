# AGENTS.md

## Purpose

This file gives future coding agents durable context for working inside **EcoHome Studio**. It should help with product understanding, architecture decisions, UI consistency, and safe implementation choices without needing to rediscover the whole repo each time.

---

## Project Summary

**EcoHome Studio** is an AI-powered sustainable home design assistant.

The product goal is to help users turn a dream-home idea into a climate-aware, budget-aware, sustainability-focused concept that still feels personal, modern, and visually compelling.

The app sits at the intersection of:

- sustainable architecture
- climate adaptation
- affordability-aware design
- generative AI
- visual concepting

### Problem the product solves

Most people want homes that are beautiful, comfortable, and modern, but they do not know how to make sustainability-conscious design decisions early enough in the process.

EcoHome Studio exists to bridge the gap between:

- aspirational home design
- practical climate resilience
- environmental responsibility
- budget realism

### Current demo flow

1. User writes a dream-home brief on the landing page or in the studio.
2. User optionally uploads inspiration images.
3. User chooses location, climate region, and budget level.
4. The app generates a sustainable home concept.
5. The results page presents:
   - concept summary
   - sustainability score
   - climate and budget narratives
   - floor plan ideas
   - sustainability upgrades
   - environmental impact snapshot
   - visual prompt starters

---

## Product Direction

The long-term vision is a polished AI design assistant that can generate:

- sustainable design recommendations
- climate-aware upgrades
- budget-aware concept suggestions
- interior and exterior visual concepts
- floor plan suggestions
- lightweight visual previews

Hackathon alignment from the project idea doc:

- SDG 11: Sustainable Cities and Communities
- SDG 12: Responsible Consumption and Production
- SDG 13: Climate Action

### Important product framing

This app should feel:

- calm
- intentional
- eco-conscious
- modern
- accessible to non-experts

It should not feel like a generic enterprise dashboard.

---

## Current Tech Stack

### Implemented in the repo today

- **Next.js 15** with App Router
- **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **Zod** for request validation
- **Vitest** + Testing Library for tests
- **Session Storage** for generated project persistence in the browser

### Desired / planned stack from product direction

- **React**
- **Next.js**
- **Tailwind CSS**
- **Three.js** for future lightweight interactive 3D or richer visual previews
- **LangChain** for retrieval orchestration
- **Supabase pgvector** for vector storage and similarity search
- **Featherless.ai** for open-source model access / language generation
- a future **vision model** for inspiration image analysis
- a future **image generation model** for interior / exterior concept visuals

### Important implementation note

The repo is currently a **demo-friendly starter** with mocked AI behavior. Planned providers are part of the roadmap, not fully wired yet.

---

## Architecture Overview

### App routes

- `app/page.tsx`
  - Minimal landing page
  - Claude-inspired composition adapted to an eco / sustainability aesthetic
  - Accepts a brief and sends users into `/studio`

- `app/studio/page.tsx`
  - Guided concept-building flow
  - Uses `StudioWizard`

- `app/results/[projectId]/page.tsx`
  - Result page for generated concepts

- `app/results/layout.tsx`
  - Shared layout for results route

### API routes

- `app/api/analyze-inspiration/route.ts`
  - Accepts uploaded inspiration images
  - Validates image count and file type
  - Calls the AI provider image-analysis capability

- `app/api/generate-concept/route.ts`
  - Accepts structured concept input
  - Validates payload with Zod
  - Calls the AI provider concept-generation capability

- `app/api/generate-home/route.ts`
  - Accepts the newer structured home-generation payload
  - Calls the Featherless generation path
  - Uses the neutral retrieval layer that is being migrated to LangChain + Supabase

### AI abstraction layer

- `lib/ai/contracts.ts`
  - Source of truth for the provider contract

- `lib/ai/index.ts`
  - Chooses the active provider

- `lib/ai/mock-provider.ts`
  - Current mock implementation used by the app

- `lib/ai/featherless.ts`
  - Structured JSON generation path for the newer home-concept flow

- `lib/rag/retriever.ts`
  - Neutral retrieval entry point
  - Temporary seed-doc fallback today
  - Intended replacement target for LangChain + Supabase pgvector

#### Provider contract

The AI layer is intentionally abstracted behind:

- `analyzeInspirationImages(images)`
- `generateHomeConcept(input)`

If real providers are added later, preserve this separation unless there is a strong reason to redesign the interface.

### Domain model

- `lib/domain/types.ts`
  - Core app types like `DreamHomeInput`, `StyleAnalysis`, `GeneratedHomeConcept`

- `lib/domain/constants.ts`
  - Climate options, budget options, upload constraints

- `lib/domain/validation.ts`
  - Request validation schemas

- `lib/domain/mock-data.ts`
  - Mock concept generation and climate/budget mapping logic

- `lib/domain/sample-project.ts`
  - Demo project used by results / tests

### Client-side persistence

- `lib/session.ts`
  - Session storage key helper

Generated concepts are stored in `window.sessionStorage` using keys shaped like:

- `ecohome:project:<projectId>`

This is intentional for demo simplicity.

---

## Current UX and Design Rules

These are not generic preferences. They reflect decisions already made in the app and should usually be preserved unless the user asks for a redesign.

### Visual direction

- Primary atmosphere: **beige / warm neutral background**
- Primary text and accent color: **green**
- Feel: **soft, modern, eco-conscious, minimal**
- Layout direction: **calm whitespace first**, not crowded

### Homepage direction

The homepage is intentionally:

- sparse
- centered
- minimal
- inspired by the Claude home screen layout

Important homepage behavior:

- brief entry is the primary interaction
- text box sits in the mid-to-lower section of the page
- “View demo” lives outside the text area, beneath it
- quick-start chips are secondary

### Typography

The project uses a local **Silkscreen** font asset for techy / futuristic headings.

Font assets live in:

- `app/fonts/silkscreen/`
- `app/fonts.ts`

#### Typography rule that matters a lot

**Silkscreen should only be used for headers, titles, kickers, and other display-style labels.**

It should **not** be used for:

- long paragraphs
- body copy
- textarea content
- dense explanatory text
- most form controls

The normal reading font is the body sans stack defined in `app/globals.css`.

### Header / navbar conventions

- No logo icon next to the app name in the current header
- App name is text-only
- Shared nav lives in `components/site/site-header.tsx`

### Button conventions

- Primary buttons use the green accent fill
- Primary button text should remain white for contrast

---

## Styling and UI Implementation Notes

### Shared styling

- `app/globals.css`
  - global palette
  - font variables
  - layout helpers like `.shell`
  - display font helpers like `.font-tech`

### Shared UI pieces

- `components/ui/button.tsx`
- `components/ui/card.tsx`
- `components/ui/section-heading.tsx`

When adjusting typography:

- prefer using `font-tech` for display elements
- keep body content readable in the sans font
- avoid accidentally applying Silkscreen at the route-layout level for entire pages

### Results-page typography rule

Results pages should use Silkscreen for:

- main headings
- section titles
- short labels / kickers

Results pages should keep normal sans typography for:

- summaries
- descriptive paragraphs
- detailed recommendation text
- explanatory copy

---

## How the Current Flow Works

### Landing page

`app/page.tsx` provides a simple entry point where users can:

- type a brief
- jump to `/studio`
- open the sample result

### Studio wizard

`components/studio/studio-wizard.tsx` drives the main creation flow.

Current steps:

1. Vision
2. Inspiration
3. Context
4. Review

Behavior to preserve:

- description length is validated
- image types are validated
- upload analysis is currently mocked
- concept generation posts to `/api/generate-concept`
- successful results are stored in session storage and navigated to `/results/<projectId>`

### Results flow

`components/results/results-client.tsx` and `components/results/results-view.tsx` render generated concepts.

There is also a stable demo route:

- `/results/demo`

That route should continue to work even when no new concept has been generated.

---

## AI / Provider Notes

### Current state

The app currently uses a mock provider:

- fast enough for demo realism
- deterministic enough for testing
- structured enough to swap later

The structured generation path is now centered on:

- **Featherless.ai** for JSON generation
- a neutral `lib/rag/retriever.ts` layer
- a planned **LangChain + Supabase pgvector** retrieval stack

### If adding real providers

Keep these goals:

- preserve the `SustainableHomeAiProvider` interface when possible
- keep API routes thin
- keep validation in `lib/domain/validation.ts`
- keep generated output shaped like `GeneratedHomeConcept`
- preserve demo friendliness when provider credentials are missing

### Environment variables already present

From `.env.example`:

- `NEXT_PUBLIC_APP_NAME`
- `FEATHERLESS_API_KEY`
- `FEATHERLESS_MODEL`
- `FEATHERLESS_BASE_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `EMBEDDING_PROVIDER`
- `EMBEDDING_MODEL`
- `OPENAI_API_KEY`
- `IMAGE_MODEL_PROVIDER`
- `VISION_MODEL_PROVIDER`

### Sensible future integration path

1. Keep mock provider as fallback for the legacy flow.
2. Keep Featherless as the structured generation model.
3. Implement retrieval behind `lib/rag/retriever.ts`.
4. Use LangChain + Supabase pgvector instead of watsonx.ai.
5. Do not let missing provider credentials break the demo experience.

---

## Testing Expectations

Tests already exist and should be maintained when changing behavior.

### Unit tests

- `tests/unit/mock-provider.test.ts`
- `tests/unit/recommendations.test.ts`

### UI tests

- `tests/ui/studio-wizard.test.tsx`
- `tests/ui/results-view.test.tsx`

### Expected commands

- `npm run lint`
- `npm run test`
- `npm run build`

For UI or flow changes, at minimum run:

- `npm run lint`

Run broader checks when the change touches generation flow, validation, or rendering logic.

---

## Coding Guidelines for Future Agents

### Preserve the product shape

When editing the app, preserve these high-level truths unless the user explicitly asks otherwise:

- it is a sustainable home design assistant
- it is demo-friendly
- it is provider-ready, not provider-locked
- it should feel premium but calm
- sustainability should remain visible in both language and UI

### Prefer these implementation choices

- Keep business logic in `lib/domain/*`
- Keep provider-specific logic in `lib/ai/*`
- Keep API routes thin
- Keep the wizard flow understandable and easy to demo
- Keep results structured and easy to scan

### Avoid these mistakes

- Do not apply Silkscreen to all body text
- Do not turn the app into a generic admin dashboard
- Do not hard-wire real provider logic directly into page components
- Do not remove the demo/sample flow without a replacement
- Do not assume inspiration image uploads are backed by permanent storage yet

### When adding new features

Favor additions that strengthen the core concept:

- visual concept generation
- better climate adaptation logic
- richer sustainability scoring
- stronger budget reasoning
- floor plan or room-layout assistance
- image-analysis improvements
- future 3D / preview surfaces

---

## Good File Starting Points

If asked to make changes, these files are the most common entry points:

- `app/page.tsx` for homepage UX
- `app/studio/page.tsx` and `components/studio/studio-wizard.tsx` for the core creation flow
- `components/results/results-view.tsx` for results UX
- `lib/ai/contracts.ts` and `lib/ai/index.ts` for provider work
- `lib/domain/types.ts` and `lib/domain/validation.ts` for schema changes
- `app/globals.css` for theme, font, and shared visual rules
- `components/site/site-header.tsx` for shared navigation

---

## Short Mental Model

If you need the one-paragraph version:

> EcoHome Studio is a beige-and-green, demo-friendly Next.js app for turning dream-home ideas into sustainable, climate-aware concept outputs. It currently uses mocked AI behind a clean provider interface, stores results in session storage, and relies on Silkscreen only for headings and display labels while keeping body copy readable in a normal sans font.
