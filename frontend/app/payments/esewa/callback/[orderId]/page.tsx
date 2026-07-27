"use client";
 
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { verifyEsewaPayment } from "@/lib/api/payment";
 
type Phase = "verifying" | "success" | "failed";
 
function EsewaCallbackInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const params = useParams<{ orderId: string }>();
  const ran = useRef(false);
 
  const orderId = useMemo(() => String(params?.orderId || ""), [params]);
  const data = useMemo(() => sp.get("data") || "", [sp]);
 
  const [phase, setPhase] = useState<Phase>("verifying");
  const [title, setTitle] = useState("Verifying your payment");
  const [subtitle, setSubtitle] = useState("Please wait — this usually takes a few seconds.");
 
  const goOrder = (paid: 0 | 1) =>
    router.replace(`/user/dashboard/orders/${orderId}?paid=${paid}`);
 
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
 
    if (!orderId || !data) {
      setPhase("failed");
      setTitle("Verification failed");
      setSubtitle("Missing payment information. Please try again from your order page.");
      setTimeout(() => goOrder(0), 1500);
      return;
    }
 
    (async () => {
      try {
        await verifyEsewaPayment({ orderId, data });
        setPhase("success");
        setTitle("Payment verified!");
        setSubtitle("Redirecting you to your order…");
        setTimeout(() => goOrder(1), 1000);
      } catch (e) {
        console.error("eSewa verify failed:", e);
        setPhase("failed");
        setTitle("Verification failed");
        setSubtitle(
          "We couldn't confirm your payment. If money was deducted, don't worry — contact support with your order ID."
        );
        setTimeout(() => goOrder(0), 1500);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, data]);
 
  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-6">
      <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          {/* status icon */}
          <div
            className={[
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border",
              phase === "verifying" ? "border-neutral-200 bg-neutral-100" : "",
              phase === "success"   ? "border-neutral-900 bg-neutral-900" : "",
              phase === "failed"    ? "border-red-200 bg-red-50" : "",
            ].join(" ")}
          >
            {phase === "verifying" && (
              <svg className="h-5 w-5 animate-spin text-neutral-600" viewBox="0 0 24 24" fill="none">
                <path d="M12 3a9 9 0 1 0 9 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            )}
            {phase === "success" && (
              <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {phase === "failed" && (
              <svg className="h-5 w-5 text-red-600" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            )}
          </div>
 
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-neutral-900">{title}</h1>
            <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
 
            {/* order ID */}
            <div className="mt-4 rounded-lg bg-neutral-50 border border-neutral-200 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Order</p>
              <p className="mt-1 font-mono text-sm text-neutral-900 break-all">
                #{String(orderId).slice(-8).toUpperCase()}
              </p>
            </div>
 
            {/* progress bar while verifying */}
            {phase === "verifying" && (
              <div className="mt-4">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                  <div className="h-full w-1/2 animate-pulse rounded-full bg-neutral-400" />
                </div>
                <p className="mt-2 text-xs text-neutral-400">
                  Don't close this tab while verification is in progress.
                </p>
              </div>
            )}
 
            {/* success note */}
            {phase === "success" && (
              <p className="mt-4 text-xs text-neutral-400">
                Not redirected?{" "}
                <button
                  onClick={() => goOrder(1)}
                  className="font-semibold text-neutral-900 underline-offset-4 hover:underline"
                >
                  Click here
                </button>
              </p>
            )}
 
            {/* failed actions */}
            {phase === "failed" && (
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => goOrder(0)}
                  className="inline-flex h-9 items-center rounded-lg border border-neutral-200 px-4 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-900"
                >
                  Back to order
                </button>
                <button
                  onClick={() => { ran.current = false; window.location.reload(); }}
                  className="inline-flex h-9 items-center rounded-lg bg-neutral-900 px-4 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
                >
                  Try again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
 
export default function EsewaCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <div className="text-sm text-neutral-500">Loading…</div>
        </div>
      }
    >
      <EsewaCallbackInner />
    </Suspense>
  );
}