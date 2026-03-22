# Findings

## Discoveries & Project Requirements
- **North Star:** Full-stack Idea OS to think (chatbot), discover (trends), save ideas, and monitor metrics safely in one place.
- **Deliverables:** Integrated Dashboard with 3 tabs: Ideation, Ideas (Trends feed), and Metrics. Primary action across all is to extract core insights and "Save Idea".
- **Integrations Required:** 
  1. Claude API (Ideation Chatbot)
  2. Reddit Scraper via Modal (Trending posts)
  3. Supabase MCP (Backend, Auth, DB)
  4. Notion MCP (Optional Mirroring)
  5. YouTube API (Subscriber count)
  6. Instagram API (Follower count)

## Constraints
- **Scraper Rules:** Deduplication is mandatory (URL/title hash). Only high-signal items kept.
- **UI Constraints:** Custom designed chat UI (no pre-builts). Must feel premium and "operator-grade".
