"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as tus from "tus-js-client";
import {
  startVideoUpload,
  getVideoAssetStatus,
} from "@/lib/instructor/actions";

type Phase =
  | { state: "idle" }
  | { state: "starting" }
  | { state: "uploading"; pct: number }
  | { state: "processing"; videoAssetId: string }
  | { state: "ready" }
  | { state: "error"; message: string };

const POLL_INTERVAL_MS = 4_000;
const POLL_MAX_ATTEMPTS = 90; // 6 minutos no total

export function LessonVideoUploader({
  lessonId,
  lessonTitle,
}: {
  lessonId: string;
  lessonTitle: string;
}) {
  const [phase, setPhase] = useState<Phase>({ state: "idle" });
  const uploadRef = useRef<tus.Upload | null>(null);

  const startUpload = useCallback(
    async (file: File) => {
      setPhase({ state: "starting" });
      const res = await startVideoUpload({
        lessonId,
        title: lessonTitle || file.name,
      });
      if (!res.ok) {
        setPhase({ state: "error", message: res.error });
        return;
      }
      const { endpoint, headers, videoAssetId } = res.data;

      const upload = new tus.Upload(file, {
        endpoint,
        retryDelays: [0, 3000, 6000, 12000, 24000],
        chunkSize: 50 * 1024 * 1024, // 50MB
        headers,
        metadata: {
          filetype: file.type,
          title: lessonTitle || file.name,
        },
        onError(err) {
          setPhase({
            state: "error",
            message:
              err instanceof Error ? err.message : "Falha no upload do vídeo.",
          });
        },
        onProgress(uploaded, total) {
          const pct = total === 0 ? 0 : Math.round((uploaded / total) * 100);
          setPhase({ state: "uploading", pct });
        },
        onSuccess() {
          setPhase({ state: "processing", videoAssetId });
        },
      });

      uploadRef.current = upload;
      upload.start();
    },
    [lessonId, lessonTitle],
  );

  // Polling enquanto processa
  useEffect(() => {
    if (phase.state !== "processing") return;
    const videoAssetId = phase.videoAssetId;
    let attempts = 0;
    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      attempts++;
      const res = await getVideoAssetStatus(videoAssetId);
      if (!res.ok) {
        setPhase({ state: "error", message: res.error });
        return;
      }
      if (res.data.status === "ready") {
        setPhase({ state: "ready" });
        return;
      }
      if (res.data.status === "errored") {
        setPhase({ state: "error", message: "Processamento falhou no Bunny." });
        return;
      }
      if (attempts >= POLL_MAX_ATTEMPTS) {
        setPhase({
          state: "error",
          message: "Tempo limite — verifique no painel do Bunny.",
        });
        return;
      }
      setTimeout(tick, POLL_INTERVAL_MS);
    };
    setTimeout(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
    };
  }, [phase]);

  const cancel = () => {
    uploadRef.current?.abort();
    setPhase({ state: "idle" });
  };

  if (phase.state === "ready") {
    return (
      <div className="flex items-center gap-3 text-xs">
        <span className="inline-flex h-2 w-2 rounded-full bg-status-success" />
        <span className="font-semibold text-foreground">
          Vídeo pronto para reprodução.
        </span>
        <span className="text-muted-foreground">Recarregue para ver o player.</span>
      </div>
    );
  }

  if (phase.state === "uploading") {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold">Enviando vídeo… {phase.pct}%</span>
          <button
            type="button"
            onClick={cancel}
            className="text-muted-foreground hover:text-accent"
          >
            Cancelar
          </button>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-200"
            style={{ width: `${phase.pct}%` }}
          />
        </div>
      </div>
    );
  }

  if (phase.state === "processing") {
    return (
      <div className="flex items-center gap-3 text-xs">
        <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-primary" />
        <span className="font-semibold text-foreground">
          Bunny está processando o vídeo…
        </span>
        <span className="text-muted-foreground">
          Geralmente 1–3 min. Você pode sair desta página.
        </span>
      </div>
    );
  }

  if (phase.state === "starting") {
    return (
      <div className="text-xs text-muted-foreground">Preparando upload…</div>
    );
  }

  if (phase.state === "error") {
    return (
      <div className="text-xs">
        <p className="font-semibold text-accent">Erro: {phase.message}</p>
        <button
          type="button"
          onClick={() => setPhase({ state: "idle" })}
          className="mt-2 rounded-md border border-border bg-background px-3 py-1 font-semibold hover:bg-muted"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <label className="flex cursor-pointer flex-wrap items-center gap-3 text-xs">
      <span className="font-semibold text-foreground">Upload de vídeo</span>
      <span className="text-muted-foreground">
        MP4 / MOV até 5GB · upload direto para Bunny Stream
      </span>
      <input
        type="file"
        accept="video/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void startUpload(file);
        }}
      />
      <span className="rounded-md bg-primary px-3 py-1.5 font-semibold text-primary-foreground hover:bg-primary-hover">
        Escolher arquivo
      </span>
    </label>
  );
}
