import { cn } from "@/lib/utils";
import type { TelegramAuthStatus } from "../_utils/telegram-start";

type TelegramAuthNoticeProps = {
  status?: TelegramAuthStatus;
  message?: string;
};

export default function TelegramAuthNotice({
  status,
  message,
}: Readonly<TelegramAuthNoticeProps>) {
  if (!status || !message) return null;

  const cancelled = status === "cancelled";
  return (
    <div
      role={cancelled ? "status" : "alert"}
      className={cn(
        "rounded-xl border px-4 py-3 text-sm",
        cancelled
          ? "border-border bg-muted text-foreground"
          : "border-destructive/25 bg-destructive/10 text-destructive",
      )}
    >
      {message}
    </div>
  );
}
