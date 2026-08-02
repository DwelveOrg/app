import React, { ReactNode } from 'react'

export default function LiquidCard({ children }: { children: ReactNode }) {
  return (
    <article
      className="relative overflow-hidden rounded-3xl border border-white/35 bg-white/20 p-6 backdrop-blur-2xl shadow-[0_12px_40px_rgba(31,38,135,0.18)] dark:border-white/15 dark:bg-white/10 dark:shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/55 via-white/20 to-transparent dark:from-white/20 dark:via-white/5" />
      <div className="pointer-events-none absolute -top-16 -right-16 h-32 w-32 rounded-full bg-white/45 blur-2xl dark:bg-white/15" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-36 w-36 rounded-full bg-primary/20 blur-3xl dark:bg-primary/15" />
      <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/40 dark:ring-white/20" />
      <div className="relative">{children}</div>
    </article>
  );
}
