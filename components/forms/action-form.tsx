"use client";

import { startTransition, useActionState, useEffect, useRef, type ComponentProps, type FormEvent } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/lib/action-utils";

/**
 * Menghubungkan server action ke form: menampilkan toast untuk hasilnya
 * dan memanggil `onSuccess` (mis. menutup dialog) saat berhasil.
 */
export function useActionForm(
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>,
  options?: { onSuccess?: (state: NonNullable<ActionState>) => void; silent?: boolean },
) {
  const [state, dispatch, pending] = useActionState(action, null);

  // Dikirim lewat onSubmit (bukan prop `action`) agar React 19 tidak mengosongkan
  // isian form saat server action mengembalikan galat validasi.
  const formProps = {
    onSubmit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      startTransition(() => dispatch(data));
    },
  };
  const onSuccess = useRef(options?.onSuccess);
  const silent = options?.silent;

  useEffect(() => {
    onSuccess.current = options?.onSuccess;
  });

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      if (!silent) toast.success(state.message ?? "Berhasil disimpan");
      onSuccess.current?.(state);
    } else if (state.error && !silent) {
      toast.error(state.error);
    }
  }, [state, silent]);

  return { state, formProps, pending };
}

export function SubmitButton({
  children,
  pendingText,
  pending: pendingProp,
  ...props
}: ComponentProps<typeof Button> & { pendingText?: string; pending?: boolean }) {
  const status = useFormStatus();
  const pending = pendingProp ?? status.pending;
  return (
    <Button type="submit" {...props} disabled={pending || props.disabled}>
      {pending && <Loader2 className="animate-spin" />}
      {pending && pendingText ? pendingText : children}
    </Button>
  );
}

export function FieldError({ state, name }: { state: ActionState; name: string }) {
  const message = state && !state.ok ? state.fieldErrors?.[name] : undefined;
  if (!message) return null;
  return (
    <p role="alert" className="text-xs font-medium text-destructive">
      {message}
    </p>
  );
}
