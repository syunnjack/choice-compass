type RuntimeSecrets = {
  NOTIFICATION_ENCRYPTION_KEY?: string;
  NOTIFICATION_INTERNAL_TOKEN?: string;
  NOTIFICATION_FROM_EMAIL?: string;
  RESEND_API_KEY?: string;
};

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function encryptionKey(secret: string) {
  const bytes = base64ToBytes(secret);
  if (bytes.byteLength !== 32) throw new Error("NOTIFICATION_ENCRYPTION_KEY must be a base64 encoded 32-byte key");
  return crypto.subtle.importKey("raw", bytes, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptDestination(destination: string, secret: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await encryptionKey(secret), new TextEncoder().encode(destination));
  return `${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(encrypted))}`;
}

export async function decryptDestination(ciphertext: string, secret: string) {
  const [iv, body] = ciphertext.split(".");
  if (!iv || !body) throw new Error("invalid encrypted destination");
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64ToBytes(iv) }, await encryptionKey(secret), base64ToBytes(body));
  return new TextDecoder().decode(decrypted);
}

export function requireInternalRequest(request: Request, secrets: RuntimeSecrets) {
  const expected = secrets.NOTIFICATION_INTERNAL_TOKEN;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expected || !supplied || supplied !== expected) throw new Error("unauthorized");
}

export async function sendEmail(args: { apiKey: string; from: string; to: string; subject: string; message: string; actionUrl: string; idempotencyKey: string }) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${args.apiKey}`, "Content-Type": "application/json", "Idempotency-Key": args.idempotencyKey },
    body: JSON.stringify({ from: args.from, to: [args.to], subject: args.subject, text: `${args.message}\n\n詳しく見る: ${args.actionUrl}` }),
  });
  const result = await response.json() as { id?: string; message?: string };
  if (!response.ok || !result.id) throw new Error(result.message ?? `email provider returned ${response.status}`);
  return result.id;
}

export type { RuntimeSecrets };
