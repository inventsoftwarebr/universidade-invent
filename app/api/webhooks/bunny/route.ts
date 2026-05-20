/**
 * Webhook Bunny Stream.
 *
 * Recebe atualizações de status de vídeo (queued → processing → ready/errored).
 * Idempotente por (provider='bunny', providerAssetId=VideoGuid):
 *   - INSERT...ON CONFLICT no caller (createVideoAsset)
 *   - UPDATE só avança status se o novo for "mais recente" (errored substitui
 *     qualquer coisa; ready substitui uploading/processing; processing substitui
 *     uploading).
 *
 * Bunny pode reentregar webhooks — verificar assinatura HMAC sempre.
 *
 * Ver CLAUDE.md §6 (webhooks sempre idempotentes).
 */
import { NextResponse, type NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db/client";
import { videoAssets } from "@/db/schema";
import {
  verifyBunnyWebhookSignature,
  mapBunnyStatus,
  type BunnyWebhookPayload,
} from "@/lib/bunny/client";

export const runtime = "nodejs";

const STATUS_RANK: Record<string, number> = {
  uploading: 0,
  processing: 1,
  ready: 2,
  errored: 3, // sempre sobrescreve
};

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("BunnyCDN-Signature");

  if (!verifyBunnyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ ok: false, reason: "invalid_signature" }, { status: 401 });
  }

  let payload: BunnyWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as BunnyWebhookPayload;
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid_json" }, { status: 400 });
  }

  if (!payload.VideoGuid) {
    return NextResponse.json({ ok: false, reason: "missing_guid" }, { status: 400 });
  }

  const next = mapBunnyStatus(payload.Status);

  // Idempotência: só avança status (errored sempre vence).
  const [existing] = await db
    .select({ id: videoAssets.id, status: videoAssets.status })
    .from(videoAssets)
    .where(
      and(
        eq(videoAssets.provider, "bunny"),
        eq(videoAssets.providerAssetId, payload.VideoGuid),
      ),
    );

  if (!existing) {
    // Webhook chegou antes do nosso registro (race condition raro) — responder 200
    // pra não causar retries; o próximo webhook ou consulta de status sincroniza.
    return NextResponse.json({ ok: true, ignored: "asset_not_found_yet" });
  }

  if (
    next !== "errored" &&
    STATUS_RANK[next]! <= STATUS_RANK[existing.status]!
  ) {
    return NextResponse.json({ ok: true, ignored: "stale_or_same_status" });
  }

  await db
    .update(videoAssets)
    .set({
      status: next,
      playbackId: next === "ready" ? payload.VideoGuid : undefined,
      updatedAt: new Date(),
    })
    .where(eq(videoAssets.id, existing.id));

  return NextResponse.json({ ok: true });
}
