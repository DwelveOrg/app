"use client";

import { useCallback, useSyncExternalStore } from "react";

import {
  appearanceStorageKey,
  DEFAULT_APPEARANCE,
  isExamTextSize,
  isExamTheme,
  type ExamAppearance,
  type ExamEnvironmentKind,
  type ExamTextSize,
  type ExamTheme,
} from "../_lib/exam-environment";


type Listener = () => void;

const listeners = new Set<Listener>();
const snapshots = new Map<string, ExamAppearance>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  const onStorage = () => {
    snapshots.clear();
    listener();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function read(kind: ExamEnvironmentKind): ExamAppearance {
  const key = appearanceStorageKey(kind);
  const cached = snapshots.get(key);
  if (cached) return cached;

  const fallback = DEFAULT_APPEARANCE[kind];
  let value = fallback;

  try {
    const stored = window.localStorage.getItem(key);
    if (stored) {
      const record = (JSON.parse(stored) ?? {}) as Record<string, unknown>;
      value = {
        theme: isExamTheme(record.theme) ? record.theme : fallback.theme,
        textSize: isExamTextSize(record.textSize) ? record.textSize : fallback.textSize,
      };
    }
  } catch {
    value = fallback;
  }

  snapshots.set(key, value);
  return value;
}

function write(kind: ExamEnvironmentKind, next: ExamAppearance) {
  const key = appearanceStorageKey(kind);
  snapshots.set(key, next);
  try {
    window.localStorage.setItem(key, JSON.stringify(next));
  } catch {
  }
  emit();
}

export function useExamAppearance(kind: ExamEnvironmentKind) {
  const appearance = useSyncExternalStore(
    subscribe,
    () => read(kind),
    () => DEFAULT_APPEARANCE[kind],
  );

  const setTheme = useCallback(
    (theme: ExamTheme) => write(kind, { ...read(kind), theme }),
    [kind],
  );

  const setTextSize = useCallback(
    (textSize: ExamTextSize) => write(kind, { ...read(kind), textSize }),
    [kind],
  );

  return { appearance, setTheme, setTextSize };
}
