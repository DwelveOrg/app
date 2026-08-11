import DwelveLogo from "@/components/Custom/DwelveLogo";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border bg-card/90 px-5 py-4 shadow-elev-1">
        <div className="mx-auto flex w-full max-w-6xl items-center">
          <DwelveLogo variant="form" />
        </div>
      </header>
      <main className="mx-auto flex min-h-[calc(100dvh-69px)] w-full max-w-6xl items-center justify-center px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
