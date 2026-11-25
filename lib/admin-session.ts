export const ADMIN_SESSION_COOKIE = "amira_admin";

const SESSION_TTL_SECONDS = 60 * 60 * 8;
const encoder = new TextEncoder();

async function getSigningKey() {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Admin session signing secret is not configured");

  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function toHex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function fromHex(value: string) {
  if (!/^[0-9a-f]{64}$/i.test(value)) return null;
  return Uint8Array.from({ length: value.length / 2 }, (_, index) =>
    Number.parseInt(value.slice(index * 2, index * 2 + 2), 16)
  );
}

export async function createAdminSessionToken() {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `amira-admin:${expiresAt}`;
  const signature = await crypto.subtle.sign("HMAC", await getSigningKey(), encoder.encode(payload));
  return `${expiresAt}.${toHex(signature)}`;
}

export async function verifyAdminSessionToken(token: string) {
  const [expiresAtText, signatureText, ...extra] = token.split(".");
  if (extra.length || !/^\d+$/.test(expiresAtText)) return false;

  const expiresAt = Number(expiresAtText);
  const signature = fromHex(signatureText);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000) || !signature) {
    return false;
  }

  const payload = `amira-admin:${expiresAt}`;
  return crypto.subtle.verify("HMAC", await getSigningKey(), signature, encoder.encode(payload));
}
