# QUESTIONS.md

## Project Understanding Summary

This is a Norwegian SaaS web application ("Analyseverktøy" / "Nettsjekk") built on **Next.js 16 App Router**, **Supabase** (auth + database), and **OpenAI** (GPT-5 family models). It lets authenticated users analyze websites for SEO quality, content, security, performance, and now AI visibility (how well known a company is to AI models). Premium users can also generate articles and social media posts from their analysis data.

The system is organized around:
- A `/dashboard` page (the core experience) backed by a `useDashboard` hook (~1500 lines) that drives all analysis, editing, article/social generation, and AI suggestions
- A set of server-side API routes that call external services (OpenAI, Google PageSpeed, SSL Labs, Supabase, Unsplash)
- A Supabase database schema that evolved incrementally across 24 migrations
- A premium/free tier model where entitlements are split between hardcoded email lists and database flags

**High-risk areas identified:**
- Premium/entitlement logic is duplicated and inconsistent across server and client
- AI models are referenced using names (`gpt-5.2`, `gpt-5-nano`, `gpt-5-mini`) that appear to be unofficial/estimated and whose pricing is marked as "February 2026 estimates"
- The main analysis route (`POST /api/analyze`) is 300 lines with no unit tests; the entire test coverage is a single integration test file for AI endpoints
- The `useDashboard` hook is extremely large (~1500 lines) and the refactoring priorities rule acknowledges `dashboard/page.tsx` has not yet completed its planned refactoring
- Score-calculation logic (overallScore weighting) is duplicated across `runFullAnalysis` and `runCompetitorAnalysis`
- There is a migration numbering collision (`009_` exists twice) suggesting migrations may have been applied out of order or manually patched
- No rate-limiting beyond per-user monthly counting; no IP-level protection or abuse prevention

---

## How to Answer

Go through each question below and mark each with one of these tags:

- `verified` — confirmed as intentional behavior
- `partial` — partly correct, some nuance to add
- `blocked` — cannot be answered right now (missing context)
- `deferred` — known issue, intentionally left for later
- `out-of-scope` — not relevant for this project
- `caveat` — correct with important conditions

Write your answer directly under the question, then mark the tag.

---

## Questions

---

### 1. Product & Intended Behavior

#### Q1. What is the intended target market for free-tier users?
- **Where:** `src/lib/premium-server.ts`, `src/hooks/usePremium.ts`
- **Why this matters:** Free tier allows 5 monthly analyses (server) but the client hook initializes with limit `5` while the DB default for new users is `3` (from `002_user_profiles.sql`). These are inconsistent, meaning a new user's visible limit may differ from their enforced limit.
- **Question:** Is the free monthly analysis limit 3 or 5? Which value is authoritative — the `monthly_analysis_limit` column in `user_profiles`, the hardcoded `5` in `getPremiumStatusServer`, or the fallback value `3` in the hook?

5 is the limit

---

#### Q2. What happens when the analysis save fails but the analysis itself succeeded?
- **Where:** `src/app/api/analyze/route.ts` lines 276–278
- **Why this matters:** When `analysisError` is set, the error is logged but the route still returns a 200 with the full analysis result. The user sees a successful result but it is never persisted — they cannot return to it. This silent failure is invisible to the user.
- **Question:** Is this intentional? Should the user receive an error response or a warning that the result was not saved? Is there a retry mechanism or any alerting when saves fail?

This is not intentional and must be fixed. the user must be notified and try again

---

#### Q3. Is the `rerunFromAnalysisId` feature intended to count against the user's monthly limit?
- **Where:** `src/app/api/analyze/route.ts` lines 43–67, 109–133
- **Why this matters:** When `rerunFromAnalysisId` is provided, the code loads the previous URL/competitors/keywords and runs a full new analysis. The monthly limit is still enforced and a new analysis row is inserted. The UI comment says "kjør samme analyse på nytt" (re-run same analysis). This may surprise users who expect a re-run to be "free."
- **Question:** Should a re-run consume a monthly analysis slot? Is this communicated to users?

Yes re run should consume monthly slot. We must communicate to user
---

#### Q4. What is the user journey for account deletion or data export?
- **Where:** `src/app/(dashboard)/settings/page.tsx`, migrations
- **Why this matters:** GDPR compliance for Norwegian/EU users requires the ability to delete personal data. No delete-account or data-export UI was observed in settings. The DB cascades deletes on `auth.users`, but there is no in-app user-facing flow.
- **Question:** Is account deletion and data export implemented elsewhere, or is it a known gap? Is this product GDPR-compliant?

