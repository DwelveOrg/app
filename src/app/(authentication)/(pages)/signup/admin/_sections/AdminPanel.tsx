import { BarChart3, FileText, School } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  AuthPanelHeading,
  AuthPanelLogo,
} from "@/app/(authentication)/_components/AuthVisualParts";

export default function AdminPanel() {
  const { t } = useTranslation();
  const stats = [
    { value: t("auth.visual.admin.stats.setupValue"), label: t("auth.visual.admin.stats.setup") },
    { value: t("auth.visual.admin.stats.centersValue"), label: t("auth.visual.admin.stats.centers") },
    { value: t("auth.visual.admin.stats.paperValue"), label: t("auth.visual.admin.stats.paper") },
  ];

  const features = [
    {
      icon: <School className="h-4 w-4" />,
      title: t("auth.visual.admin.features.classes.title"),
      desc: t("auth.visual.admin.features.classes.desc"),
    },
    {
      icon: <FileText className="h-4 w-4" />,
      title: t("auth.visual.admin.features.pdf.title"),
      desc: t("auth.visual.admin.features.pdf.desc"),
    },
    {
      icon: <BarChart3 className="h-4 w-4" />,
      title: t("auth.visual.admin.features.analytics.title"),
      desc: t("auth.visual.admin.features.analytics.desc"),
    },
  ];

  const tests = [
    { name: t("auth.visual.admin.classCard.tests.algebra"), pct: 88 },
    { name: t("auth.visual.admin.classCard.tests.geometry"), pct: 72 },
    { name: t("auth.visual.admin.classCard.tests.statistics"), pct: 95 },
  ];

  return (
    <>
      <AuthPanelLogo />

      <div className="flex flex-col gap-7">
        <AuthPanelHeading
          titleLine1={t("auth.visual.admin.titleLine1")}
          titleLine2={t("auth.visual.admin.titleLine2")}
        >
          {t("auth.visual.admin.subtitle")}
        </AuthPanelHeading>

        <div className="flex gap-2">
          {stats.map((stat) => (
            <div key={stat.label} className="flex-1 rounded-xl border border-white/15 bg-white/8 px-3 py-3 text-center backdrop-blur-sm">
              <p className="text-lg font-bold text-white">{stat.value}</p>
              <p className="text-3xs text-white/70">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="w-[280px] rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md shadow-elev-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-white">{t("auth.visual.admin.classCard.title")}</p>
              <p className="mt-0.5 text-3xs text-white/70">{t("auth.visual.admin.classCard.meta")}</p>
            </div>
            <span className="rounded-lg bg-brand-violet-300/20 px-2 py-1 text-3xs font-semibold text-brand-violet-300">
              {t("auth.visual.admin.classCard.status")}
            </span>
          </div>
          <div className="space-y-2">
            {tests.map((item) => (
              <div key={item.name}>
                <div className="mb-1 flex justify-between text-3xs text-white/70">
                  <span>{item.name}</span>
                  <span className="font-semibold text-white">{item.pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10">
                  <div
                    className="h-1.5 rounded-full bg-gradient-to-r from-brand-violet-600 to-brand-violet-300"
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {features.map((feature) => (
            <div key={feature.title} className="flex items-start gap-3">
              <span className="mt-0.5 text-base text-white">{feature.icon}</span>
              <div>
                <p className="text-xs font-semibold text-white">{feature.title}</p>
                <p className="text-2xs text-white/70 leading-relaxed">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-sm text-white/70">
        {t("auth.visual.admin.trustedPrefix")}{" "}
        <span className="font-semibold text-white">{t("auth.visual.admin.trustedStrong")}</span>{" "}
        {t("auth.visual.admin.trustedSuffix")}
      </p>
    </>
  );
}
