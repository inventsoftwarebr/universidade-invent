/**
 * Estado devolvido pelas Server Actions ao formulário. Fica fora de
 * `app/actions.ts` porque um módulo "use server" só pode exportar funções
 * assíncronas.
 */
export interface ActionState {
  ok: boolean;
  errors: string[];
}

export const emptyState: ActionState = { ok: false, errors: [] };
