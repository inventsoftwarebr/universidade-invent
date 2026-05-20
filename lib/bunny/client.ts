/**
 * Cliente Bunny Stream — apenas server-side. NUNCA importar em código de
 * browser (vaza BUNNY_STREAM_API_KEY).
 *
 * Fluxo de upload de aula:
 *   1. Instrutor cria lição tipo `video` → server chama `createBunnyVideo()`
 *      e grava `video_assets` (status=uploading) + Bunny GUID.
 *   2. Server retorna ao client os headers TUS assinados via
 *      `getTusUploadHeaders()`.
 *   3. Client usa tus-js-client com esses headers → faz upload chunked
 *      direto para Bunny (não passa por Vercel).
 *   4. Bunny processa e chama nosso webhook `/api/webhooks/bunny` →
 *      atualiza `video_assets.status=ready`.
 */

import "server-only";
import { createHash } from "node:crypto";

const BASE_API = "https://video.bunnycdn.com";
const TUS_ENDPOINT = "https://video.bunnycdn.com/tusupload";

function env() {
  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
  const apiKey = process.env.BUNNY_STREAM_API_KEY;
  const cdnHostname = process.env.BUNNY_STREAM_CDN_HOSTNAME;
  if (!libraryId || !apiKey || !cdnHostname) {
    throw new Error(
      "Bunny env não configurado. Setar BUNNY_STREAM_LIBRARY_ID, BUNNY_STREAM_API_KEY e BUNNY_STREAM_CDN_HOSTNAME.",
    );
  }
  return { libraryId, apiKey, cdnHostname };
}

/**
 * Cria um vídeo "shell" na Bunny. Retorna o GUID que será usado pra upload
 * TUS e referência no nosso `video_assets.providerAssetId`.
 */
export async function createBunnyVideo(title: string): Promise<{
  guid: string;
  libraryId: string;
}> {
  const { libraryId, apiKey } = env();
  const res = await fetch(`${BASE_API}/library/${libraryId}/videos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      AccessKey: apiKey,
    },
    body: JSON.stringify({ title }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Bunny createVideo falhou (${res.status}): ${await res.text()}`);
  }
  const json = (await res.json()) as { guid: string };
  return { guid: json.guid, libraryId };
}

/**
 * Headers TUS para o client fazer upload direto.
 *
 * AuthorizationSignature = sha256(libraryId + apiKey + expirationUnix + videoGuid)
 * Expira em 1h.
 */
export function getTusUploadHeaders(videoGuid: string): {
  endpoint: string;
  headers: Record<string, string>;
  expiresAt: number;
} {
  const { libraryId, apiKey } = env();
  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60; // 1h
  const signature = createHash("sha256")
    .update(`${libraryId}${apiKey}${expiresAt}${videoGuid}`)
    .digest("hex");

  return {
    endpoint: TUS_ENDPOINT,
    headers: {
      AuthorizationSignature: signature,
      AuthorizationExpire: String(expiresAt),
      VideoId: videoGuid,
      LibraryId: libraryId,
    },
    expiresAt,
  };
}

/**
 * URL de playback HLS via CDN. Tokenização signed (Token Authentication) é
 * habilitada no painel Bunny — quando ativa, gere o token em código separado.
 * Por default retornamos o playlist direto, suficiente pra dev/staging.
 */
export function getPlaybackUrl(videoGuid: string): string {
  const { cdnHostname } = env();
  return `https://${cdnHostname}/${videoGuid}/playlist.m3u8`;
}

export function getThumbnailUrl(videoGuid: string): string {
  const { cdnHostname } = env();
  return `https://${cdnHostname}/${videoGuid}/thumbnail.jpg`;
}

/**
 * Verifica assinatura HMAC do webhook Bunny.
 *
 * Bunny manda no header `BunnyCDN-Signature` (algoritmo HMAC-SHA256 do raw
 * body usando o token configurado em Stream → Library → Security → Webhook).
 * Setar via env BUNNY_STREAM_WEBHOOK_SECRET.
 */
export function verifyBunnyWebhookSignature(
  rawBody: string,
  signature: string | null,
): boolean {
  const secret = process.env.BUNNY_STREAM_WEBHOOK_SECRET;
  if (!secret) {
    // Se não configurado, refuse para forçar setup explícito antes de ir pra prod.
    return false;
  }
  if (!signature) return false;
  const expected = createHash("sha256")
    .update(`${rawBody}${secret}`)
    .digest("hex");
  // Timing-safe compare
  if (expected.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

export type BunnyWebhookPayload = {
  VideoLibraryId: number;
  VideoGuid: string;
  Status: number;
};

/**
 * Mapeia status enum do Bunny para nosso `video_assets.status`.
 *
 * Bunny status codes (https://docs.bunny.net/reference/manage_videos):
 *   0 Queued, 1 Processing, 2 Encoding, 3 Finished, 4 ResolutionFinished,
 *   5 Failed, 6 PresignedUploadStarted, 7 PresignedUploadFinished, 8 PresignedUploadFailed
 */
export function mapBunnyStatus(
  code: number,
): "uploading" | "processing" | "ready" | "errored" {
  if (code === 5 || code === 8) return "errored";
  if (code === 3 || code === 4) return "ready";
  if (code === 7) return "processing";
  return "processing";
}
