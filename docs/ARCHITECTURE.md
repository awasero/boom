# Boom Architecture

## Overview

Boom is an AI-powered builder for websites and presentation decks. Users describe what they want in natural language, Claude generates the code, and the result deploys to Cloudflare Pages.

## System Flow

```
User → Chat UI → API Route → Claude AI → FILE: blocks → Preview
                                                      → GitHub commit
                                                      → Cloudflare deploy
```

## Auth Flow

1. User clicks "Continue with GitHub" on `/login`
2. Supabase redirects to GitHub OAuth
3. GitHub redirects back to `/api/auth/callback`
4. Supabase exchanges code for session (cookie-based)
5. Middleware refreshes session on every request
6. `handle_new_user()` trigger creates user profile in `public.users`

## AI Architecture

### Model Routing
- **Opus**: Initial builds (full page generation, highest quality)
- **Sonnet**: Edits, SEO, mobile, design commands (structural changes)
- **Haiku**: /text, /tweak commands (simple, surgical changes)

### FILE: Block Protocol
AI outputs code in a structured format:
```
FILE: index.html
```html
<!DOCTYPE html>...
```
```
The parser extracts files from this format and updates the preview/repo.

### SSE Streaming
All AI routes use Server-Sent Events for real-time streaming:
- `data: {"text": "chunk"}` for content
- `data: {"error": "message"}` for errors
- `data: [DONE]` to signal completion

## Database Schema

### Tables
- `users` — Synced from `auth.users` via trigger. Stores GitHub token, API key.
- `projects` — User projects with type (website/deck), GitHub repo link, deploy status.
- `conversations` — Chat history per project (JSONB messages array).

### RLS
All tables have Row Level Security policies scoped to `auth.uid()`.

## Deployment

### Cloudflare Pages (Direct Upload)
Files are uploaded directly via Cloudflare API — no build step needed since files are already generated in memory by AI.

### GitHub
- Projects are backed by GitHub repos
- `staging` branch for preview, `main` for production
- Config stored in `.boom/config.json`
