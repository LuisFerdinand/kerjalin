"use client";

import { useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SubmitButton, useActionForm } from "@/components/forms/action-form";
import type { ActionState } from "@/lib/action-utils";
import { cn } from "@/lib/utils";

type ServerAction = (prev: ActionState, formData: FormData) => Promise<ActionState>;

type FormDialogProps = {
  title: string;
  description?: ReactNode;
  trigger?: ReactNode;
  action: ServerAction;
  submitLabel?: string;
  pendingLabel?: string;
  destructive?: boolean;
  /** Lebar dialog. */
  size?: "sm" | "md" | "lg";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: (state: NonNullable<ActionState>) => void;
  children: (state: ActionState) => ReactNode;
};

const sizes = { sm: "sm:max-w-md", md: "sm:max-w-lg", lg: "sm:max-w-2xl" } as const;

/** Dialog berisi form yang terhubung ke server action. */
export function FormDialog({
  open: controlledOpen,
  onOpenChange,
  trigger,
  size = "md",
  ...rest
}: FormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (v: boolean) => {
    setInternalOpen(v);
    onOpenChange?.(v);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className={cn("max-h-[92vh] overflow-y-auto", sizes[size])}>
        <FormBody {...rest} close={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function FormBody({
  title,
  description,
  action,
  submitLabel = "Simpan",
  pendingLabel = "Menyimpan...",
  destructive,
  onSuccess,
  children,
  close,
}: Omit<FormDialogProps, "open" | "onOpenChange" | "trigger" | "size"> & { close: () => void }) {
  const { state, formProps, pending } = useActionForm(action, {
    onSuccess: (s) => {
      onSuccess?.(s);
      close();
    },
  });

  return (
    <form {...formProps} className="grid gap-5">
      <DialogHeader>
        <DialogTitle className="text-lg font-extrabold text-navy">{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
      </DialogHeader>

      <div className="grid gap-4">{children(state)}</div>

      {state && !state.ok && state.error && !state.fieldErrors && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={close}>
          Batal
        </Button>
        <SubmitButton pending={pending} variant={destructive ? "destructive" : "default"} pendingText={pendingLabel}>
          {submitLabel}
        </SubmitButton>
      </DialogFooter>
    </form>
  );
}
