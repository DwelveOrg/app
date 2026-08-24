# Realtime Transport Boundaries

## Context

The app had 30–60 second polling for human queues and a 2-second loop for AI
import progress. Treating every changing surface as the same realtime problem
would either waste requests or introduce unnecessary persistent connections.

## Knowledge

- Keep visibility-aware polling for join requests, teacher requests, class
  activity, pending-request status, and the notification badge. These are
  low-volume human events where 30–60 second freshness is acceptable.
- Use SSE only for AI import progress. It is one-way, changes every few seconds,
  and exists for a bounded job lifetime.
- The SSE browser connection is same-origin through
  `/api/test-imports/:jobId/events`; the Next handler adds the backend bearer
  token server-side. Never expose that token to EventSource or browser storage.
- Retain the 2-second status query only as connection/reconnection fallback.
- WebSocket is not justified until a real feature requires bidirectional,
  low-latency messaging such as collaborative editing or chat.

## Relevant Files

- `src/lib/query/polling.ts`
- `src/app/(root)/_hooks/useTestImport.ts`
- `src/app/api/test-imports/[jobId]/events/route.ts`

## Implications

Choose transport per event shape; do not replace all polling with SSE or add a
global socket connection. The session boundary described in
[[Session refresh write boundary]] also applies to the same-origin stream
bridge.
