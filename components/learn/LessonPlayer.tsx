"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MediaPlayer,
  MediaProvider,
  type MediaPlayerInstance,
} from "@vidstack/react";
import {
  defaultLayoutIcons,
  DefaultVideoLayout,
} from "@vidstack/react/player/layouts/default";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";
import { saveLessonProgress } from "@/lib/learn/actions";
import { HEARTBEAT_SECONDS, MAX_WATCHED_DELTA } from "@/lib/learn/constants";

/**
 * Player HLS da Bunny com persistência de posição.
 *
 * O tempo assistido é contado no client (1 tick por segundo, só enquanto
 * tocando) e enviado a cada `HEARTBEAT_SECONDS`. O servidor descarta deltas
 * acima do teto — ver `lib/learn/actions.ts`.
 */
export function LessonPlayer({
  enrollmentId,
  lessonId,
  title,
  playbackUrl,
  startAtSeconds,
  onCompleted,
}: {
  enrollmentId: string;
  lessonId: string;
  title: string;
  playbackUrl: string;
  startAtSeconds: number;
  onCompleted?: () => void;
}) {
  const router = useRouter();
  const playerRef = useRef<MediaPlayerInstance>(null);
  const positionRef = useRef(startAtSeconds);
  const watchedRef = useRef(0);
  const playingRef = useRef(false);
  const completedRef = useRef(false);
  const [saveFailed, setSaveFailed] = useState(false);

  const flush = useCallback(
    async (event: "heartbeat" | "play" | "pause" | "seek" | "complete") => {
      const watched = Math.min(watchedRef.current, MAX_WATCHED_DELTA);
      watchedRef.current = 0;
      const result = await saveLessonProgress({
        enrollmentId,
        lessonId,
        positionSeconds: Math.floor(positionRef.current),
        watchedDeltaSeconds: watched,
        event,
      });
      setSaveFailed(!result.ok);
    },
    [enrollmentId, lessonId],
  );

  // Conta segundos assistidos e envia o heartbeat.
  useEffect(() => {
    const ticker = window.setInterval(() => {
      if (playingRef.current) watchedRef.current += 1;
    }, 1000);

    const heartbeat = window.setInterval(() => {
      if (watchedRef.current > 0) void flush("heartbeat");
    }, HEARTBEAT_SECONDS * 1000);

    return () => {
      window.clearInterval(ticker);
      window.clearInterval(heartbeat);
    };
  }, [flush]);

  // Sair da aba ou navegar não pode perder o progresso do último trecho.
  useEffect(() => {
    const onHidden = () => {
      if (document.visibilityState === "hidden" && watchedRef.current > 0) {
        void flush("pause");
      }
    };
    document.addEventListener("visibilitychange", onHidden);
    return () => {
      document.removeEventListener("visibilitychange", onHidden);
      if (watchedRef.current > 0) void flush("pause");
    };
  }, [flush]);

  return (
    <div className="space-y-2">
      <MediaPlayer
        ref={playerRef}
        title={title}
        src={{ src: playbackUrl, type: "application/x-mpegurl" }}
        crossOrigin
        playsInline
        streamType="on-demand"
        className="overflow-hidden rounded-xl bg-invent-black"
        onCanPlay={() => {
          // Retoma de onde parou, com uma folga para reentrar no contexto.
          if (startAtSeconds > 5 && playerRef.current) {
            playerRef.current.currentTime = Math.max(0, startAtSeconds - 3);
          }
        }}
        onTimeUpdate={(detail) => {
          positionRef.current = detail.currentTime;
        }}
        onPlay={() => {
          playingRef.current = true;
          void flush("play");
        }}
        onPause={() => {
          playingRef.current = false;
          void flush("pause");
        }}
        onSeeked={() => void flush("seek")}
        onEnded={() => {
          playingRef.current = false;
          if (completedRef.current) return;
          completedRef.current = true;
          void flush("complete").then(() => {
            onCompleted?.();
            router.refresh();
          });
        }}
      >
        <MediaProvider />
        <DefaultVideoLayout icons={defaultLayoutIcons} />
      </MediaPlayer>

      {saveFailed ? (
        <p role="status" className="text-xs text-invent-red-600">
          Não conseguimos salvar seu progresso agora. Ele será registrado na
          próxima tentativa.
        </p>
      ) : null}
    </div>
  );
}
