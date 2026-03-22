# Project Constitution (Data Schema)

## Data Schemas
(Payload Shape Definition)

### 1. Saved Ideas (Supabase Table: `ideas`)
```json
{
  "id": "uuid (Primary Key)",
  "content": "text (Full context/chat log or raw idea)",
  "core_insight": "text (Distilled insight)",
  "source": "string (e.g., 'ideation_chat', 'reddit_trend', 'manual')",
  "source_url": "string (Optional URL if from trend)",
  "notion_page_id": "string (Optional, ID of mirrored Notion page)",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### 2. Scraped Trends (Supabase Table: `trends_reddit`)
```json
{
  "id": "uuid (Primary Key)",
  "url": "string (Unique, used for deduplication)",
  "title_hash": "string (Unique, alternative dedup)",
  "title": "string",
  "score": "integer",
  "engagement_metrics": "jsonb (e.g., comments count)",
  "scraped_at": "timestamp",
  "status": "string (e.g., 'new', 'saved_as_idea')"
}
```

### 3. Metrics Snapshots (Supabase Table: `platform_metrics`)
```json
{
  "id": "uuid (Primary Key)",
  "platform": "string ('youtube', 'instagram')",
  "subscriber_follower_count": "integer",
  "recorded_at": "timestamp"
}
```

## Behavioral Rules
- **Tone**: Clear, concise, intelligent, operator-grade, calm. No fluff.
- **Purpose**: System is an OS, not a toy. Chat exists to help think, learn, and clarify ideas.
- **Action-Oriented**: Always provide a path towards saving an idea.
- **Simplicity**: Never overwhelm with raw data — summarize and structure.
- **Value**: Treat every saved idea as a long-term asset.

## Architectural Invariants
- **Source of Truth**: Supabase is the undisputed single source of truth for all data (ideas, trends, chat context, metrics).
- **Secondary Mirror**: Notion is an optional sync target and is not authoritative.
- **Deduplication**: Trends must be deduplicated by URL or Title Hash, updating existing instead of creating continuously.
- **Scraper**: Runs on Modal every 24 hours explicitly.

## Maintenance Log
- **Phase 1 Initialization**: Defined Data Schema
- **Phase 2 Link**: Setup and validated integration layers (OpenRouter Claude, Notion/Supabase MCP, Web Scrapers).
- **Phase 3-4 Architect & Stylize**: Engineered Supabase Database. Wired Live Postgres tables into the React Dashboard UI for dynamic rendering. 
- **Phase 5 Trigger**: Script wrappers authored for Modal Deployment. Frontend ready for Vercel production hosting.