We have not set up this as GDPR complient. lets create a dokument like personvern, wouldnt that cover it?
---

#### Q5. What happens to the `companies` table now that analyses are user-based?
- **Where:** `supabase/migrations/004_user_based_analyses.sql`, `src/types/index.ts`
- **Why this matters:** Migration 004 decoupled analyses from companies (`company_id` made nullable, `user_id` added). The `Company` type still exists in `src/types/index.ts` and the `companies` table still has RLS policies. Yet the main `analyze` route never creates a company record.
- **Question:** Is the `companies` table still actively used, or is it legacy? If legacy, should it be cleaned up to reduce schema confusion? Is the `register` page (which presumably creates a company) still the sign-up path?

This is legacy, so we can remove it.

---

#### Q6. Are article and social post generations part of the same monthly quota?
- **Where:** `src/app/api/generate-article/route.ts` lines 31–55, `src/app/api/generate-social-post/route.ts`
- **Why this matters:** The route comment says "Shared quota: article_generations counts both article and social post generations (same limit)." This means a premium user generating 30 social posts consumes their article quota. This is a potentially surprising product decision.
- **Question:** Is the shared quota for articles and social posts intentional and communicated to users in the UI? Is this documented in the settings/upgrade page?


this is shared and should be communicated
---

### 2. Architecture

#### Q7. Why does `AI_VISIBILITY_ENABLED` feature flag exist as a hardcoded `false` in `analyzers/index.ts`?
- **Where:** `src/lib/analyzers/index.ts` line 12
- **Why this matters:** The flag is `false`, meaning AI visibility is never run as part of the main analysis flow — even for premium users. The standalone `/api/analyze/ai-visibility` endpoint exists and is used separately. This creates an architectural inconsistency: the flag implies the feature should eventually be integrated, but currently it is a dead code path.
- **Question:** Is the in-analysis AI visibility feature intentionally disabled? Is there a plan to remove the flag and dead code, or integrate it? Should `AI_VISIBILITY_ENABLED` be an environment variable instead of a hardcoded constant?

Ai visibility shouldnt be run an main analysis, it is separate
---

#### Q8. Why is the PageSpeed cache in-memory (`Map`) instead of using Supabase?
- **Where:** `src/lib/services/pagespeed.ts` lines 23–45
- **Why this matters:** The in-memory `pageSpeedCache` is scoped to a single serverless function invocation. On Vercel (or any stateless deployment), this cache is not shared between requests and will almost always be cold. Its 1-hour TTL is meaningless in practice. The `analyses` table already stores `pagespeed_results` per analysis, which could serve as a more persistent cache.
- **Question:** Is the in-memory PageSpeed cache intentional? Was it added as a quick optimization? Should it be replaced with a DB-backed or Redis cache?

Use teh DB cache instead
---

#### Q9. Why are there two separate `AIVisibilityData` interface definitions?
- **Where:** `src/types/dashboard.ts` lines 48–66 and `src/lib/services/openai.ts` lines 436–452
- **Why this matters:** Both are structurally identical but defined in different files. This creates a maintenance risk: if one is updated, the other may drift. The `/api/analyze/ai-visibility/route.ts` also defines its own inline `AIVisibilityPayload` type.
- **Question:** Should all AI visibility types be consolidated into `src/types/` with a single source of truth? Is the duplication intentional (e.g., for isolation between layers)?

Not sure. do whats best practice

---

#### Q10. What is the intended architecture for the `useDashboard` hook at ~1500 lines?
- **Where:** `src/hooks/useDashboard.ts`
- **Why this matters:** The refactoring priorities rule acknowledges this file is large and lists a migration plan. However the hook appears to contain the full state for analysis, article generation, social posts, AI visibility, editing flows, sorting, and PDF download — all in one file. This makes testing, debugging, and maintenance difficult.
- **Question:** Is there a timeline or milestone for breaking `useDashboard` into domain-specific hooks (e.g., `useArticles`, `useAiVisibility`, `useSocialPosts`)? What is blocking this refactor?

the file should me refactored yes
---

#### Q11. Is the `@openai/agents` SDK used anywhere beyond the single `seo-tips-workflow.ts` file?
- **Where:** `src/lib/agents/seo-tips-workflow.ts`, `src/app/api/ai-suggestion/route.ts`
- **Why this matters:** The `@openai/agents` package is a dependency but is only activated when `OPENAI_AGENT_WORKFLOW_ID` is set in the environment. There is no indication this env var is set in production. The rest of the app uses the standard `openai` SDK. This may be dead code or a half-implemented migration.
- **Question:** Is the Agents SDK integration actively used in production? Is there a plan to migrate more endpoints to it? Should it be removed if unused?

