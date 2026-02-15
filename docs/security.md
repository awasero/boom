# Security Checklist

## Authentication & Authorization
- [x] Supabase Auth with GitHub OAuth (no custom token handling)
- [x] Cookie-based sessions (httpOnly, secure, sameSite)
- [x] Middleware refreshes sessions on every request
- [x] RLS policies on all database tables
- [ ] Rate limiting on API routes

## Secrets Management
- [x] `.env.local` for local secrets (gitignored)
- [x] `SUPABASE_SERVICE_ROLE_KEY` server-side only
- [x] `ANTHROPIC_API_KEY` server-side only
- [x] GitHub tokens stored in Supabase (encrypted at rest)

## Input Validation
- [ ] Zod schemas on all API route inputs
- [x] Supabase parameterized queries (no SQL injection)
- [x] Sanitized AI outputs (iframe sandbox)

## API Security
- [x] All API routes check `supabase.auth.getUser()` before processing
- [x] No sensitive data in client-side code
- [x] CORS handled by Next.js defaults

## Content Security
- [x] AI-generated HTML rendered in sandboxed iframe
- [x] Prohibited content rules in AI prompts
- [ ] Content-Security-Policy headers

## Dependencies
- [ ] Run `npm audit` before deployment
- [ ] Pin major versions in package.json
- [ ] Review new dependencies before adding
