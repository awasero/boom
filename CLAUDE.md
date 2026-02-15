# Boom — AI Website & Deck Builder

## Stack
- **Framework:** Next.js 14 (App Router, RSC)
- **Language:** TypeScript (strict)
- **Auth:** Supabase Auth (GitHub OAuth)
- **Database:** Supabase (PostgreSQL + RLS)
- **Styling:** Tailwind CSS + shadcn/ui (new-york)
- **AI:** Anthropic Claude API (Opus/Sonnet/Haiku routing)
- **Hosting:** Vercel (Boom app itself)
- **User Site Deploys:** Cloudflare Pages (Direct Upload API)
- **Version Control:** GitHub (Octokit)

## Commands
- `npm run dev` — Start dev server
- `npm run build` — Production build (type-check + build)
- `npm run lint` — ESLint

## Architecture
```
src/
├── app/           # Next.js App Router pages + API routes
│   ├── (auth)/    # Login, callback (public)
│   ├── (app)/     # Authenticated pages (dashboard, editor, settings)
│   └── api/       # Server-side API routes (SSE streaming)
├── components/    # React components
│   ├── ui/        # shadcn/ui primitives
│   ├── editor/    # Editor workspace components
│   ├── dashboard/ # Project management
│   └── layout/    # Nav, footer
├── hooks/         # Custom React hooks
├── lib/           # Core logic
│   ├── supabase/  # Client/server/middleware
│   ├── ai/        # Claude client, parser, prompts
│   ├── github/    # Octokit operations
│   ├── cloudflare/# Pages deployment
│   └── brand/     # Brand nucleus system
└── types/         # TypeScript types
```

## Code Conventions
- Server components by default; `"use client"` only when needed
- Supabase auth via cookie-based sessions (no JWT in headers)
- API routes validate auth via `createClient()` server helper
- SSE streaming for AI responses (`text/event-stream`)
- `FILE:` block protocol for AI-generated code output
- RLS policies enforce data isolation per user

## Security
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to client
- All API routes check auth before processing
- GitHub tokens stored encrypted in Supabase users table
- Anthropic API key from env (server-side only)
- Input validation with Zod at API boundaries

## Git
- Commit format: `type: description` (feat/fix/refactor/docs/chore)
- Branch from main, rebase before merge