the envoirement is set in production
---

### 3. Code Structure & Boundaries

#### Q12. Is `dashboard/page.tsx` still too large, and what is the current state of the refactor?
- **Where:** `src/app/(dashboard)/dashboard/page.tsx`
- **Why this matters:** The refactoring rule targets this file at `< 300 lines`. After refactoring, the page is now ~747 lines, still well above target. Several large tab components are extracted, but the page file still contains inline rendering logic, icon imports, and wiring code.
- **Question:** Is 747 lines acceptable as an intermediate state? What is the next phase of the refactoring plan?

747 is acceptable
---

#### Q13. Why is `PREMIUM_EMAILS` defined in both `premium-server.ts` and `usePremium.ts` with different contents?
- **Where:** `src/lib/premium-server.ts` line 4–11 (6 emails), `src/hooks/usePremium.ts` line 17 (1 email)
- **Why this matters:** The server-side list has 6 premium email addresses. The client-side hook only has 1. This means the client-side premium status for 5 email addresses will be incorrect — it will fall through to the DB check (or fail). The displayed premium badge/limits in the UI may be wrong for those users.
- **Question:** Is it intentional that the client and server have different premium email lists? Should these be unified or removed in favor of a single source of truth (the DB)?

we have added premium emails for our team. the server side and client side should be the same ?
---

#### Q14. Why does `src/types/index.ts` and `src/types/dashboard.ts` both define `PageSpeedResults`?
- **Where:** `src/types/index.ts` lines 249–261, `src/types/dashboard.ts` lines 72–84
- **Why this matters:** Both define `PageSpeedResults` with the same fields, but they are distinct types in different files. Code that imports from one file cannot use values typed by the other without casting. This kind of type duplication leads to silent mismatches over time.
- **Question:** Should `PageSpeedResults` be unified into a single canonical type? Is this a known technical debt item?

it shpuld be unified
---

#### Q15. Why are score-calculation weights duplicated across `runFullAnalysis` and `runCompetitorAnalysis`?
- **Where:** `src/lib/analyzers/index.ts` lines 95–106 and lines 272–283
- **Why this matters:** The overall score formula (SEO 35%, Content 25%, Security 25%, Performance 15% — or 40/30/30 without PageSpeed) appears twice, identically. A change to the weighting in one place will not propagate to the other. `analyzeCompetitorsOnly` also has its own copy.
- **Question:** Is the score formula stable and intentionally duplicated for clarity, or should it be extracted into a shared function? Are there any plans to change the weighting?

The scoring should be the same,but analyze competitor has its own, but the weightning should be the same
---

### 4. API Design

#### Q16. The `POST /api/analyze` endpoint does authentication but API routes are excluded from middleware — is this correct?
- **Where:** `src/middleware.ts` lines 9–20, `src/app/api/analyze/route.ts` lines 28–33
- **Why this matters:** The middleware explicitly excludes `/api/*` routes. Auth is handled per-route inside each handler with `supabase.auth.getUser()`. Some API routes (like `/api/ai-suggestion`) do **not** check authentication at all.
- **Question:** Is `/api/ai-suggestion` intentionally unauthenticated? Should there be a shared auth middleware for all API routes, or is per-route auth acceptable?

lets add authetication for this yes.
---

#### Q17. What happens if a competitor URL is unreachable during analysis?
- **Where:** `src/lib/analyzers/index.ts` lines 330–334
- **Why this matters:** Failed competitor analyses are silently skipped (`return null` + filter). The main analysis succeeds and returns, but the user receives no feedback about which competitors failed or why.
- **Question:** Should failed competitor analyses surface a warning to the user? Is the current silent-skip behavior intended?
we want the analysis to continue running if something fails, but we can add a notification that which have failed yes.

---

#### Q18. Is there a maximum URL/payload size limit on the analyze endpoint?
- **Where:** `src/app/api/analyze/route.ts`
- **Why this matters:** The route accepts arbitrary `url`, `competitorUrls`, `keywords`, `companyName`, `websiteName`, and `industry` from user input. There is no length validation on any of these fields beyond checking that `url` is not falsy. A large payload (e.g., 50 competitor URLs before trimming) is accepted and trimmed server-side.
- **Question:** Are there input length/sanitization requirements for text fields like `companyName` and `industry`? Is the current competitor trim the only protection?

