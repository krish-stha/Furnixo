export type PendingIntent =
  | { type: "WISHLIST"; productId: string }
  | { type: "ADD_TO_CART"; productId: string; qty: number }
  | { type: "BUY_NOW"; productId: string; qty: number };
 
const KEY = "furnixo_pending_intent";
 
export function setPendingIntent(intent: PendingIntent) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(intent));
  } catch {}
}
 
export function popPendingIntent(): PendingIntent | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY); // consume once
    return JSON.parse(raw) as PendingIntent;
  } catch {
    return null;
  }
}
 