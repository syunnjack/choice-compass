import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "../../../db";
import { notificationSubscriptions } from "../../../db/schema";

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value.trim().toLowerCase());
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map((x) => x.toString(16).padStart(2, "0")).join("");
}
function clientKey(request: Request) { const value = request.headers.get("x-choice-client")?.trim(); if (!value || value.length < 20) throw new Error("client key is required"); return value; }
function safeRow(row: typeof notificationSubscriptions.$inferSelect) { return { offerId: row.offerId, name: row.name, channel: row.channel, maskedDestination: row.maskedDestination, maxPrice: row.maxPrice, crowdBelow: row.crowdBelow, events: JSON.parse(row.eventsJson), consentedAt: row.consentedAt, createdAt: row.createdAt }; }

export async function GET(request: Request) {
  try { const hash = await sha256(clientKey(request)); const rows = await getDb().select().from(notificationSubscriptions).where(and(eq(notificationSubscriptions.clientHash, hash), eq(notificationSubscriptions.partition, "general"), isNull(notificationSubscriptions.disabledAt))); return Response.json({ alerts: rows.map(safeRow) }); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "failed" }, { status: 400 }); }
}
export async function POST(request: Request) {
  try {
    const keyHash = await sha256(clientKey(request)); const body = await request.json() as Record<string, unknown>;
    const offerId = String(body.offerId ?? ""); const name = String(body.name ?? "").slice(0, 120); const channel = body.channel === "email" ? "email" : "web_push"; const destination = String(body.destination ?? "");
    const maxPrice = Math.max(0, Math.round(Number(body.maxPrice))); const crowdBelow = Math.min(100, Math.max(0, Math.round(Number(body.crowdBelow)))); const consentedAt = String(body.consentedAt ?? "");
    if (!offerId || !name || !destination || !consentedAt || !Number.isFinite(maxPrice) || !Number.isFinite(crowdBelow)) return Response.json({ error: "invalid alert" }, { status: 400 });
    const row = { id: crypto.randomUUID(), clientHash: keyHash, partition: "general" as const, offerId, name, channel, destinationHash: await sha256(destination), maskedDestination: channel === "email" ? String(body.maskedDestination ?? "") : "このブラウザ", maxPrice, crowdBelow, eventsJson: JSON.stringify(["stock_change", "price_drop", "crowd_clear"]), consentedAt, disabledAt: null };
    const db = getDb(); await db.delete(notificationSubscriptions).where(and(eq(notificationSubscriptions.clientHash, keyHash), eq(notificationSubscriptions.partition, "general"), eq(notificationSubscriptions.offerId, offerId))); const [saved] = await db.insert(notificationSubscriptions).values(row).returning();
    return Response.json({ alert: safeRow(saved) }, { status: 201 });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "failed" }, { status: 400 }); }
}
export async function DELETE(request: Request) {
  try { const hash = await sha256(clientKey(request)); const offerId = new URL(request.url).searchParams.get("offerId") ?? ""; if (!offerId) return Response.json({ error: "offerId is required" }, { status: 400 }); await getDb().delete(notificationSubscriptions).where(and(eq(notificationSubscriptions.clientHash, hash), eq(notificationSubscriptions.partition, "general"), eq(notificationSubscriptions.offerId, offerId))); return Response.json({ removed: true }); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "failed" }, { status: 400 }); }
}