Add the protection you think is most suitable in this case.

---

#### Q19. The `POST /api/analyze` returns the full analysis payload directly in the response. Is this intentional?
- **Where:** `src/app/api/analyze/route.ts` lines 289–294
- **Why this matters:** The response spreads the full `result` object into the JSON response body. This means all raw SEO analysis data, AI summary, keyword research, and competitor data is returned inline — potentially a very large payload. The client then also fetches the same data from the DB for subsequent loads.
- **Question:** Is returning the full analysis in the response body the intended design? Could this be replaced with returning only the `analysisId` and then fetching the result from the DB?

This seems suboptimal yes. Lets try to fetch the result from the DB if posible
---

### 5. Data & Persistence

#### Q20. There are two migrations with the `009_` prefix — was this accidental or intentional?
- **Where:** `supabase/migrations/009_article_suggestions.sql`, `supabase/migrations/009_update_free_limits.sql`
- **Why this matters:** Two migrations share the same sequence number `009`. Depending on how migrations are applied (alphanumeric sort), one may have overwritten or been skipped. This is a common source of schema drift in Supabase projects.
- **Question:** Were both `009_` migrations applied? Are they safe to run in any order? Should one be renumbered?

not sure
---

#### Q21. The `ai_visibility_cache` table is globally shared with no user isolation — is this intentional?
- **Where:** `supabase/migrations/021_ai_visibility_cache.sql`, `src/app/api/analyze/ai-visibility/route.ts` lines 330–353
- **Why this matters:** The cache stores AI visibility results per domain, shared across all users. If one user runs an AI visibility check, all subsequent users checking the same domain (within 30 days) get the cached result. Any authenticated user can insert/update the cache (RLS policy: `USING (true) WITH CHECK (true)`).
- **Question:** Is the cross-user shared cache intentional? Are there privacy concerns with one user's triggered result being served to another? Could a malicious user poison the cache with bad data?

ai visibility should only be visible to the autenticated user for that account, and not shared to other users on the platform
---

#### Q22. How is the `article_generations` table used for quota tracking of both articles and social posts?
- **Where:** `supabase/migrations/007_article_generations.sql`, `src/app/api/generate-article/route.ts`, `src/app/api/generate-social-post/route.ts`
- **Why this matters:** The `article_generations` table name is misleading — it tracks both article and social post generations as part of a shared quota. This naming will confuse future developers and makes querying per-type impossible without adding a `type` column.
- **Question:** Should the `article_generations` table be renamed or given a `type` column to distinguish articles from social posts? Is per-type quota tracking needed?

yes distinguish them, but they should share quata still.
---

#### Q23. Are there analyses or data belonging to users who have since deleted their account?
- **Where:** `supabase/migrations/001_initial_schema.sql` line 61
- **Why this matters:** The `analyses` table has `company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE` (from migration 001), but migration 004 added `user_id` as nullable with cascade. Analyses created in the new user-based flow will be deleted when the user is deleted. But analyses created via the old company-based flow may or may not cascade correctly.
- **Question:** Are there orphaned analyses in the database from the old company-based flow that are not properly cascading? Has the DB been audited for consistency after the migration 004 change?

the old company based flow doenst exist anymore and can be removed
---

### 6. Security

#### Q24. `/api/ai-suggestion` has no authentication check — is this intentional?
- **Where:** `src/app/api/ai-suggestion/route.ts`
- **Why this matters:** This endpoint accepts arbitrary SEO elements and calls OpenAI (`gpt-5-mini`) with no authentication, no rate limiting, and no user verification. Any unauthenticated request from any client can trigger an OpenAI API call at cost. With `maxDuration: 30`, it is also publicly accessible.
- **Question:** Is this endpoint intentionally public? If not, an auth guard should be added immediately. Is there any rate limiting at the network/CDN layer (e.g., Vercel WAF)?

yes we should add auth here. we are using our own openai key
---

#### Q25. Is input from user-provided URLs sanitized before being passed to the scraper?
- **Where:** `src/app/api/analyze/route.ts` lines 88–95, `src/lib/services/scraper.ts`
- **Why this matters:** The scraper uses Node.js native `http`/`https` to fetch URLs. The URL is validated with `new URL()`, but there is no check for:
  - Private IP ranges (SSRF: `http://169.254.169.254`, `http://localhost`, `http://10.x.x.x`)
  - Non-HTTP protocols that could reach internal services
  - Very slow or large responses that could exhaust memory
