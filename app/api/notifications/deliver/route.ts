import { env } from "cloudflare:workers";
import { and, asc, eq, isNull, lte, sql } from "drizzle-orm";
import { getDb } from "../../../../db";
import { notificationOutbox, notificationSubscriptions } from "../../../../db/schema";
import { decryptDestination, requireInternalRequest, sendEmail, type RuntimeSecrets } from "../../../lib/notification-delivery";

export async function POST(request: Request) {
  const secrets = env as unknown as RuntimeSecrets;
  try {
    requireInternalRequest(request, secrets);
    if (!secrets.RESEND_API_KEY || !secrets.NOTIFICATION_FROM_EMAIL || !secrets.NOTIFICATION_ENCRYPTION_KEY) return Response.json({ error: "email delivery is not configured", required: ["RESEND_API_KEY", "NOTIFICATION_FROM_EMAIL", "NOTIFICATION_ENCRYPTION_KEY"] }, { status: 503 });

    const db = getDb();
    const jobs = await db.select({ job: notificationOutbox, subscription: notificationSubscriptions }).from(notificationOutbox)
      .innerJoin(notificationSubscriptions, eq(notificationOutbox.subscriptionId, notificationSubscriptions.id))
      .where(and(eq(notificationOutbox.status, "pending"), lte(notificationOutbox.availableAt, new Date().toISOString()), isNull(notificationSubscriptions.disabledAt)))
      .orderBy(asc(notificationOutbox.createdAt)).limit(25);
    let sent = 0;
    let failed = 0;
    for (const { job, subscription } of jobs) {
      if (!subscription.destinationCiphertext) continue;
      const claimed = await db.update(notificationOutbox).set({ status: "processing", attempts: sql`${notificationOutbox.attempts} + 1` }).where(and(eq(notificationOutbox.id, job.id), eq(notificationOutbox.status, "pending"))).returning({ id: notificationOutbox.id });
      if (claimed.length === 0) continue;
      try {
        const to = await decryptDestination(subscription.destinationCiphertext, secrets.NOTIFICATION_ENCRYPTION_KEY);
        const providerMessageId = await sendEmail({ apiKey: secrets.RESEND_API_KEY, from: secrets.NOTIFICATION_FROM_EMAIL, to, subject: job.subject, message: job.message, actionUrl: job.actionUrl, idempotencyKey: job.id });
        await db.update(notificationOutbox).set({ status: "sent", providerMessageId, sentAt: new Date().toISOString(), lastError: null }).where(eq(notificationOutbox.id, job.id));
        sent += 1;
      } catch (error) {
        const lastError = (error instanceof Error ? error.message : "delivery failed").slice(0, 500);
        const terminal = job.attempts + 1 >= 5;
        await db.update(notificationOutbox).set({ status: terminal ? "failed" : "pending", lastError, availableAt: new Date(Date.now() + 5 * 60_000).toISOString() }).where(eq(notificationOutbox.id, job.id));
        failed += 1;
      }
    }
    return Response.json({ processed: jobs.length, sent, failed });
  } catch (error) {
    const message = error instanceof Error ? error.message : "failed";
    return Response.json({ error: message }, { status: message === "unauthorized" ? 401 : 500 });
  }
}
