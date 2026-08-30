import type { ReactNode } from "react";

export type AuthLayoutProps = Readonly<{
  children: ReactNode;
}>;

export type LoginPageClientProps = {
  deleted?: string;
  logout?: string;
  telegram?: string;
  /** Root-relative path to return to after a successful login (e.g. an invite). */
  next?: string;
};