- **Question:** Is SSRF (Server-Side Request Forgery) protection implemented? Should URLs be validated against a list of blocked IP ranges/hostnames?

ssrf is not implemented. Do whats best practice
---

#### Q26. Hardcoded email addresses in source code — is this the intended access control mechanism?
- **Where:** `src/lib/premium-server.ts` lines 4–11, `src/hooks/usePremium.ts` lines 17–19, `supabase/migrations/002_user_profiles.sql` lines 44–52
- **Why this matters:** Premium status for internal team members is granted by hardcoding email addresses in multiple source files and migration scripts. This means:
  - Adding/removing a team member requires a code change and deployment
  - The list is out of sync between files (server has 6, client has 1)
  - Email addresses are visible in the public git history
- **Question:** Should internal team premium access be managed exclusively through the `user_profiles.is_premium` database flag? Is there a plan to remove the hardcoded list?

this is intentional for now
---

#### Q27. The `create_company` and `create_user_analysis` functions use `SECURITY DEFINER` — is this reviewed?
- **Where:** `supabase/migrations/001_initial_schema.sql`, `supabase/migrations/004_user_based_analyses.sql`
- **Why this matters:** `SECURITY DEFINER` functions execute with the permissions of the function owner (typically postgres superuser). If these functions have vulnerabilities (SQL injection, parameter abuse), they could be exploited to bypass RLS. `create_company` is also granted to `anon` role, meaning unauthenticated users can call it.
- **Question:** Is `create_company` still being called by unauthenticated users? If the registration flow now creates users via Supabase Auth, should `anon` access to `create_company` be revoked?

create company is not used anymore and can be removed. we are only using user.
---

#### Q28. The `ai_visibility_cache` RLS policy allows any authenticated user to insert/update any cache entry.
- **Where:** `supabase/migrations/021_ai_visibility_cache.sql` lines 29–31
- **Why this matters:** The RLS policy `WITH CHECK (true)` allows any authenticated user to upsert any domain in the cache — including overwriting another user's cached result with manipulated data. This could be used to make a competitor's AI visibility score appear artificially low or high.
- **Question:** Should the `ai_visibility_cache` table have a more restrictive write policy (e.g., only the service role or server-side functions can write to it)?

this should not be possible.
---

### 7. Performance

#### Q29. All competitor analyses run in parallel — what happens with 5 competitors?
- **Where:** `src/lib/analyzers/index.ts` lines 289–337
- **Why this matters:** With 5 premium competitors, the system initiates 5 simultaneous HTTP scrapes, 5 SEO analyses, 5 content analyses, and 5 security checks in parallel. The total outbound connection count and memory pressure during a single request could be significant, especially on Vercel Edge.
- **Question:** Is there a concurrency cap on competitor analysis? Has the 5-competitor case been load-tested? Is there any concern about exceeding Vercel's connection limits?

we have not tested this if many users at the same tie runs a analysis with 5 competitors. Whats best practice?
---

#### Q30. The SSL Labs polling loop can block for up to 120 seconds.
- **Where:** `src/lib/services/ssl-labs.ts` lines 38–49
- **Why this matters:** The SSL Labs API is polled every 5 seconds for up to 24 attempts (120 seconds total). This is called inside `analyzeSecurity`, which is called within the main analysis. Even with Fluid Compute (300s max), this consumes a significant portion of the budget and cannot be interrupted.
- **Question:** Is the full SSL Labs polling intended for all analyses, or only when cached security results are unavailable? Is there a timeout shorter than 120 seconds that would still provide meaningful results?

this seems to much yes. the intention was if there is no cached security data. Do whats best practice here.

---

#### Q31. The analysis deadline race (299 seconds) fires before saving — the result is lost.
- **Where:** `src/app/api/analyze/route.ts` lines 193–250
- **Why this matters:** The `ANALYSIS_DEADLINE` is set to `maxDuration - 1` seconds (299s). If the analysis completes at second 298 but the DB insert takes more than 1 second, the function times out, the save fails silently, and the user gets a 504. The analysis was run (and paid for) but not saved.
- **Question:** Is the 1-second margin between deadline and maxDuration sufficient? Should the deadline be set earlier to ensure time for DB writes?

ensure enough time for DB writes yes.
---

