"use client";
 
import { useEffect, useRef, useState } from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { RotateCcw, PackageX, Clock } from "lucide-react";
 
interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  orderTotal: number;
  alreadyRequestedRs: number;
  loading?: boolean;
  onSubmit: (amount: number, reason: string) => Promise<void> | void;
  isReturnMode?: boolean;   // true when order is delivered (14-day return window)
  daysRemaining?: number;   // remaining days in return window
}
 
export function RefundRequestDialog({
  open, onOpenChange, orderTotal, alreadyRequestedRs,
  loading, onSubmit, isReturnMode, daysRemaining,
}: Props) {
  const maxRefundable  = Math.max(0, orderTotal - alreadyRequestedRs);
  const fullyRequested = maxRefundable <= 0;
 
  const [amount,  setAmount]  = useState("");
  const [reason,  setReason]  = useState("");
  const [touched, setTouched] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);
 
  useEffect(() => {
    if (!open) { setAmount(""); setReason(""); setTouched(false); }
    if (open && !fullyRequested) setTimeout(() => amountRef.current?.focus(), 80);
  }, [open, fullyRequested]);
 
  const numAmount  = Number(amount);
  const amountValid =
    amount !== "" && Number.isFinite(numAmount) && numAmount > 0 && numAmount <= maxRefundable;
 
  const amountError = (() => {
    if (!touched || amount === "") return null;
    if (!Number.isFinite(numAmount) || numAmount <= 0)
      return "Enter a valid amount greater than zero.";
    if (numAmount > maxRefundable)
      return `Maximum you can request is Rs. ${maxRefundable.toLocaleString("en-IN")}.`;
    return null;
  })();
 
  const pctRequested = orderTotal > 0
    ? Math.min(100, Math.round((alreadyRequestedRs / orderTotal) * 100))
    : 0;
 
  const title    = isReturnMode ? "Request a return" : "Request a refund";
  const subtitle = isReturnMode
    ? "We'll review your return request within 1–2 business days."
    : "Refunds are processed manually within 3–5 business days.";
  const Icon = isReturnMode ? PackageX : RotateCcw;
 
  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
 
        <AlertDialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 w-[92vw] max-w-md translate-x-[-50%] translate-y-[-50%] rounded-2xl border border-neutral-200 bg-white p-0 shadow-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
 
          {/* Header */}
          <div className="flex items-start gap-4 border-b border-neutral-100 px-6 py-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100">
              <Icon className="h-4 w-4 text-neutral-700" strokeWidth={2} />
            </span>
            <div className="flex-1">
              <AlertDialogPrimitive.Title className="text-base font-semibold text-neutral-900">
                {title}
              </AlertDialogPrimitive.Title>
              <AlertDialogPrimitive.Description className="mt-0.5 text-sm text-neutral-500">
                {subtitle}
              </AlertDialogPrimitive.Description>
              {/* Return window countdown */}
              {isReturnMode && daysRemaining !== undefined && (
                <div className="mt-2 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-600" strokeWidth={2} />
                  <span className="text-xs font-semibold text-amber-700">
                    {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} remaining in return window
                  </span>
                </div>
              )}
            </div>
          </div>
 
          {/* Body */}
          <div className="space-y-4 px-6 py-5">
 
            {/* Order total breakdown */}
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm">
              <div className="flex justify-between text-neutral-500 mb-2">
                <span>Order total</span>
                <span className="font-semibold text-neutral-900">Rs. {orderTotal.toLocaleString("en-IN")}</span>
              </div>
              {alreadyRequestedRs > 0 && (
                <>
                  <div className="flex justify-between text-neutral-500 mb-2">
                    <span>Already requested</span>
                    <span className="font-semibold text-neutral-700">
                      − Rs. {alreadyRequestedRs.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-200">
                    <div
                      className="h-full rounded-full bg-neutral-400 transition-all"
                      style={{ width: `${pctRequested}%` }}
                    />
                  </div>
                </>
              )}
              <div className="flex justify-between mt-2 border-t border-neutral-200 pt-2">
                <span className="font-medium text-neutral-700">Available to {isReturnMode ? "return" : "refund"}</span>
                <span className={`font-bold ${fullyRequested ? "text-neutral-400" : "text-neutral-900"}`}>
                  {fullyRequested ? "Rs. 0 remaining" : `Rs. ${maxRefundable.toLocaleString("en-IN")}`}
                </span>
              </div>
            </div>
 
            {fullyRequested ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                You have already submitted requests totalling the full order amount.
                Please wait for them to be reviewed.
              </div>
            ) : (
              <>
                {/* Amount */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    {isReturnMode ? "Return" : "Refund"} amount (Rs.)
                  </label>
                 
<div className="flex h-11 overflow-hidden rounded-lg border transition-colors
  focus-within:border-neutral-900 focus-within:ring-2 focus-within:ring-neutral-900/10
  border-neutral-200 bg-white">
  <span className="flex items-center bg-neutral-100 px-3 text-sm font-medium text-neutral-500 border-r border-neutral-200 select-none shrink-0">
    Rs.
  </span>
  <input
    ref={amountRef}
    type="number"
    inputMode="numeric"
    min={1}
    max={maxRefundable}
    step={1}
    value={amount}
    disabled={loading}
    placeholder={`Max ${maxRefundable.toLocaleString("en-IN")}`}
    onChange={(e) => { setAmount(e.target.value); setTouched(true); }}
    onBlur={() => setTouched(true)}
    className={[
      "h-full flex-1 bg-white px-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 disabled:opacity-50",
      amountError ? "text-red-600" : "",
    ].join(" ")}
  />
</div>
                  {amountError ? (
                    <p className="mt-1.5 text-xs text-red-600">{amountError}</p>
                  ) : amount !== "" && amountValid ? (
                    <p className="mt-1.5 text-xs text-neutral-400">
                      You're requesting Rs. {Number(amount).toLocaleString("en-IN")} of Rs. {orderTotal.toLocaleString("en-IN")} paid.
                    </p>
                  ) : null}
                </div>
 
                {/* Reason */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Reason <span className="normal-case font-normal text-neutral-400">(optional)</span>
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    disabled={loading}
                    placeholder={
                      isReturnMode
                        ? "e.g. Item damaged on arrival, not as described…"
                        : "e.g. Changed my mind, item arrived damaged…"
                    }
                    className="w-full resize-none rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-colors focus:border-neutral-900 focus:bg-white focus:ring-2 focus:ring-neutral-900/10 disabled:opacity-50"
                  />
                </div>
              </>
            )}
          </div>
 
          {/* Actions */}
          <div className="flex flex-col-reverse gap-2 border-t border-neutral-100 px-6 py-4 sm:flex-row sm:justify-end">
            <AlertDialogPrimitive.Cancel
              disabled={loading}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-neutral-200 bg-white px-5 text-sm font-semibold text-neutral-700 transition-colors hover:border-neutral-900 hover:text-neutral-900 disabled:opacity-50"
            >
              Close
            </AlertDialogPrimitive.Cancel>
 
            {!fullyRequested && (
              <AlertDialogPrimitive.Action
                disabled={loading || !amountValid}
                onClick={async (e) => {
                  e.preventDefault();
                  if (!amountValid) return;
                  await onSubmit(Number(amount), reason.trim());
                }}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-neutral-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <path d="M12 3a9 9 0 1 0 9 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                    Submitting…
                  </span>
                ) : `Submit ${isReturnMode ? "return" : "request"}`}
              </AlertDialogPrimitive.Action>
            )}
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
 