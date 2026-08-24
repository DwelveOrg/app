import type { Metadata } from "next";

/** The marketing site's origin (a separate repository, `DwelveOrg/frontend`). */
export const SITE_URL = "https://dwelve.uz" as const;

/** This application's own canonical origin. */
export const APP_SITE_URL = "https://app.dwelve.uz" as const;
export const HOME_TITLE = "Dwelve | AI-Powered Online Tests for Schools" as const;
export const HOME_DESCRIPTION =
  "Create, manage, and grade online tests with AI. Dwelve helps teachers, schools, and learning centers turn educational materials into tests and analyze student performance." as const;

export const PRIVATE_ROBOTS: Metadata["robots"] = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: {
    index: false,
    follow: false,
    noimageindex: true,
  },
};
