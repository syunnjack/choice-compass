import { env } from "cloudflare:workers";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "../../../../db";
import { notificationOutbox, notificationSubscriptions } from "../../../../db/schema";
import { requireInternalRequest, type RuntimeSecrets } from "../../../lib/notification-delivery";

const allowedEvents = new Set(["stock_change", "price_drop", "crowd_clear"]);

export async function POST(request: Request) {
  try {
    requireInternalRequest(request, env as unknown as RuntimeSecrets);
    const body = await request.json() as Record<string, unknown>;
    const offerId = String(body.offerId ?? "").slice(0, 120);
    const eventType = String(body.eventType ?? "");
    const subject = String(body.subject ?? "").slice(0, 160);
    const message = String(body.message ?? "").slice(0, 2000);
    const actionUrl = String(body.actionUrl ?? "").slice(0, 1000);
    const dedupeKey = String(body.dedupeKey ?? "").slice(0, 200);
    if (!offerId || !allowedEvents.has(eventType) || !subject || !message || !dedupeKey || !/^https:\/\//.test(actionUrl)) return Response.json({ error: "invalid notification event" }, { status: 400 });

    const db = getDb();
    const subscriptions = await db.select().from(notificationSubscriptions).where(and(eq(notificationSubscriptions.offerId, offerId), eq(notificationSubscriptions.partition, "general"), eq(notificationSubscriptions.channel, "email"), isNull(notificationSubscriptions.disabledAt)));
    let enqueued = 0;
    for (const subscription of subscriptions) {
      const events = JSON.parse(subscription.eventsJson) as string[];
      if (!events.includes(eventType) || !subscription.destinationCiphertext) continue;
      const inserted = await db.insert(notificationOutbox).values({ id: crypto.randomUUID(), subscriptionId: subscription.id, eventType, subject, message, actionUrl, dedupeKey }).onConflictDoNothing().returning({ id: notificationOutbox.id });
      enqueued += inserted.length;
    }
    return Response.json({ matched: subscriptions.length, enqueued });
  } catch (error) {
    const message = error instanceof Error ? error.message : "failed";
    return Response.json({ error: message }, { status: message === "unauthorized" ? 401 : 500 });
  }
}
