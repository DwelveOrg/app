# Frontend Forms

Status: v1 · Last updated: 11 August 2026

The end-to-end recipe for a form in Dwelve: schema → form state → controls → server action →
mutation → feedback. Every form in the product follows it, and a form that skips a layer is the
usual source of "the error doesn't show up" and "the list didn't update".

`ARCHITECTURE.md` owns the request stack and which libraries are permitted. This file owns the
**form** shape. `docs/design/component-library.md` §5 owns the control APIs.

---

## 1. The stack

| Layer | Tool | Lives in |
|---|---|---|
| Input validation | `zod` | route-local `_types/_schemas/` |
| Form state | `react-hook-form` + `@hookform/resolvers/zod` | the component |
| Controls | `Field` + `Input` / `Textarea` / `Segmented` / `ImagePicker` | `@/components/ui` |
| Server boundary | `next-safe-action` via `@/lib/safe-action` | route `_lib/*-actions.ts` |
| Backend call | `authedBackendJson` + a named endpoint fn | route `_lib/*.api.ts` |
| Cache | `@tanstack/react-query` mutation hook | route `_hooks/use*Mutation.ts` |
| Feedback | `Field error`, `errors.root`, `toast` | the component |

Nothing here is optional or substitutable. Do not add a second form library, a second schema
library, or a bare `fetch`.

---

## 2. Schema

Form schemas live in the route's `_types/_schemas/`, are exported with a `…Schema` name, and export
an inferred type alongside:

```ts
export const createSchoolSchema = z.object({
  name: z.string().trim().min(1, "School name is required.")
        .max(120, "School name must be at most 120 characters."),
  description: z.string().trim().max(500, "…").optional(),
  logo: schoolLogoFileSchema.optional(),
});

export type CreateSchoolFormField = z.infer<typeof createSchoolSchema>;
```

Rules:

- **`.trim()` before length checks**, so five spaces isn't a valid name.
- **Every rule carries a message.** Zod's defaults leak schema vocabulary at the user.
- **File inputs validate type and size in the schema**, not in the picker — see
  `schoolLogoFileSchema` (non-empty, PNG/JPEG/WebP, ≤5 MB).
- Optional means optional. Don't model "empty string" as a distinct state unless the backend does.
- The **same schema** is the server action's `inputSchema`. Client-side validation is a convenience;
  the action's parse is the boundary that matters.

