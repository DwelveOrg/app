# Persistent Agent Memory

This directory preserves decisions, discoveries, and gotchas whose rediscovery would cost meaningful
time. Stable current behavior belongs in `/docs`; temporary progress and task status belong neither
here nor there.

## Index

### Decisions

- [[Marketing application split]] — why public and authenticated routes are separate deployments
- [[Realtime transport boundaries]] — where polling, SSE, and WebSocket do and do not fit

### Discoveries

- [[Application residue after split]] — marketing-only tokens, catalogs, and comments still present
- [[Post auth navigation dead zone]] — the invisible wait between a successful sign-in and the shell
- [[Request cached session and fetch waves]] — session reads and parallel server fetch behavior
- [[UI consolidation gotchas]] — why shared-component drift survives compiler and build gates

### Gotchas

- [[Session refresh write boundary]] — why refresh cannot spend a token from an unwritable render
- [[Vercel upload ceiling]] — the transport cap below backend upload limits
- [[Google OAuth configuration parity]] — browser, backend audience, origin, and rebuild must agree
- [[Pointer tracking coordinate space]] — why the backdrop light missed the cursor and never faded out

## Maintenance

Before a non-trivial task, search this directory for the domain, read linked notes, then inspect
current code. After work, update an existing note when possible; create a focused note only for a
non-obvious decision, limitation, recurring bug, or expensive discovery. Link related notes and
never store secrets, personal data, command logs, speculation, or stale handoff status.

Source priority: current code; current configuration/schema; `AGENTS.md`; `/docs`; this memory;
historical plans and comments. Resolve conflicts rather than silently choosing a convenient source.
