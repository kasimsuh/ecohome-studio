-- EcoHome Studio LangChain + Supabase pgvector setup.
--
-- This script follows the LangChain/Supabase "documents" + "match_documents"
-- pattern so we can use SupabaseVectorStore without custom adapters.
--
-- Important:
-- - The default vector size here is 1536, which matches `text-embedding-3-small`
--   and other 1536-dimension embeddings.
-- - If you switch embedding models, update BOTH `embedding vector(1536)` and the
--   `query_embedding vector(1536)` function argument below to the same dimension.

create extension if not exists vector;
create extension if not exists pgcrypto;

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  content text not null check (char_length(content) > 0),
  metadata jsonb not null default '{}'::jsonb,
  embedding vector(1536) not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists documents_metadata_idx
  on documents using gin (metadata);

create or replace function match_documents (
  query_embedding vector(1536),
  match_count int default null,
  filter jsonb default '{}'::jsonb
) returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
#variable_conflict use_column
begin
  return query
  select
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where documents.metadata @> filter
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$$;
