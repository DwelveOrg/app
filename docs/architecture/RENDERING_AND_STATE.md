# Rendering and State

Status: v1 · Last updated: 11 August 2026

Where data is fetched, where it is cached, and where the `"use client"` boundary goes. `ARCHITECTURE.md`
owns the request *plumbing* (which client, which schema, which helper); this file owns the
**ownership decision** — which layer is responsible for a piece of state at all.

Most freshness bugs in this product are ownership bugs: a panel fed by RSC props that a
`invalidateQueries` can never refresh, or a tab that switches on local state and therefore never
refetches.

**Related:** [ARCHITECTURE.md](./ARCHITECTURE.md) · [FORMS.md](./FORMS.md) ·
[`../design/interaction-and-states.md`](../design/interaction-and-states.md) §7 (freshness)

---

## 1. Server or client

Default to **server**. Add `"use client"` only when the component needs one of:

- state or effects (`useState`, `useEffect`, `useRef`)
- browser APIs (`localStorage`, `navigator`, `window`)
- event handlers
- `useTranslation` — **i18n is client-only in this app**
- `next-themes`, React Query, `motion`, Radix interactive primitives

### Push the boundary down

A page that marks itself `"use client"` to use one hook drags its whole subtree into the bundle. The
established shape:

```
page.tsx              server — awaits params, fetches, picks a state, renders the view
  <SomeView />        client — owns tabs, dialogs, mutations, translations
    <Surface>         (server-safe primitives render fine inside a client tree)
```

`Surface`, `Button`, `Badge`, `PageHeader`, `SectionHeader`, `FactGrid`, `BackLink`, and `Skeleton`
have no `"use client"` directive and work in either tree. `Field`, `Input`, `TabBar`, `Segmented`,
`Dialog`, `ConfirmDialog`, `RowActionsMenu`, `ListRow`, `Empty`, and `ResourceStateView` are client
components.

### The consequence you will hit first

**A server component has no `t`.** That is why:

- `ResourceStateView` takes i18n **keys** — every caller is a server component.
- `ConfirmDialog` takes rendered **strings** — every caller is already a client component, and
  baking a key namespace into a shared component would be worse.

Pick the same way when you build something new: keys if the callers are server, strings if they are
client.

---

## 2. The page pattern

```tsx
type PageProps = { params: Promise<{ classId: string }> };

export default async function Page({ params }: PageProps) {
  const { classId } = await params;          // params is a Promise in Next 16
  const user = await getUser();
  const result = await getClass(classId);

  if (!result.ok) {
    return <ResourceStateView reason={result.reason} namespace="root.classDetail"
                              backHref="/groups" … />;
  }

  return <ClassDetailView classItem={result.class} viewerRole={user?.schoolRole ?? null} />;
}
```

Three responsibilities and no more: await params, fetch, choose between a state view and the real
view.

### `_utils/get*` — the server read helpers

Server reads go through a helper in the route's `_utils/`, which **classifies the failure instead of
throwing**:

```ts
export type ClassFetchResult =
  | { ok: true; class: ApiClass }
  | { ok: false; reason: "forbidden" | "notFound" | "error" };

export async function getClass(classId: string): Promise<ClassFetchResult> {
  try {
    const { class: classItem } = await getClassRequest(classId, authedBackendJson);
    return { ok: true, class: classItem };
  } catch (error) {
    if (error instanceof BackendApiError) {
      if (error.status === 403) return { ok: false, reason: "forbidden" };
      if (error.status === 404) return { ok: false, reason: "notFound" };
    }
    console.error("Failed to load class:", error);
    return { ok: false, reason: "error" };
  }
}
```

Every such helper carries `import "server-only"`. Keeping 403 and 404 apart is the difference
between "you don't have access yet" and "this doesn't exist" — two genuinely different screens.

An uncaught throw here is not a bug in itself; it hits `(root)/error.tsx`. But a *predictable*
failure (403/404) reaching the error boundary is a bug, because the boundary can only offer "retry"
and "go home".

---

## 3. Who owns which state

