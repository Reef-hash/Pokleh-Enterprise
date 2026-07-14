import { toast } from "sonner";
import { billingConfig } from "@/config/billing";

export function isBillingLocked(): boolean {
  return billingConfig.status !== "paid";
}

const LOCK_MESSAGE =
  "Akses ditamatkan sementara — bayaran pembangunan tertunggak. Sila hubungi Zarif untuk menyelesaikan bayaran.";

/** Call at the start of every write (create/update/delete). Returns true — and toasts — if writes are currently blocked. */
export function blockIfBillingLocked(): boolean {
  if (!isBillingLocked()) return false;
  toast.error(LOCK_MESSAGE);
  return true;
}

/** Builds a wa.me link to the billing contact with a prefilled message. */
export function buildBillingWhatsAppLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "").replace(/^0/, "60");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