#### Q32. Keyword research runs a second time for premium users as a fallback.
- **Where:** `src/lib/analyzers/index.ts` lines 183–199
- **Why this matters:** For premium users who did not supply keywords, the code runs AI analysis first, extracts up to 20 keywords from the AI output, then runs `generateKeywordResearch` again as a second OpenAI call. This second call is not accounted for in the API cost estimates document.
- **Question:** Is the double keyword research call intentional? Is its cost included in the cost estimates? Could it be combined into a single prompt?

if the user did not add keywords, the keywords shouldnt be run?
---

### 8. Error Handling & Resilience

#### Q33. What happens when OpenAI API is unavailable or returns an unexpected model error?
- **Where:** `src/lib/services/openai.ts`, `src/lib/analyzers/index.ts`
- **Why this matters:** AI analysis failures are caught and set to `null` (the analysis proceeds without AI), which is reasonable. However, keyword research failures return `null` silently, and the user may not know why no keywords appeared. The `generate-article` route re-throws the error.
- **Question:** Is the current error handling strategy (AI fails silently, non-AI routes throw) intentional? Should the UI indicate to the user when the AI portion failed?

the user should always see a indication on what has failed

---

#### Q34. The scraper follows HTTP redirects recursively with no depth limit.
- **Where:** `src/lib/services/scraper.ts` lines 33–38
- **Why this matters:** The `nativeFetch` function follows redirects by calling itself recursively. There is no maximum redirect depth. A URL with a circular redirect chain or redirect loop would stack-overflow or loop indefinitely until the outer timeout fires.
- **Question:** Should a maximum redirect depth (e.g., 5) be enforced? Is the outer 30-second timeout the only protection against redirect loops?

Do whats best practice here!
---

#### Q35. When the monthly analysis save fails (line 276–278 in analyze/route.ts), the `increment_api_usage` call still runs.
- **Where:** `src/app/api/analyze/route.ts` lines 280–287
- **Why this matters:** If the analysis DB insert fails, the code still calls `increment_api_usage`, recording tokens and cost for an analysis that was never saved. This could skew cost reports and prevent users from accessing their results, while still consuming their monthly quota.
- **Question:** Should `increment_api_usage` be conditional on a successful analysis save? Or is tracking costs independently from saves intentional?

It should only track if successful
---

### 9. Testing & QA

#### Q36. The only test file is a single integration test for AI endpoints — is this the full test coverage?
- **Where:** `src/tests/ai-endpoints.test.ts`
- **Why this matters:** There are no unit tests for the analyzers, no tests for the scoring logic, no tests for the auth/premium middleware, no tests for the API routes (beyond AI endpoints), and no component tests. The entire business logic (score calculation, scraper, content/SEO/security analyzers) is untested.
- **Question:** Is the lack of automated tests a known gap? Is there a plan to add test coverage, particularly for scoring logic, premium enforcement, and the middleware? What is the testing strategy?

Yes tehre is no test yet. we must add that going forward
---

#### Q37. The AI-endpoint test file reads `.env.local` directly from the filesystem — is this safe?
- **Where:** `src/tests/ai-endpoints.test.ts` lines 11–22
- **Why this matters:** The test file reads `.env.local` and injects values into `process.env`. This pattern is fragile (relies on running from repo root), and could accidentally expose secrets if the test output is logged in CI.
- **Question:** Are these tests run in CI? Is `.env.local` available in the CI environment, or do tests rely on secrets injected via CI env vars?

we must fix this. do whats best practice
---

#### Q38. There is no test for the analysis route's monthly limit enforcement.
- **Where:** `src/app/api/analyze/route.ts` lines 109–133
- **Why this matters:** The monthly analysis limit is a core business rule. Without a test, a refactor could silently break rate limiting, allowing free users unlimited analyses.
- **Question:** Is this tested manually or through QA? Should a test be added to verify that the 429 response fires at the correct threshold?

we should add test
---

### 10. Observability

#### Q39. Console logging is the only observability mechanism — is structured logging planned?
- **Where:** Throughout `src/lib/analyzers/index.ts`, `src/lib/services/`, `src/app/api/`
- **Why this matters:** All logging uses `console.log`, `console.warn`, and `console.error`. There is no correlation ID to link logs from a single user's analysis across multiple log lines. On Vercel, these logs appear in the function log view but cannot be easily filtered, aggregated, or alerted on.
- **Question:** Is structured logging (with correlation IDs, user IDs, analysis IDs) planned? Is there a monitoring/alerting system connected to Vercel logs?

we have not tought about that. do whats best practice
---

