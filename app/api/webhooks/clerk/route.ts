import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users, organizations, memberships, cases } from "@/lib/db/schema";
import { logger } from "@/lib/log";

export const runtime = "nodejs";

interface WebhookEvent {
  data: Record<string, unknown>;
  type: string;
}

export async function POST(req: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET?.trim();
  if (!webhookSecret) {
    logger.warn({ event: "clerk_webhook_missing_secret", error: "CLERK_WEBHOOK_SIGNING_SECRET not configured" });
    return NextResponse.json({ error: "Webhook secret unconfigured" }, { status: 500 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing required svix headers" }, { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(webhookSecret);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as unknown as WebhookEvent;
  } catch (err) {
    logger.warn({ event: "clerk_webhook_verification_failed", error: err instanceof Error ? err.message : "Verification error" });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const db = getDb();
  if (!db) {
    // In-memory or development mode without database
    return NextResponse.json({ received: true, mode: "memory" });
  }

  const eventType = evt.type;
  const data = evt.data;

  try {
    if (eventType === "user.created" || eventType === "user.updated") {
      const userId = data.id as string;
      const emailAddresses = data.email_addresses as Array<{ email_address: string }> | undefined;
      const primaryEmail = emailAddresses?.[0]?.email_address ?? null;
      const publicMetadata = (data.public_metadata as Record<string, unknown>) ?? {};
      const platformRole = (publicMetadata.platformRole as string) ?? null;

      await db
        .insert(users)
        .values({
          id: userId,
          email: primaryEmail,
          platformRole,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            email: primaryEmail,
            platformRole,
            updatedAt: new Date(),
            deletedAt: null,
          },
        });

      logger.info({ event: "webhook_user_synced", code: "ok" });
    } else if (eventType === "user.deleted") {
      const userId = data.id as string;
      await db
        .update(users)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(eq(users.id, userId));

      // Purge or soft-delete user's personal cases
      await db
        .delete(cases)
        .where(and(eq(cases.orgId, userId), eq(cases.userId, userId)));

      logger.info({ event: "webhook_user_purged", code: "ok" });
    } else if (eventType === "organization.created" || eventType === "organization.updated") {
      const orgId = data.id as string;
      const name = (data.name as string) || "Unnamed Organization";

      await db
        .insert(organizations)
        .values({
          id: orgId,
          name,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: organizations.id,
          set: {
            name,
            updatedAt: new Date(),
            deletedAt: null,
          },
        });

      logger.info({ event: "webhook_org_synced", code: "ok" });
    } else if (eventType === "organization.deleted") {
      const orgId = data.id as string;
      await db
        .update(organizations)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(eq(organizations.id, orgId));

      logger.info({ event: "webhook_org_deleted", code: "ok" });
    } else if (
      eventType === "organizationMembership.created" ||
      eventType === "organizationMembership.updated"
    ) {
      const org = data.organization as { id: string } | undefined;
      const publicUserData = data.public_user_data as { user_id: string } | undefined;
      const orgId = org?.id;
      const userId = publicUserData?.user_id;
      const role = data.role as string;

      if (orgId && userId && role) {
        await db
          .insert(memberships)
          .values({
            orgId,
            userId,
            role,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [memberships.orgId, memberships.userId],
            set: {
              role,
              updatedAt: new Date(),
            },
          });

        logger.info({ event: "webhook_membership_synced", code: "ok" });
      }
    } else if (eventType === "organizationMembership.deleted") {
      const org = data.organization as { id: string } | undefined;
      const publicUserData = data.public_user_data as { user_id: string } | undefined;
      const orgId = org?.id;
      const userId = publicUserData?.user_id;

      if (orgId && userId) {
        await db
          .delete(memberships)
          .where(and(eq(memberships.orgId, orgId), eq(memberships.userId, userId)));

        logger.info({ event: "webhook_membership_removed", code: "ok" });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ event: "webhook_processing_error", error: error instanceof Error ? error.message : "Unknown error" });
    return NextResponse.json({ error: "Internal webhook processing error" }, { status: 500 });
  }
}