> Messages in schemas are currently English literals, because a zod schema has no `t` in scope. When
> a message must be localized, surface it through a translated key at the call site
> (`t(errors.name?.message)` is not a pattern here — map the code, don't translate the sentence).
> Prefer short, factual schema messages that read acceptably if they do surface directly.

---

## 3. Form component

```tsx
"use client";

export default function CreateSchoolForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const createSchoolMutation = useCreateSchoolMutation();

  const {
    register, handleSubmit, control, setError, clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<CreateSchoolFormField>({
    resolver: zodResolver(createSchoolSchema),
    defaultValues: { name: "", description: "", country: "", city: "" },
  });

  const onSubmit: SubmitHandler<CreateSchoolFormField> = (data) => {
    clearErrors("root");
    createSchoolMutation.mutate(data, {
      onSuccess: () => {
        toast.success(t("root.dashboard.schoolForm.success"));
        router.push("/dashboard");
        router.refresh();
      },
      onError: (error) => {
        const message = error instanceof Error ? error.message : t("…error");
        setError("root", { message });
        toast.error(message);
      },
    });
  };

  const isBusy = isSubmitting || createSchoolMutation.isPending;

  return (
    <Surface as="form" className="space-y-5 p-6" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Field label={t("…name.label")} required error={errors.name?.message}>
        <Input {...register("name")} aria-invalid={Boolean(errors.name)} autoFocus />
      </Field>

      <Controller control={control} name="logo" render={({ field, fieldState }) => (
        <ImagePicker onChange={(f) => field.onChange(f ?? undefined)}
                     errorMessage={fieldState.error?.message ?? null} … />
      )} />

      {errors.root && (
        <div className="rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errors.root.message}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-1">
        <Button asChild variant="outline" disabled={isBusy}>
          <Link href="/dashboard">{t("…cancel")}</Link>
        </Button>
        <Button type="submit" loading={isBusy}>{t("…submit")}</Button>
      </div>
    </Surface>
  );
}
```

The non-negotiable parts:

- **`Surface as="form"`** with `noValidate` — zod owns validation, not the browser.
- **`defaultValues` for every field.** A `undefined` → `""` transition makes the input uncontrolled
  then controlled, and React warns.
- **Every control inside a `Field`.** That is what supplies the label association, `role="alert"` on
  the error, and `aria-describedby`.
- **`aria-invalid`** on the control (or use `Field`'s render-prop form, which supplies it).
- **`register` for native inputs, `Controller` for anything with its own value shape** —
  `ImagePicker`, `Segmented`, Radix `Select`, `switch`, `checkbox`.
- **`isBusy = isSubmitting || mutation.isPending`**, fed to `Button loading` and to the cancel
  control's `disabled`.
- **`errors.root`** for a whole-submission failure, cleared at the start of each submit.

### Dialog forms

Same recipe, wrapped in `Dialog` with `DialogFooterActions` as the footer:

```tsx
<Dialog open={open} onOpenChange={setOpen} title={t("…")} showClose
        footer={<DialogFooterActions cancelLabel={t("common.cancel")}
                                     submitLabel={t("…")} isBusy={mutation.isPending} />}>
  <form id="…" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>…</form>
</Dialog>
```

Omit `onSubmit` on `DialogFooterActions` when the button is inside the `<form>` — it submits it.
Provide `onSubmit` only for non-form dialogs.

---

## 4. Server action

Actions live in the route's `_lib/*-actions.ts`, are `"use server"`, and go through
`actionClient` from `@/lib/safe-action`:

```ts
export const inviteTeacherAction = actionClient
  .inputSchema(inviteTeacherSchema)
  .action(async ({ parsedInput }) => {
    // Identity comes from the trusted session, never from the client.
    const user = await getUser();
    if (!user?.schoolId) throw new ActionError(NO_SCHOOL_ERROR);

    try {
      const { invite } = await createTeacherInviteRequest(
        user.schoolId, { email: parsedInput.email }, authedBackendJson,
      );
      return { invitedEmail: invite.invitedEmail, inviteUrl: invite.inviteUrl };
    } catch (error) {
      throw new ActionError(getActionError(error, INVALID_INVITE_ERROR));
    }
  });
```

Rules:

- **`ActionError` is the only error whose message reaches the browser.** Anything else is logged
  server-side and masked as `GENERIC_ACTION_ERROR`. Never `throw new Error(backendDetail)`.
- **Never take identity from the client.** `schoolId`, `userId`, and role come from the session via
  `getUser()`. A `schoolId` in `parsedInput` is a privilege-escalation bug.
- **Classify errors before masking them.** The shared `getActionError` shape maps `BackendApiError`
  → its message, `TypeError` → a network message, `BackendResponseValidationError` → logged plus a
  generic fallback.
- **Validate the backend response** with a zod `responseSchema` on the endpoint function. A
  TypeScript cast is not validation.
- Actions may `redirect()`, but prefer returning data and letting the client navigate — that keeps
  the toast and the navigation in one place.

---

## 5. Mutation hook

One hook per mutation, in the route's `_hooks/`:

```ts
export function useCreateSchoolMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSchoolFormField) => {
      const result = await createSchoolAction(input);
      return readSafeActionData(result, "Please check the school details and try again.");
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.schools.all }),
      ]);
    },
  });
}
```

- **`readSafeActionData`** unwraps the `next-safe-action` envelope: it throws `serverError` verbatim
  (already masked server-side) and throws the fallback for validation errors or a missing payload.
  Always use it; never read `result.data` directly.
- **Invalidation belongs in the hook**, not the component, so every call site gets it.
- Use keys from `@/lib/query/keys.ts`. Prefer the broad `*All` key when several filtered variants
  exist — keys are matched as prefixes.
- If the mutation changes something a **server component** rendered, the component also calls
  `router.refresh()`. `invalidateQueries` cannot refresh RSC props.

---

## 6. Errors: which surface

| Failure | Surface |
|---|---|
| A field failed validation | `Field error` — inline, `role="alert"` |
| The submission failed as a whole | `errors.root` banner **and** `toast.error` |
| The session expired | route to `/login` after the toast |
| The backend rejected with a user-meaningful message | `ActionError` → surfaced verbatim |
| Anything internal | masked as `GENERIC_ACTION_ERROR`, logged server-side |

Both channels for a whole-form failure is deliberate: the toast gets attention, the root error stays
on screen after it fades.

---

## 7. Long forms

For anything a user could spend more than a few minutes in (the test builder is the reference):

- **Autosave after idle**, not on every keystroke. The studio waits 12s after the last change.
- **Never nag.** A save blocked by validation reports `blocked` and waits silently — the user is
  mid-edit and knows the row is unfinished. Explicit save still reports the error properly.
- **Always show save state.** `SaveState` / `SaveIndicator` — an icon plus its own wording, never a
  coloured dot. Autosave that doesn't say so is indistinguishable from data loss.
- **`useUnsavedChangesWarning(isDirty)`** for reload/tab-close. Know that it does **not** cover
  in-app `<Link>` navigation — the App Router exposes no interception API.
- **Field arrays**: `useFieldArray`, with `field.id` as the React key. Never the array index — and
  never as `SortableList`'s `ids` either.

---

## 8. Checklist

- [ ] Schema in `_types/_schemas/`, with messages, `.trim()`, and an inferred type
- [ ] The same schema is the action's `inputSchema`
- [ ] `useForm` with `zodResolver` and complete `defaultValues`
- [ ] Every control wrapped in `Field`; `aria-invalid` set
- [ ] `Controller` for non-native controls
- [ ] `noValidate` on the form
- [ ] Submit uses `Button loading={isBusy}`; cancel is disabled while busy
- [ ] Action goes through `actionClient`; only `ActionError` messages reach the client
- [ ] Identity read from the session, never from input
- [ ] Response validated with a zod `responseSchema`
- [ ] Mutation hook unwraps with `readSafeActionData` and invalidates in `onSuccess`
- [ ] `router.refresh()` when server-rendered data changed
- [ ] Success toast, error toast, and `errors.root`
- [ ] All copy through `t()`, in all three catalogs
