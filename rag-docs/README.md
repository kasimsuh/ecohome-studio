# RAG Source Documents

Place the sustainability source material for LangChain ingestion in this folder.

Recommended first pass:

- PDF files from reputable sustainability, passive-house, climate-resilience, or residential-design sources
- files with descriptive names like `passive-cooling-guide.pdf`
- documents that are mostly text, not scanned images
- optional `.md` and `.txt` notes are also supported for quick iteration

Planned ingestion behavior:

- load PDFs first
- split with `RecursiveCharacterTextSplitter`
- attach metadata like `source`, `filename`, `category`, and `page`
- embed chunks and store them in Supabase `documents`

Notes for this repo:

- The current temporary fallback guidance still lives in `lib/rag/knowledge/`
- Keep this folder focused on real source docs that should be indexed for retrieval
- If you change embedding dimensions later, update `supabase/langchain_vector_setup.sql` to match the embedding model
- `README.md` files in this folder are ignored by the ingestion script

To ingest the current folder into Supabase after setup:

```bash
npm run rag:ingest
```
