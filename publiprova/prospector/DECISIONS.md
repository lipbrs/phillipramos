# Architecture decisions — PubliProva Prospector

Developer documentation is in English (per the system spec). The operator manual
(`SETUP.md`) is in Portuguese, and so is the whole UI.

## ADR-001 — First contact is a private reply to a comment, not a cold DM

**Status:** decided, 2026-09-10.

**Context.** The original spec routed first contact through the operator's real
logged-in Chrome over CDP, with a 90–240s gap, a 30/day cap and a 5/day warmup.
Its stated reason: *"a API oficial da Meta não abre conversa com quem nunca
respondeu."*

**Decision.** We do not build that. Two reasons, and the first is enough:

1. Meta blocks conversation-opening on purpose. Driving the logged-in browser to
   do what the API refuses is circumventing a platform restriction — which the
   same spec lists under *Proibido*. The pacing and warmup schedule are tuned so
   the account is not flagged; that is evasion by design regardless of intent.
2. Unsolicited automated DMs are against the Instagram Terms of Use. The account
   at risk is `@publiprova.app` itself, which is the company's only distribution
   channel today.

**What we build instead.** The official Instagram Messaging API supports
**private replies to comments**: when someone comments on one of our posts, a
messaging window opens and we may send them one DM through the official API.
This is documented, supported, and is the mechanism ManyChat and OpenReply use.

It fits what already exists: every post scheduled through 19/09 ends in a keyword
CTA — *comenta RELATÓRIO*, *comenta PRINT*, *comenta EU*. The inbound funnel is
already being filled by the content calendar; the system harvests it.

**Consequences.**

- The channel machine starts at `inbound_pending` instead of a pending cold
  contact. Nothing is sendable until the person has commented first.
- Leads are warmer: they self-selected by typing a keyword.
- Volume is bounded by comment volume, not by a daily send cap. `MAX_DMS_PER_DAY`
  stays as a ceiling for account health.
- Lead discovery and ICP scoring use the vidIQ Instagram endpoints (a legitimate
  third-party API already connected to this workspace), not scraping.
- Funnel B (affiliates) works the same way, plus assisted outreach where the
  system drafts and the operator sends.

## ADR-002 — libsql instead of better-sqlite3

`better-sqlite3` ships no prebuilt binary for Node 24 on Windows and needs Visual
Studio to compile, which this machine does not have. `@libsql/client` is SQLite,
ships prebuilt bindings, and has a first-class Drizzle driver. `DATABASE_URL` is
still a `file:` path on local disk; WAL, foreign keys and busy timeout are set in
`src/db/client.ts`. SQLite remains the single source of truth.

## ADR-003 — No `server-only` in the shared DB client

The worker is a plain Node process and imports the same client. `server-only`
would break it. The guard belongs in the Next.js query layer instead.

## Open conflict with `phillipramos/CLAUDE.md`

`CLAUDE.md` says every comment and commit in this repo is pt-BR. The system spec
for this subproject says code, comments and commits are English, with the
operator manual in Portuguese. This subproject follows the spec; the rest of the
repo keeps pt-BR. Worth settling explicitly if it starts to grate.