#### Q40. There is no tracking of which analyses exceed the deadline or how often it happens.
- **Where:** `src/app/api/analyze/route.ts` lines 239–249
- **Why this matters:** When `ANALYSIS_DEADLINE` is exceeded, a 504 is returned to the user. This is logged as a console error, but there is no metric or alert to detect if deadlines are being exceeded frequently (e.g., due to slow external APIs or high load).
- **Question:** Is deadline frequency tracked anywhere? Is there an alerting mechanism for when a large percentage of analyses hit the 504 path?

we have not tought about that. do whats best practice

---

### 11. AI Design Decisions

#### Q41. Keyword research data is generated by AI (GPT-5-mini), not a real keyword data source — is this disclosed to users?
- **Where:** `src/lib/services/openai.ts` lines 329–430, dashboard keywords tab
- **Why this matters:** The system prompt explicitly states: "Basert på din kunnskap om søkemønstre…gi realistiske **estimater**." Search volume, CPC, competition score, and difficulty are all AI-estimated, not from Google Ads, SEMrush, Ahrefs, or any verified data source. These numbers may mislead users into making SEO/marketing decisions based on fabricated data.
- **Question:** Is the AI-estimated nature of keyword data disclosed to users in the UI? Should there be a disclaimer on the keywords tab? Is there a plan to integrate a real keyword data API?

this is known for now. we will implement a real keyword data api in the future
---

#### Q42. AI visibility is measured by asking GPT about itself — what are the limitations?
- **Where:** `src/app/api/analyze/ai-visibility/route.ts`
- **Why this matters:** The AI visibility check asks GPT-4o-mini (with web search) whether it knows about a company. This conflates "is this company indexed by web search" with "is this company visible to AI models." The scoring algorithm (`cited × 2 + mentioned × 1`) is arbitrary and not backed by any external benchmark.
- **Question:** Is the scoring methodology documented for users? Is there a risk that users over-interpret this score as an objective measure of AI visibility? Has this feature been validated against a known baseline?

no we must find a better way to score AI visibility. what do u recomend here?
---

#### Q43. Model names like `gpt-5.2`, `gpt-5-mini`, and `gpt-5-nano` — are these real, available models?
- **Where:** `src/lib/services/openai.ts` lines 30–36, `docs/API-KOSTNADER.md`
- **Why this matters:** At the time of review, GPT-5 models are referenced with version names that appear to be forward-looking or estimated. The `PRICING` table is marked as "February 2026 estimates." If these model names are not valid in the OpenAI API, all AI features will fail silently or throw errors.
- **Question:** Are these model names confirmed working against the OpenAI API? Should there be a validation step or environment variable for model selection so names can be updated without a code change?

these models are valid
---

### 12. Documentation & Decisions

#### Q44. The `vercel.json` sets `maxDuration` for `src/app/api/analyze/*/route.ts` to 60s — but the main route is set to 300s. Does the wildcard override the specific?
- **Where:** `vercel.json` lines 7–8
- **Why this matters:** Vercel processes function config with more specific paths taking precedence. The main route `src/app/api/analyze/route.ts` is explicitly set to 300s. The wildcard `src/app/api/analyze/*/route.ts` (targeting sub-routes) is set to 60s. This appears intentional but is not documented.
- **Question:** Is this routing intentional? Does the sub-route wildcard correctly target only the `ai-visibility`, `competitor`, `competitors`, `keywords`, and `pagespeed` sub-routes?

yes i thikn so
---

#### Q45. The `AI_VISIBILITY_SKIP_24H_THROTTLE` environment variable is referenced but not documented.
- **Where:** `src/app/api/analyze/ai-visibility/route.ts` lines 412–414
- **Why this matters:** This env var can bypass the 24-hour throttle on AI visibility checks per analysis. It is not listed in any README, `.env.local.example`, or documentation. A developer not aware of it could not use it in testing.
- **Question:** Are all environment variables documented somewhere? Is there an `.env.example` file or equivalent? What other undocumented env vars exist?

yes we have env.local
---

### 13. Technical Debt / Suspicious Areas

#### Q46. The `checkPremiumStatus` function in `usePremium.ts` uses the client-side Supabase client — is this safe?
- **Where:** `src/hooks/usePremium.ts` lines 116–146
- **Why this matters:** This is a non-hook async helper that calls `createClient()` (the browser client) directly. If this is called from a server component or server function (which it should not be, given the file), it would use the wrong Supabase client. It is exported as a named export which makes it callable from anywhere.
- **Question:** Is `checkPremiumStatus` (the standalone function, not the hook) ever called from server-side code? Should it be removed or renamed to clarify it's client-only?

