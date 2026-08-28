/**
 * `server-only` é resolvido pelo bundler do Next, não existe como pacote no
 * node_modules. O Vitest roda em Node puro, então o alias em
 * `vitest.config.ts` aponta os imports desse módulo para este arquivo vazio.
 */
export {};
