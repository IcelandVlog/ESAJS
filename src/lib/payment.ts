// Reunion fee payment: offline/manual only. Student sends the fee directly to the
// school's own bKash/Nagad/Rocket number and types in the TrxID for an admin to verify.
//
// (An earlier version of this file also supported an online SSLCommerz gateway —
// removed for now since it needs a verified merchant account. The offline flow below
// has no such dependency and needs no external account at all.)

export type OfflineMethod = "bkash" | "nagad" | "rocket";

// The school's own personal/merchant numbers that students send money to by hand.
// Set these in .env; leave any of them blank to hide that option.
export function getOfflineNumbers(): Record<OfflineMethod, string> {
  return {
    bkash: process.env.REUNION_BKASH_NUMBER || "",
    nagad: process.env.REUNION_NAGAD_NUMBER || "",
    rocket: process.env.REUNION_ROCKET_NUMBER || "",
  };
}

export function getOfflinePayeeName(): string {
  return process.env.REUNION_PAYMENT_PAYEE_NAME || "";
}

// USSD codes to dial each service's menu (works with any operator, no internet needed).
// These just open the phone's own dialer with the code pre-typed — the user still has
// to tap the call button themselves and then enter the number/amount on the menu; a
// webpage can't auto-dial or drive the USSD menu, and there's no public deep-link that
// lets a website pre-fill the recipient + amount inside the bKash/Nagad/Rocket app.
export const OFFLINE_USSD_CODES: Record<OfflineMethod, string> = {
  bkash: "*247#",
  nagad: "*167#",
  rocket: "*322#",
};
