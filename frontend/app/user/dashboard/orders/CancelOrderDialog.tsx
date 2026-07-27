"use client";
 
import { useEffect, useRef, useState } from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { AlertTriangle } from "lucide-react";
 
interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  loading?: boolean;
  onConfirm: (reason: string) => Promise<void> | void;
}
 
export function CancelOrderDialog({ open, onOpenChange, loading, onConfirm }: Props) {
  const [reason, setReason] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
 
  useEffect(() => {
    if (!open) setReason("");
    if (open) setTimeout(() => inputRef.current?.focus(), 80);
  }, [open]);
 
  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        {/* Overlay */}
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
 
        {/* Panel */}
        <AlertDialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 w-[92vw] max-w-md translate-x-[-50%] translate-y-[-50%] rounded-2xl border border-neutral-200 bg-white p-0 shadow-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
 
          {/* Header */}
          <div className="flex items-start gap-4 border-b border-neutral-100 px-6 py-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100">
              <AlertTriangle className="h-4 w-4 text-neutral-700" strokeWidth={2} />
            </span>
            <div>
              <AlertDialogPrimitive.Title className="text-base font-semibold text-neutral-900">
                Cancel this order?
              </AlertDialogPrimitive.Title>
              <AlertDialogPrimitive.Description className="mt-1 text-sm text-neutral-500">
                This cannot be undone. Your items will be released back to stock.
              </AlertDialogPrimitive.Description>
            </div>
          </div>
 
          {/* Reason input */}
          <div className="px-6 py-5">
            <textarea
              ref={inputRef}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Reason for cancellation (optional)"
              disabled={loading}
              className="w-full resize-none rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-colors focus:border-neutral-900 focus:bg-white focus:ring-2 focus:ring-neutral-900/10 disabled:opacity-50"
            />
            <p className="mt-2 text-xs text-neutral-400">
              Your feedback helps us improve. This is entirely optional.
            </p>
          </div>
 
          {/* Actions — safe action is visually dominant */}
          <div className="flex flex-col-reverse gap-2 border-t border-neutral-100 px-6 py-4 sm:flex-row sm:justify-end">
            <AlertDialogPrimitive.Cancel
              disabled={loading}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-neutral-200 bg-white px-5 text-sm font-semibold text-neutral-700 transition-colors hover:border-neutral-900 hover:text-neutral-900 disabled:opacity-50"
            >
              Keep order
            </AlertDialogPrimitive.Cancel>
 
            <AlertDialogPrimitive.Action
              disabled={loading}
              onClick={async (e) => {
                e.preventDefault();
                await onConfirm(reason.trim());
              }}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-neutral-300 bg-white px-5 text-sm font-semibold text-neutral-600 transition-colors hover:border-neutral-500 hover:text-neutral-900 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <path d="M12 3a9 9 0 1 0 9 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                  Cancelling…
                </span>
              ) : "Yes, cancel order"}
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
 