import type { Metadata } from "next";

import { PRIVATE_ROBOTS } from "@/lib/seo";
import type { AuthLayoutProps } from "./_types/ui";

export const metadata: Metadata = {
  robots: PRIVATE_ROBOTS,
};

const Layout = ({ children }: AuthLayoutProps) => {
  return <div className="min-h-screen w-full">{children}</div>;
};

export default Layout;
