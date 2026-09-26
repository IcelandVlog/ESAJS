// Reunion fee payment: online (SSLCommerz — routes bKash/Nagad/Rocket/cards/banks
// through one gateway) and offline/manual (student sends money directly to the
// school's own bKash/Nagad/Rocket number and types in the TrxID for the admin to verify).
//
// SSLCommerz setup (needed for the "online" button to work):
//   1. Sandbox (free, instant, fake money — for testing): register at
//      https://developer.sslcommerz.com/registration/ — Store ID + Store Password
//      arrive by email right away. Set SSLCZ_SANDBOX=true.
//   2. Live (real money): apply at https://sslcommerz.com/ — this needs KYC
//      documents (trade license / EIIN for schools / NID etc.). Once approved,
//      swap in the live Store ID + Store Password and set SSLCZ_SANDBOX=false.
// Until these env vars are set, "online" payment is simply hidden and only the
// offline bKash/Nagad/Rocket option shows.

const SSLCZ_STORE_ID = process.env.SSLCZ_STORE_ID || "";
const SSLCZ_STORE_PASSWORD = process.env.SSLCZ_STORE_PASSWORD || "";
const SSLCZ_SANDBOX = (process.env.SSLCZ_SANDBOX ?? "true") !== "false";

export function isOnlinePaymentConfigured(): boolean {
  return !!SSLCZ_STORE_ID && !!SSLCZ_STORE_PASSWORD;
}

const SSLCZ_BASE = SSLCZ_SANDBOX ? "https://sandbox.sslcommerz.com" : "https://securepay.sslcommerz.com";

export type SslczSessionResult =
  | { ok: true; gatewayUrl: string }
  | { ok: false; error: string };

export async function initiateSslcommerzPayment(opts: {
  tranId: string;
  amount: number; // BDT, whole taka
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  successUrl: string;
  failUrl: string;
  cancelUrl: string;
  ipnUrl: string;
}): Promise<SslczSessionResult> {
  if (!isOnlinePaymentConfigured()) {
    return { ok: false, error: "Online payment is not configured yet" };
  }

  const body = new URLSearchParams({
    store_id: SSLCZ_STORE_ID,
    store_passwd: SSLCZ_STORE_PASSWORD,
    total_amount: String(opts.amount),
    currency: "BDT",
    tran_id: opts.tranId,
    success_url: opts.successUrl,
    fail_url: opts.failUrl,
    cancel_url: opts.cancelUrl,
    ipn_url: opts.ipnUrl,
    // SSLCommerz requires these even though a reunion fee isn't a physical product.
    cus_name: opts.studentName || "Student",
    cus_email: opts.studentEmail || "no-reply@example.com",
    cus_add1: "N/A",
    cus_city: "Dhaka",
    cus_postcode: "1000",
    cus_country: "Bangladesh",
    cus_phone: opts.studentPhone || "01700000000",
    shipping_method: "NO",
    product_name: "Reunion Fee",
    product_category: "Event",
    product_profile: "general",
  });

  try {
    const res = await fetch(`${SSLCZ_BASE}/gwprocess/v4/api.php`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = (await res.json()) as { status?: string; GatewayPageURL?: string; failedreason?: string };
    if (data.status === "SUCCESS" && data.GatewayPageURL) {
      return { ok: true, gatewayUrl: data.GatewayPageURL };
    }
    return { ok: false, error: data.failedreason || "Gateway session could not be created" };
  } catch {
    return { ok: false, error: "Could not reach the payment gateway" };
  }
}

export type SslczValidation = {
  valid: boolean;
  tranId?: string;
  amount?: number;
  valId?: string;
};

export async function validateSslcommerzTransaction(valId: string): Promise<SslczValidation> {
  if (!isOnlinePaymentConfigured() || !valId) return { valid: false };
  const params = new URLSearchParams({
    val_id: valId,
    store_id: SSLCZ_STORE_ID,
    store_passwd: SSLCZ_STORE_PASSWORD,
    v: "1",
    format: "json",
  });
  try {
    const res = await fetch(`${SSLCZ_BASE}/validator/api/validationserverAPI.php?${params.toString()}`);
    const data = (await res.json()) as { status?: string; tran_id?: string; amount?: string; val_id?: string };
    const ok = data.status === "VALID" || data.status === "VALIDATED";
    if (!ok) return { valid: false };
    return { valid: true, tranId: data.tran_id, amount: data.amount ? Number(data.amount) : undefined, valId: data.val_id };
  } catch {
    return { valid: false };
  }
}

// ---------- Offline / manual mobile banking ----------
// The school's own personal/merchant numbers that students send money to by hand.
// Set these in .env; leave any of them blank to hide that option.
export type OfflineMethod = "bkash" | "nagad" | "rocket";

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
