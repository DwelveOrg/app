export default function SmallContainerLayout({ children }: { children: React.ReactNode }) {
  return (
    // Narrow reading column for profile and settings.
    //
    // This used to mix `container`, `max-w-[80%]`, and two identical breakpoint caps. The 80% rule
    // applied between 500px and 768px, so on a small tablet the column floated with a 10% gutter on
    // each side while the shell around it was already padded — a double inset that looked like a
    // bug. One cap, applied from `md` up, is all this needs.
    <div className="mx-auto w-full md:max-w-[600px]">{children}</div>
  );
}