| State | Owner |
|---|---|
| Initial page data | Server component + `_utils/get*` |
| Data fetched on demand (a picker's search, a paginated list, a dialog's contents) | React Query |
| Data that changes as a result of a mutation | The mutation hook, through `useServerDataRefresh` |
| Server-rendered data that a mutation changed | The same call — see §5, the two halves travel together |
| Session / current user | `getUser()` on the server; the proxy handles refresh |
| Theme | `next-themes` (`dwelve-theme`, class strategy) |
| Language | i18next + `localStorage["gf-language"]` |
| Form state | `react-hook-form` |
| UI state (open tab, open dialog, filter) | local `useState` |

Rules of thumb:

- **If the server can render it, let it.** Don't fetch on mount what the page already had.
- **If it is fetched because the user asked for it** — opened a dialog, typed in a search, paged —
  it is React Query.
- **Never mirror server data into `useState`.** It goes stale the moment anything invalidates.

---

## 4. React Query conventions

Defaults (`src/lib/query/QueryProvider.tsx`):

```ts
queries:   { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false }
mutations: { retry: 0 }
```

`refetchOnWindowFocus` is off deliberately — a teacher alt-tabbing between a roster and a
spreadsheet should not trigger a refetch storm. The cost is that **freshness must be explicit**, and
sections 5 and 6 are how.

### Keys

All keys live in `src/lib/query/keys.ts`. Never inline a key array.

The convention is a broad key plus filtered variants:

```ts
classes: {
  all: ["classes"],
  detail: (classId) => [...all, "detail", classId],
  assignableStudentsAll: (classId) => [...all, "assignable-students", classId],
  assignableStudents: (classId, filters) => [...assignableStudentsAll(classId), filters],
}
```

**Keys match as prefixes.** `invalidateQueries({ queryKey: assignableStudentsAll(id) })` invalidates
every search/page variant beneath it. That is what the `*All` keys are for — use them when
invalidating, use the specific key when querying.

### Hooks

- One hook per query or mutation, in the route's `_hooks/`, named `use…Query` / `use…Mutation`.
- Hooks call **server actions**, never a backend URL.
- Mutation hooks own their invalidation in `onSuccess`. A component that invalidates by hand means
  the next call site will forget.
- `mutationFn` unwraps with `readSafeActionData`.

---

## 5. Invalidation

After a mutation, ask: **what on screen is now wrong?**

Almost always: both halves. Approving a join request clears a row from a React Query list *and*
adds a student to the server-rendered roster three inches above it, *and* shifts the counts in the
page header above that. Fixing one and not the other reads as a failed approval.

So the two are not separate calls. **Mutation hooks call `useServerDataRefresh` in `onSettled`,
which invalidates the query keys and re-runs the server render together:**

```ts
function useInvalidateClassRequests(classId: string) {
  const refresh = useServerDataRefresh();
  return () => refresh(queryKeys.enrollment.classRequestsAll(classId), queryKeys.classes.all);
}
```

This used to live at the call sites, as an `onReviewed` / `onRosterChange` callback each component
passed down so it could `router.refresh()` itself. Some remembered. `StudentClassCard` and
`MyClassRequestsView` did not, so a student requesting to join a class watched nothing change until
they reloaded by hand. A rule you have to remember at every call site is a rule that decays as call
sites are added, so the hook owns it now and components pass no refresh callbacks at all.

**Do not add a `router.refresh()` beside a success toast.** If the mutation hook is doing its job
that is a second RSC request for the same data.

### The other half: someone else's write

The refresh contract covers the person who clicked. It cannot cover a student filing a join request
while an admin stares at the queue — nothing has told that browser anything happened.

**That half is polling**, in `@/lib/query/polling`. A polled query spreads in `pollingOptions(ms)`,
which pairs the interval with `refetchOnWindowFocus`; the two are one mechanism, because React Query
pauses interval timers on a blurred tab and without the focus refetch a returning user would sit on
whatever was true when they left.

| Surface | Rate | Why |
|---|---|---|
| Class join requests, teacher requests | `POLL_ACTIVE_MS` (30s) | A queue the viewer is actively working |
| Notification unread badge | `POLL_AMBIENT_MS` (60s) | Mounted on every page; wrong by 30s costs nothing |
| A student's own pending requests | `POLL_AMBIENT_MS` (60s) | Waiting on a human decision |

**A poll tick does not `router.refresh()`.** Re-running the server render every 30s for every open
tab would cost far more than the poll it accompanies, and it is not needed: a *pending* request
changes only query-backed surfaces. The roster and counts that come from the server change on
**approval**, which is the acting user's own click and already goes through `useServerDataRefresh`.

