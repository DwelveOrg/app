# TestCreation API Contract

This document is the frontend contract for test authoring. The backend base URL is
`/api/v1`; every route below requires a bearer token and selected-school context.

Only school `ADMIN` and `TEACHER` roles can use these routes. A teacher can read and
mutate only tests whose `createdById` is their own school membership, and must be
assigned to a class to create a test in it. `STUDENT` receives `403` for every
authoring endpoint.

## Creation modes and question approaches

`format` is chosen once when a draft is created. It supplies the initial section
layout and default duration only; it does not restrict subsequent questions.

`GET /tests/formats` returns the sole source of truth for both formats and question
approaches. Every format's `allowedQuestionTypes` contains the complete catalogue,
so the Basic, IELTS, and SAT families are all available in every test. The client
must send a question `type`, never `answerKind`; the backend derives `answerKind`
from the catalogue.

Some types require a passage or group image (`requiresGroupStimulus: true`). This
requirement follows the selected question type, regardless of the test format.

## Route summary

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/tests/formats` | Format blueprints and question-type catalogue |
| `GET` | `/classes/:classId/tests` | Paginated test summaries for a class |
| `POST` | `/classes/:classId/tests` | Create a draft and its initial tree |
| `GET` | `/tests/:testId` | Read an author-visible test tree and answer keys |
| `PUT` | `/tests/:testId/structure` | Replace a draft's complete section/group/question tree |
| `PATCH` | `/tests/:testId` | Update test metadata only |
| `GET` | `/tests/:testId/validation` | Read publish-readiness issues |
| `POST` | `/tests/:testId/publish` | Validate and publish a draft |
| `POST` | `/tests/:testId/unpublish` | Return a published test to draft status |
| `POST` | `/tests/:testId/duplicate` | Deep-copy a test as a new draft |
| `DELETE` | `/tests/:testId` | Delete a draft or archive a non-draft |
| `POST` | `/tests/:testId/media` | Upload one draft-only image |

## `GET /tests/formats`

Response:

```json
{
  "formats": {
    "SIMPLE_QUIZ": {
      "labelKey": "root.tests.formats.simpleQuiz",
      "defaultDurationMinutes": null,
      "sectionPresets": [
        {
          "kind": "GENERAL",
          "titleKey": "root.tests.sections.general",
          "defaultDurationMinutes": null
        }
      ],
      "allowedQuestionTypes": ["SINGLE_CHOICE", "IELTS_MCQ_SINGLE", "SAT_GRID_IN"],
      "allowsCustomSections": false,
      "requiresGroupStimulus": false,
      "hidesStructure": false
    }
  },
  "questionTypes": {
    "SAT_GRID_IN": {
      "family": "SAT",
      "answerKind": "NUMERIC",
      "labelKey": "root.tests.questionTypes.SAT_GRID_IN.label",
      "descriptionKey": "root.tests.questionTypes.SAT_GRID_IN.description",
      "requiresGroupStimulus": false,
      "autoGradable": true,
      "defaultPoints": 1
    }
  }
}
```

The arrays in the example are shortened for readability. In the current contract,
each format returns every key in `questionTypes`. A question-type entry has:

| Field | Meaning |
|---|---|
| `family` | `BASIC`, `IELTS`, or `SAT` grouping of the approach |
| `answerKind` | Server-derived answer engine: `SINGLE_CHOICE`, `MULTI_CHOICE`, `TEXT`, `NUMERIC`, `MATCHING`, `ORDERING`, or `MANUAL` |
| `labelKey`, `descriptionKey` | Translation keys supplied by the backend |
| `requiresGroupStimulus` | A non-empty group `passage` or `imageUrl` is required before publishing |
| `autoGradable`, `defaultPoints` | Behaviour and default value for a new question |
| `minOptions`, `maxOptions`, `fixedOptions` | Optional option constraints for this approach |

## Create and list drafts

### `POST /classes/:classId/tests`

Request:

```json
{
  "title": "Mixed practice",
  "format": "SIMPLE_QUIZ"
}
```

Allowed formats are `SIMPLE_QUIZ`, `IELTS`, `SAT`, and `CUSTOM`. The response is
`{ "test": TestDetail }`. The new test has status `DRAFT`, an initial section and
group tree from the selected format, and no questions.

### `GET /classes/:classId/tests`

Optional query parameters:

```txt
status=DRAFT|PUBLISHED|ARCHIVED
page=1
limit=20
```

Response:

```json
{
  "tests": [{ "id": "…", "title": "Mixed practice", "format": "SIMPLE_QUIZ", "status": "DRAFT", "totalPoints": 0 }],
  "meta": { "page": 1, "limit": 20, "total": 1, "totalPages": 1, "hasMore": false }
}
```

## Read and save the test tree

### `GET /tests/:testId`

Returns `{ "test": TestDetail }`, including sections, groups, questions, options,
and answer-key data. The author response may include `isCorrect`, `matchKey`, and
question `config`; this data must not be exposed to students.

Rows are ordered by `orderIndex`, and `questionNumber` is computed by the server.
Do not send `questionNumber` in a write request.

### `PUT /tests/:testId/structure`

This is a complete draft-only replacement. Existing `id` values update their rows;
objects without an `id` are created; existing rows omitted from the request are
deleted. IDs must belong to this test and may appear at most once.

```json
{
  "sections": [
    {
      "id": "existing-section-id",
      "title": "Practice",
      "kind": "GENERAL",
      "durationMinutes": null,
      "groups": [
        {
          "id": "existing-group-id",
          "passage": "A short text used by the IELTS question.",
          "questions": [
            {
              "type": "IELTS_TRUE_FALSE_NOT_GIVEN",
              "prompt": "The text is about test authoring.",
              "points": 1,
              "options": [
                { "text": "TRUE", "isCorrect": true },
                { "text": "FALSE", "isCorrect": false },
                { "text": "NOT GIVEN", "isCorrect": false }
              ]
            },
            {
              "type": "SAT_GRID_IN",
              "prompt": "What is 6 × 7?",
              "points": 1,
              "config": { "answer": 42 },
              "options": []
            }
          ]
        }
      ]
    }
  ]
}
```

The response is `{ "test": TestDetail }` with server IDs, derived `answerKind`,
contiguous `orderIndex` values, recomputed `questionNumber`, and recomputed
`totalPoints`.

Question fields are `id?`, `type`, `prompt`, `helpText?`, `imageUrl?`, `points?`,
`config?`, and `options`. Each option supports `id?`, `text`, `label?`,
`imageUrl?`, `isCorrect?`, and `matchKey?`. `sections` must contain at least one
section; every section requires at least one group. A test may contain up to 300
questions.

Answer-key storage depends on the derived `answerKind`:

| Kind | Required data when publishing |
|---|---|
| `SINGLE_CHOICE` | Exactly one option with `isCorrect: true` |
| `MULTI_CHOICE` | At least one option with `isCorrect: true` |
| `TEXT` | `config.acceptedAnswers` string array |
| `NUMERIC` | `config.answer` finite number |
| `MATCHING` | Option `matchKey`s and `config.rightItems: [{ key, text }]` |
| `ORDERING` | At least two options; their order is the answer order |
| `MANUAL` | Optional `config.minWords`, `maxWords`, and `rubric`; no answer key |

## Update metadata

### `PATCH /tests/:testId`

Sends any subset of `title`, `description`, `instructions`, `durationMinutes`,
`passingScore`, `shuffleQuestions`, `availableFrom`, and `availableUntil`.
Nullable fields accept `null` to clear a value. Datetimes are ISO-8601 strings.
The endpoint returns `{ "test": TestDetail }`. Archived tests cannot be edited.

## Validate and change status

### `GET /tests/:testId/validation`

Returns the live publish result:

```json
{
  "ok": false,
  "issues": [
    {
      "code": "GROUP_STIMULUS_REQUIRED",
      "messageKey": "root.tests.validation.groupStimulusRequired",
      "sectionId": "…",
      "groupId": "…",
      "questionId": "…"
    }
  ]
}
```

Issue IDs are optional and identify the affected tree item. Publication checks cover
empty sections, invalid answer keys, invalid points, missing required stimulus,
availability windows, and a passing score above the total points.

### `POST /tests/:testId/publish`

Validates the current draft, sets status to `PUBLISHED`, sends class notifications,
and returns `{ "test": TestDetail }`. If validation fails, it returns `409` with:

```json
{
  "statusCode": 409,
  "message": {
    "message": "Test is not ready to publish",
    "issues": []
  }
}
```

### Other status and lifecycle routes

`POST /tests/:testId/unpublish` moves a published test back to `DRAFT` and returns
`{ "success": true }`. `POST /tests/:testId/duplicate` deep-copies the full tree as
a new draft and returns `{ "test": TestDetail }`. `DELETE /tests/:testId` deletes a
draft; for published or archived tests it sets status to `ARCHIVED`. Both deletion
outcomes return `{ "success": true }`.

## `POST /tests/:testId/media`

Use `multipart/form-data` with one `image` file. JPEG, PNG, and WebP files up to
5 MB are accepted for draft tests only. The response is:

```json
{ "url": "/api/v1/uploads/test-media/example.webp" }
```

Store the returned URL in a group or question `imageUrl` in the next structure save.
The endpoint is rate-limited and returns an error for a published or archived test.

## Error behaviour

`400` denotes invalid DTO or answer configuration, `401` no valid bearer token,
`403` an unauthorized role, `404` a class/test unavailable in the selected school or
to the current teacher, and `409` a draft-status race or failed publishing check.
