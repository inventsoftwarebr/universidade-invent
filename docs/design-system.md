# Design System — Universidade Invent

> **Status:** placeholder. A Invent Software vai entregar o design system via Claude Design. Este arquivo será substituído pelos tokens e componentes definitivos.

## O que esperar deste documento (quando preenchido)

- **Brand tokens**: cores primárias/secundárias/neutras Invent, tipografia (display + sans), espaçamento, border radius, sombras.
- **Componentes**: variantes de botão, inputs, cards, badges, hero patterns, navegação.
- **Tom e voz**: como falamos com o aluno, com o instrutor, na home pública vs área logada.
- **Acessibilidade**: contraste mínimo AA (preferência AAA em textos longos), focus visible, tap targets 44px.
- **Identidade visual nas aulas**: paleta para o player, hierarquia tipográfica em texto longo, código (Fira Code ou similar), syntax highlight para SQL/ABAP.

## Como integrar quando chegar

1. Substituir as variáveis HSL em `app/globals.css` pelos tokens reais.
2. Adicionar fontes em `app/layout.tsx` via `next/font`.
3. Criar componentes derivados em `components/ui/` seguindo o padrão shadcn (CVA + Tailwind).
4. Atualizar este arquivo com tokens, componentes e screenshots de referência.

## Princípios não-negociáveis (independente da identidade)

- **Mobile-first.** Aluno consome no celular durante deslocamento.
- **Performance é design.** Lighthouse 90+ em todas as páginas-chave.
- **Acessibilidade nunca é "depois".** Toda iteração passa por checklist WCAG AA.
- **Player de vídeo é o ponto mais importante** da experiência. Ele deve ser o componente mais polido do produto.