Not SSE, deliberately. The browser has no direct line to the backend — the session is an httpOnly
cookie read on the Next server — so a stream would need either a new token surface or a serverless
function pinned open per tab, for a queue measured in requests per hour.

---

## 6. Tab refresh

Tabs in this product switch on **local state**: the query keys don't change and nothing remounts. So
without an explicit refresh, a tab switch fires no request at all and the panel shows whatever was
fetched when the page first loaded.

The failure is silent. A panel that never refetches looks exactly like a panel with nothing new in
it — which is how a pending join request stayed invisible until a full reload.

`useTabRefresh` closes it, declared per tab:

```ts
{ value: "requests", label: t("…"),
  refresh: { queryKeys: [queryKeys.enrollment.classRequestsAll(classId)], router: true } }
```

- `queryKeys` — invalidated as prefixes. Covers panels backed by React Query.
- `router: true` — re-runs the server render. Covers panels fed by RSC props.

Both fields exist because tabs are fed two different ways, and a tab showing server state must
declare whichever applies. Omit `refresh` only when the content is already in the browser — a filter
over a loaded list, a static picker.

Invalidation handles both mounting orders: a query with a mounted observer (tab counts) refetches
immediately; one without is marked stale and fetches when its panel mounts. Link tabs invalidate
*before* navigating, so the destination's queries are already stale when its panels mount and it
never paints the previous visit's data.

Opening a tab refreshes it **even when it is already active** — a click on the current tab is the
user asking for exactly that.

---

## 7. Route segment config

`export const dynamic = "force-dynamic"` is set on three layouts and nowhere else:

| Layout | Why |
|---|---|
| `(root)/layout.tsx` | Reads the session |
| `studio/layout.tsx` | Every render depends on live test state |
| `exam/layout.tsx` | Every render depends on a live attempt and a server clock — **a cached exam page is a cached deadline** |

Don't add caching directives to individual pages without a reason you can state. Backend reads go
through `backendJson`, which sets `cache: "no-store"` by default.

`loading.tsx` gives you streaming for free — add one to any route whose server fetch is slow enough
to notice.

---

## 8. Session and the proxy

Route protection and token refresh run in `src/proxy.ts` — the Next 16 replacement for
`middleware.ts` (shown as "Proxy (Middleware)" in build output). It redirects unauthenticated users
off `protectedRoutes` and authenticated users off `publicRoutes`.

**The proxy also refreshes an expiring access token before the render that needs it, and that is a
correctness requirement, not an optimisation.** Next only permits cookie writes during the action
phase, so a Server Component render that refreshed would spend the single-use refresh token and then
be unable to save its replacement — ending the session permanently. Rotation is shared with
`authedBackendJson` through `_lib/token-refresh.ts`, and the cookie is built by `_lib/session-cookie.ts`
so both runtimes write identical attributes. Before refreshing reactively, `authedBackendJson` calls
`canPersistSession` and declines rather than spending a token it cannot save.

Adding a route: add it to `protectedRoutes` or `publicRoutes` in
`src/app/(authentication)/_constants/routes.ts`, and to `ROUTE_LABEL_KEYS` in
`src/app/(root)/_constants/routes.ts` if a segment label is displayed.

**Treat auth and session changes as high-risk.** Read the current code before editing; the comments
in those files record failures that are not obvious from the types.

---

## 9. Checklist

- [ ] `page.tsx` is a server component; `"use client"` sits as low as possible
- [ ] Server reads go through a `_utils/get*` helper with `import "server-only"`
- [ ] Failures classified (403 / 404 / other), not collapsed
- [ ] Query keys come from `@/lib/query/keys.ts`
- [ ] Mutation hooks refresh through `useServerDataRefresh`, using `*All` keys where variants exist
- [ ] No `router.refresh()` at a mutation call site — the hook owns it
- [ ] Queues and ambient counts poll through `pollingOptions`, never a bare `refetchInterval`
- [ ] Every tab showing server state declares `refresh`
- [ ] No server data mirrored into `useState`
- [ ] `loading.tsx` present for slow routes
- [ ] New routes registered in `protectedRoutes` / `publicRoutes`
