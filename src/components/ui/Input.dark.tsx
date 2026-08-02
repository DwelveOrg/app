import React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

type InputProps = React.ComponentPropsWithoutRef<"input"> & {
  showPasswordToggle?: boolean;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, showPasswordToggle = true, ...props }, ref) => {
    const isPassword = type === "password";
    const [visible, setVisible] = React.useState(false);
    const resolvedType = isPassword ? (visible ? "text" : "password") : type;

    if (!isPassword || !showPasswordToggle) {
      return (
        <input
          ref={ref}
          type={type}
          className={cn(
            "w-full rounded-xl border border-border bg-muted px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/35 disabled:cursor-not-allowed disabled:opacity-60",
            className
          )}
          {...props}
        />
      );
    }

    return (
      <div className="relative">
        <input
          ref={ref}
          type={resolvedType}
          className={cn(
            "w-full rounded-xl border border-border bg-muted px-4 py-3 pr-11 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/35 disabled:cursor-not-allowed disabled:opacity-60",
            className
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          className="absolute inset-y-1 right-1 inline-flex w-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-primary focus-visible:outline-none"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
