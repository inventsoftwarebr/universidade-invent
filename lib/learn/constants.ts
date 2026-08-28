/**
 * Compartilhado entre o player (client) e as Server Actions. Fica fora de
 * `actions.ts` porque um arquivo `"use server"` só pode exportar funções
 * async — exportar a constante de lá quebra o build.
 */

/** Intervalo entre heartbeats de progresso, em segundos. */
export const HEARTBEAT_SECONDS = 10;

/**
 * Teto do tempo assistido aceito por chamada. O servidor não confia no
 * delta do client: sem esse limite dá para chamar a action em loop, inflar
 * `watched_seconds_total` e forjar conclusão de curso.
 */
export const MAX_WATCHED_DELTA = HEARTBEAT_SECONDS * 3;
