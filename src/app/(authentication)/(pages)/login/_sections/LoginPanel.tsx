import { Check, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  AuthPanelHeading,
  AuthPanelLogo,
  AuthStatusBadge,
  SocialProof,
} from "@/app/(authentication)/_components/AuthVisualParts";

export default function LoginPanel() {
  const { t } = useTranslation();
  const bars = [55, 72, 85, 90, 78, 88, 95, 70, 82];
  const avatars = [
    { initials: "AY", color: "from-violet-500 to-purple-600" },
    { initials: "KM", color: "from-blue-500 to-indigo-600" },
    { initials: "SR", color: "from-emerald-500 to-teal-600" },
    { initials: "NB", color: "from-amber-400 to-orange-500" },
  ];

  return (
    <>
      <AuthPanelLogo />

      <div className="flex flex-col gap-6">
        <AuthStatusBadge>{t("auth.visual.login.badge")}</AuthStatusBadge>

        <AuthPanelHeading
          titleLine1={t("auth.visual.login.titleLine1")}
          titleLine2={t("auth.visual.login.titleLine2")}
        >
          {t("auth.visual.login.subtitleLine1")}
          <br />
          {t("auth.visual.login.subtitleLine2")}
        </AuthPanelHeading>

        <div className="w-72 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-white">{t("auth.visual.login.card.subject")}</p>
              <p className="mt-0.5 text-[10px] text-white/45">{t("auth.visual.login.card.meta")}</p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-success/30 bg-success/15 px-2 py-1 text-[10px] font-semibold text-success">
              <Check className="h-3 w-3" />
              {t("auth.visual.login.card.done")}
            </span>
          </div>
          <div className="mb-3 flex h-12 items-end gap-0.5">
            {bars.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-[3px] bg-gradient-to-t from-brand-violet/50 to-brand-violet-300/80 transition-all"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/45">{t("auth.visual.login.card.students")}</span>
            <span className="font-bold text-white">{t("auth.visual.login.card.average")}</span>
          </div>
        </div>

        <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/15 bg-white/8 px-3 py-2 text-xs text-white/70 backdrop-blur-sm">
          <Zap className="h-4 w-4 text-white" />
          <span>
            <strong className="text-white">{t("auth.visual.login.activityStrong")}</strong>{" "}
            {t("auth.visual.login.activityRest")}
          </span>
        </div>
      </div>

      <SocialProof
        avatars={avatars}
        title={t("auth.visual.login.socialTitle")}
        subtitle={t("auth.visual.login.socialSubtitle")}
      />
    </>
  );
}
