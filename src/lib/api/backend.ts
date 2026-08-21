import "server-only";

import { z } from "zod";

const DEFAULT_API_BASE_URL = "http://localhost:5000/api/v1";
const DEFAULT_TIMEOUT_MS = 15_000;

type QueryValue = string | number | boolean | null | undefined;
type QueryParams = Record<string, QueryValue>;

const backendErrorBodySchema = z
  .object({
    message: z.union([z.string(), z.array(z.string())]).optional(),
    error: z.string().optional(),
    statusCode: z.number().optional(),
  })
  .passthrough();

type BackendErrorBody = z.infer<typeof backendErrorBodySchema>;

export type BackendRequestInit<TSchema extends z.ZodTypeAny | undefined = undefined> =
  Omit<RequestInit, "body"> & {
    body?: unknown;
    query?: QueryParams;
    responseSchema?: TSchema;
    timeoutMs?: number;
  };

export class BackendApiError extends Error {
  constructor(
    message: string,
    public readonly status = 0,
    public readonly body: unknown = null,
  ) {
    super(message);
    this.name = "BackendApiError";
  }
}

export class BackendResponseValidationError extends Error {
  constructor(
    path: string,
    public readonly issues: z.ZodIssue[],
  ) {
    super(`Invalid response received from backend for ${path}.`);
    this.name = "BackendResponseValidationError";
  }
}

function getApiBaseUrl() {
  const configuredBaseUrl = process.env.DWELVE_API_BASE_URL;

  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/+$/, "");
  }

  if (process.env.NODE_ENV === "development") {
    return DEFAULT_API_BASE_URL.replace(/\/+$/, "");
  }

  throw new Error(
    "DWELVE_API_BASE_URL is not set. Refusing to fall back to localhost outside development.",
  );
}

function withQuery(path: string, query?: QueryParams) {
  if (!query) {
    return path;
  }

  const [pathname, existingQuery = ""] = path.split("?");
  const params = new URLSearchParams(existingQuery);

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) {
      params.set(key, String(value));
    }
  }

  const queryString = params.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

function getErrorMessage(body: BackendErrorBody | null) {
  if (Array.isArray(body?.message)) {
    return body.message.join(" ");
  }

  return body?.message ?? body?.error ?? "Something went wrong. Please try again.";
}

async function readJson(response: Response): Promise<unknown | null> {
  if (response.status === 204) {
    return null;
  }

  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function isJsonBody(body: unknown) {
  return (
    body !== undefined &&
    body !== null &&
    typeof body !== "string" &&
    !(body instanceof FormData) &&
    !(body instanceof Blob) &&
    !(body instanceof URLSearchParams) &&
    !(body instanceof ArrayBuffer)
  );
}

function createTimeoutSignal(signal: AbortSignal | null | undefined, timeoutMs: number) {
  if (timeoutMs <= 0) {
    return signal ?? undefined;
  }

  const timeoutSignal = AbortSignal.timeout(timeoutMs);

  if (!signal) {
    return timeoutSignal;
  }

  const controller = new AbortController();
  const abort = () => controller.abort();
  const listenerOptions: AddEventListenerOptions = { once: true, signal: controller.signal };

  signal.addEventListener("abort", abort, listenerOptions);
  timeoutSignal.addEventListener("abort", abort, listenerOptions);

  return controller.signal;
}

export async function backendJson<TSchema extends z.ZodTypeAny>(
  path: string,
  init: BackendRequestInit<TSchema>,
): Promise<z.infer<TSchema>>;
export async function backendJson<TResponse = unknown>(
  path: string,
  init?: BackendRequestInit,
): Promise<TResponse>;
export async function backendJson(
  path: string,
  init: BackendRequestInit<z.ZodTypeAny | undefined> = {},
): Promise<unknown> {
  const { body, query, responseSchema, timeoutMs = DEFAULT_TIMEOUT_MS, ...requestInit } = init;
  const url = `${getApiBaseUrl()}${withQuery(path, query)}`;
  const headers = new Headers(requestInit.headers);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (!headers.has("X-Request-Id")) {
    headers.set("X-Request-Id", crypto.randomUUID());
  }

  const shouldSerializeJson = isJsonBody(body);

  if (shouldSerializeJson && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...requestInit,
    cache: requestInit.cache ?? "no-store",
    headers,
    signal: createTimeoutSignal(requestInit.signal, timeoutMs),
    body:
      body === undefined
        ? undefined
        : shouldSerializeJson
          ? JSON.stringify(body)
          : (body as BodyInit),
  });

  const responseBody = await readJson(response);

  if (!response.ok) {
    const parsedError = backendErrorBodySchema.safeParse(responseBody);
    throw new BackendApiError(
      getErrorMessage(parsedError.success ? parsedError.data : null),
      response.status,
      responseBody,
    );
  }

  if (!responseSchema) {
    return responseBody;
  }

  const parsed = responseSchema.safeParse(responseBody);

  if (!parsed.success) {
    throw new BackendResponseValidationError(path, parsed.error.issues);
  }

  return parsed.data;
}