do hwats best practice here
---

#### Q47. The `usePremium` hook references `PREMIUM_LIMITS` before it is defined in the file.
- **Where:** `src/hooks/usePremium.ts` line 25, `PREMIUM_LIMITS` defined at line 149
- **Why this matters:** JavaScript hoisting does not apply to `const` declarations. If TypeScript/bundler does not catch this, it would cause a runtime error (accessing `PREMIUM_LIMITS.free.articleGenerationsPerMonth` before it is defined). This is likely caught by the TypeScript compiler but is a code quality issue.
- **Question:** Is this a linter/compiler error currently? Should `PREMIUM_LIMITS` be moved to the top of the file or to a constants file?

do hwats best practice here

---

#### Q48. The `seo-tips-workflow.ts` agent is named `"My agent"` — is this a placeholder?
- **Where:** `src/lib/agents/seo-tips-workflow.ts` line 29
- **Why this matters:** The agent name `"My agent"` is clearly a placeholder from a code template. This name would appear in OpenAI tracing dashboards and logs, making it difficult to identify the source of a trace.
- **Question:** Should this be renamed to something like `"SEO Tips Agent"` before production use?

do hwats best practice here

---

#### Q49. The `scraper.ts` limits redirect depth only by timeout — is 30 seconds sufficient for the worst case?
- **Where:** `src/lib/services/scraper.ts` lines 7–8
- **Why this matters:** The default timeout is 30 seconds, and there are 2 retries with 2-second delays between them. In the worst case (2 retries × 30s + 2×2s delays), the scraper can block for up to 64 seconds. This exceeds the 60-second limit of sub-routes and approaches the 300s main route limit.
- **Question:** Is the maximum scrape time (64 seconds for 2 retries) acceptable within the analysis budget? Should retries be reduced or timeouts shortened when running in competitor mode?

Not sure. do hwats best practice here. in production for vercl we have a limit we cant exceed.
---

### 14. Missing Decisions / Open Design Gaps

#### Q50. Is there a plan for payment/billing integration to automate premium upgrades?
- **Where:** `src/types/index.ts` (UserProfile has `premium_expires_at`), settings page
- **Why this matters:** Currently, premium status is set manually via DB scripts or hardcoded emails. The `UserProfile` type has `premium_since` and `premium_expires_at` fields, and there is a `scripts/create-premium-users.js` file suggesting manual provisioning. There is no Stripe, Vipps, or other payment integration visible.
- **Question:** Is payment integration planned? Until then, how are new premium customers activated? Is there an admin dashboard or Supabase dashboard used for this?

Payment isnt set p yet. so we keep this for now
---

#### Q51. What is the intended behavior when a user analyzes a website they do not own?
- **Where:** `src/app/api/analyze/route.ts`, throughout
- **Why this matters:** Any authenticated user can analyze any URL, including competitor websites, government sites, or sites belonging to other users. The results are associated with the authenticated user's account. There is no check that the user owns or has permission to analyze the target domain.
- **Question:** Is open-URL analysis intentional? Are there any legal or ethical constraints on what URLs users should be allowed to analyze?

Open url analysis is intentional. there is no verification on urls. If there are any legal r ethical problems related to analyse a publi website, it should be documented. find the information for me IF there is.
---

#### Q52. There is no webhook or notification when a long analysis completes.
- **Where:** `src/app/(dashboard)/dashboard/page.tsx`, `useDashboard` hook
- **Why this matters:** Analyses can take up to 300 seconds. The UI shows a progress indicator, but the user must keep the tab open. If they navigate away, the result may still be saved to the DB (or lost if deadline exceeded), but they have no way to know without refreshing the analysis list page.
- **Question:** Should there be a notification (email, toast on next page load, websocket) when an analysis completes? Is background analysis (starting and coming back later) a planned feature?

I have not tried to exit a modal when analysis run, but ideal it should be a background f the user exits the modal. But the Ui should say for now that keep the modal up.
---

## Suggested Answer Tags

Use these tags consistently when answering:
- `verified` — confirmed as intentional behavior
- `partial` — partly correct, some nuance to add
- `blocked` — cannot be answered right now (missing context)
- `deferred` — known issue, intentionally left for later
- `out-of-scope` — not relevant for this project
- `caveat` — correct with important conditions
