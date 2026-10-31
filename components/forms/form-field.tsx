"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/forms/action-form";
import type { ActionState } from "@/lib/action-utils";
import { cn } from "@/lib/utils";

export function FormField({
  label,
  name,
  state,
  hint,
  className,
  children,
}: {
  label: string;
  name: string;
  state?: ActionState;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      {label && (
        <Label htmlFor={name} className="text-sm font-medium">
          {label}
        </Label>
      )}
      {children}
      {hint && <p className="text-[0.8125rem] text-muted-foreground">{hint}</p>}
      {state !== undefined && <FieldError state={state} name={name} />}
    </div>
  );
}

export function PasswordInput({ className, ...props }: Omit<ComponentProps<typeof Input>, "type">) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input type={show ? "text" : "password"} className={cn("pr-10", className)} {...props} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-faint transition-colors hover:text-foreground"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}
