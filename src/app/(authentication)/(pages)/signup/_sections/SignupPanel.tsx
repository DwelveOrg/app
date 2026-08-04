import { BarChart3, FileText, Smartphone, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  AuthPanelHeading,
  AuthPanelLogo,
  FeatureTile,
  SocialProof,
} from "@/app/(authentication)/_components/AuthVisualParts";

export default function SignupPanel() {
  const { t } = useTranslation();
  const features = [
    { icon: <Zap className="h-4 w-4" />, label: t("auth.visual.signup.features.grading") },
    { icon: <BarChart3 className="h-4 w-4" />, label: t("auth.visual.signup.features.analytics") },
    { icon: <FileText className="h-4 w-4" />, label: t("auth.visual.signup.features.pdf") },
    { icon: <Smartphone className="h-4 w-4" />, label: t("auth.visual.signup.features.device") },
  ];

  const avatars = [
    { initials: "JK", color: "var(--chart-4)" },
    { initials: "LM", color: "var(--chart-2)" },
    { initials: "TA", color: "var(--chart-1)" },
  ];

  return (
    <>
      <AuthPanelLogo />

      <div className="flex flex-col gap-7">
        <AuthPanelHeading
          titleLine1={t("auth.visual.signup.titleLine1")}
          titleLine2={t("auth.visual.signup.titleLine2")}
        >
          {t("auth.visual.signup.subtitle")}
        </AuthPanelHeading>

        <div className="grid grid-cols-2 gap-2.5">
          {features.map((feature) => (
            <FeatureTile key={feature.label} icon={feature.icon} label={feature.label} />
          ))}
        </div>

        <div className="w-64 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md shadow-elev-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-3xs text-white/70">{t("auth.visual.signup.score.subject")}</p>
              <p className="text-xs font-semibold text-white">{t("auth.visual.signup.score.title")}</p>
            </div>
            <div className="relative flex h-12 w-12 items-center justify-center">
              <svg viewBox="0 0 36 36" className="absolute inset-0 h-full w-full -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="14"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="87.96 100"
                  pathLength="100"
                />
              </svg>
              <span className="relative text-2xs font-bold text-white">94%</span>
            </div>
          </div>
          <div className="flex gap-1.5">
            {["A", "B", "A+", "B+", "A"].map((grade, i) => (
              <div key={i} className="flex-1 rounded-lg bg-white/12 py-1.5 text-center text-3xs font-semibold text-white">
                {grade}
              </div>
            ))}
          </div>
          <p className="mt-2 text-right text-3xs text-white/70">{t("auth.visual.signup.score.caption")}</p>
        </div>
      </div>

      <SocialProof
        avatars={avatars}
        title={t("auth.visual.signup.socialTitle")}
        subtitle={t("auth.visual.signup.socialSubtitle")}
      />
    </>
  );
}
