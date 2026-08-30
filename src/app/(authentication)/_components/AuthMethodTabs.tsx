"use client";

import React from "react";
import { Mail } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import GoogleIcon from "./GoogleIcon";
import TelegramIcon from "./TelegramIcon";

export type AuthMethod = "email" | "google" | "telegram";

type AuthMethodTabsProps = {
  value: AuthMethod;
  onChange: (method: AuthMethod) => void;
  /** Accessible name of the chooser: "Sign in with" / "Sign up with". */
  label: string;
  labels: Record<AuthMethod, string>;
  children: React.ReactNode;
};

/**
 * The one choice every auth screen opens with: how to identify yourself.
 *
 * Three methods that behave very differently — a form, a Google chooser, and a
 * conversation with a Telegram bot — each get their own panel rather than being
 * stacked into one column, so the screen can explain the method that was
 * picked instead of describing all three at once.
 */
export function AuthMethodTabs({ value, onChange, label, labels, children }: AuthMethodTabsProps) {
  return (
    <Tabs value={value} onValueChange={(next) => onChange(next as AuthMethod)} className="gap-5">
      <TabsList aria-label={label} className="grid h-11 w-full grid-cols-3 rounded-xl">
        <TabsTrigger value="email" className="rounded-lg">
          <Mail aria-hidden />
          {labels.email}
        </TabsTrigger>
        <TabsTrigger value="google" className="rounded-lg">
          <GoogleIcon />
          {labels.google}
        </TabsTrigger>
        <TabsTrigger value="telegram" className="rounded-lg">
          <TelegramIcon />
          {labels.telegram}
        </TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  );
}

export function AuthMethodPanel({
  className,
  ...props
}: React.ComponentProps<typeof TabsContent>) {
  return <TabsContent {...props} className={cn("text-base", className)} />;
}
