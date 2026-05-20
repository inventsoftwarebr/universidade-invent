# Design System — Universidade Invent

Identidade visual extraída do **Manual de Marca Invent 2021** ([PDF original](./brand/manual-de-marca-invent.pdf)). Este documento é a fonte canônica do design system aplicado à Universidade Invent.

## Princípios

- **Mobile-first.** Aluno consome no celular durante deslocamento.
- **Performance é design.** Lighthouse 90+ em páginas-chave.
- **Acessibilidade nunca é "depois".** Toda iteração passa por checklist WCAG AA. Contraste mínimo: AA em UI, AAA em corpo longo.
- **Player de vídeo é o componente mais importante.** Maior cuidado de polimento.
- **Sutileza vence excesso.** O grafismo "V invent" e a faixa diagonal vermelha são acentos, nunca o protagonista de cada tela. Brand entra em hero, empty states e momentos de transição — não em formulários ou listas densas.

## Cores

Definidas em [`app/globals.css`](../app/globals.css) como variáveis HSL (padrão shadcn). Os tokens semânticos referenciam as cores base; nunca use hex literal em componentes — sempre via Tailwind (`text-primary`, `bg-primary-hover`, etc.).

### Brand — Vermelhos principais (manual: "Principal")

| Token | Hex | HSL | Uso |
|---|---|---|---|
| `--primary` | `#E41216` | `359 84% 48%` | CTA principal, links, links ativos, badges de marca, logo |
| `--primary-hover` | `#B6221A` | `4 75% 41%` | Hover/pressed dos elementos `primary` |
| `--primary-soft` | `#F94343` | `0 94% 62%` | Estados suaves, highlights leves, focus rings em fundo claro |
| (manual extra) | `#A81A16` | — | Reservado, vinho — use só se precisar de variação adicional |

### Brand — Complementares (manual: "Complementar")

| Token | Hex | HSL | Uso |
|---|---|---|---|
| `--accent` | `#FBB33B` | `38 96% 61%` | Destaque secundário, badges, indicadores de progresso |
| `--accent-soft` | `#FBBD3B` | `42 96% 61%` | Hover de elementos accent, highlights mais quentes |

### Neutros (manual: "P/B")

| Token | Hex | HSL | Uso |
|---|---|---|---|
| `--foreground` | `#1F1F26` | `240 12% 14%` | Texto principal (mais escuro que o `#535260` do manual para AAA em corpo) |
| `--muted-foreground` | `#535260` | `238 7% 35%` | Texto secundário, captions — cor exata do manual |
| `--border` / `--input` | `#E2E3E8` | `225 11% 90%` | Bordas, divisórias, inputs em repouso — cor exata do manual |
| `--background` | `#FFFFFF` | `0 0% 100%` | Fundo padrão |
| `--background-subtle` | ~`#F6F6F8` | `225 11% 97%` | Seções alternadas, footer |

### Dark mode

Apoiado no quase-preto do hero do manual (`#0E0E13`). Vermelho fica `#F94343` (`--primary-soft`) por contraste; bordas em `#2A2A33`. Override completo em `app/globals.css :root.dark`.

### Gradiente do logo (`v` 3D)

Vermelho → laranja → amarelo conforme transição cromática do "v" tridimensional do logotipo:

```css
linear-gradient(135deg, #B6221A 0%, #E41216 25%, #FBB33B 75%, #FBBD3B 100%)
```

Disponível como utilities `bg-invent-gradient` e `text-invent-gradient`. **Uso restrito:** headlines hero (uma palavra ou frase curta), badges premium/destaque, barras de progresso celebratórias. Nunca como fundo de seção inteira.

## Tipografia

- **Display + body: Montserrat** ([Google Fonts](https://fonts.google.com/specimen/Montserrat)) — manual prescreve Montserrat para "Conteúdo institucional" (apresentações, papelaria, comunicados); aplicamos como tipografia única da UI.
- **Logotipo: Le Havre** (Adobe Fonts) — restrita ao logotipo conforme manual ("mediante aprovação"). Não usar em UI. No componente `InventLogo`, substituída por Montserrat ExtraBold (Le Havre não tem licença Google).
- **Pesos disponíveis no app:** 400 (regular), 500 (medium), 600 (semibold), 700 (bold), 800 (extrabold — display).

### Hierarquia

| Nível | Classe Tailwind | Uso |
|---|---|---|
| Display XL | `font-display text-6xl md:text-7xl font-extrabold tracking-tight-display` | Hero da home |
| Display L | `font-display text-4xl md:text-5xl font-extrabold tracking-tight` | Páginas de seção (sobre, catálogo) |
| Display M | `font-display text-3xl md:text-4xl font-bold tracking-tight` | Section headings |
| Display S | `font-display text-xl md:text-2xl font-bold tracking-tight` | Card titles, modal headings |
| Body L | `text-lg md:text-xl text-muted-foreground` | Lead paragraph, intros |
| Body | `text-base` | Padrão |
| Small | `text-sm text-muted-foreground` | Meta, captions |
| Micro | `text-xs font-semibold uppercase tracking-wider` | Eyebrow labels, badge text |

## Espaçamento e raio

- **Radius base:** `--radius: 0.5rem` (8px). Tailwind: `rounded-md`/`rounded-lg`/`rounded-sm` derivados.
- **Cards grandes / hero:** `rounded-2xl` (16px).
- **Pills / avatars / badges:** `rounded-full`.
- **Container:** centralizado, padding lateral 1.5rem, max 1280px (`container`).
- **Vertical rhythm de seção:** `py-16 md:py-20` (padrão), `py-20 md:py-28` (hero).

## Grafismo oficial

### V invent (componente `<InventVMark />`)

Símbolo isolado, sem o texto "invent". Manual libera em backgrounds e elementos de apoio "mantendo proporção e cores".

| Variant | Quando usar |
|---|---|
| `default` | V tridimensional vermelho + amarelo (padrão) |
| `outline` | Linhas finas, sobreposição em imagens claras |
| `solid-red` / `solid-yellow` | Iluminado / monocromático |

Tamanhos recomendados: 24-48px em badges; 80-120px em hero; 400px+ em background decorativo com `opacity` ≤ 8%.

### Faixa diagonal vermelha

Motivo recorrente nas peças do manual (faixas inclinadas saindo das laterais). Use como acento de borda, não como container. Implementação via `clip-path`:

```tsx
<div
  aria-hidden
  className="pointer-events-none absolute left-0 top-0 h-full w-[14%] bg-gradient-to-b from-primary to-primary-hover"
  style={{ clipPath: "polygon(0 0, 100% 0, 60% 100%, 0 100%)" }}
/>
```

Aplicar com moderação — uma por página, sempre no hero ou área principal.

### Logo (`<InventLogo />`)

| Variant | Quando usar |
|---|---|
| `default` | Padrão — texto cinza escuro / branco em dark, "v" colorido |
| `mono-dark` | Fundos coloridos claros sem competir com o brand |
| `mono-light` | Fundos escuros, dark hero |

Tamanho mínimo recomendado: 100px de largura.

## Componentes (estado atual)

Tudo em `components/`. shadcn/ui adicionado sob demanda em `components/ui/` conforme primitivos necessários.

| Componente | Localização |
|---|---|
| Logo + V mark | `components/brand/InventLogo.tsx` |
| Header + footer | `components/marketing/SiteShell.tsx` |

## Tom e voz

- **Português brasileiro**, segunda pessoa direta ("você"). Sem formalidade exagerada; sem gíria.
- **Verbo no imperativo afirmativo** em CTAs ("Explorar cursos", "Continuar curso", "Emitir certificado").
- **Frases curtas em hero**, parágrafos médios em corpo. Evitar bullet points que substituam parágrafos completos.
- **Termos SAP em inglês** quando consagrados (`Business One`, `S/4HANA`, `SPED`, `NF-e`), mas evite jargão sem contexto fora da área técnica.
- **Sem emoji** em UI de produto. OK em copy de email transacional moderadamente.

## Acessibilidade

- Todo botão e link têm focus visible com `focus:ring-2 focus:ring-primary/20`.
- Alvos de toque mínimos 44×44px em mobile.
- Tons cinza muito claro só para divisórias, nunca texto.
- Imagens decorativas (V mark de fundo, faixas) têm `aria-hidden`.
- Contraste mínimo verificado:
  - `foreground` em `background`: **15.4:1** (AAA)
  - `muted-foreground` em `background`: **8.1:1** (AAA)
  - `primary-foreground` em `primary`: **5.3:1** (AA)
- Sem dependência exclusiva de cor: cards de categoria usam barra colorida + texto, indicadores de progresso usam % textual.

## Onde tocar quando o design evoluir

1. Tokens de cor / radius / spacing → `app/globals.css` (variáveis HSL).
2. Fonte → `app/layout.tsx` (configuração `next/font`) + `tailwind.config.ts` (`fontFamily`).
3. Logo / V mark → `components/brand/InventLogo.tsx`.
4. Header / footer compartilhados → `components/marketing/SiteShell.tsx`.
5. shadcn/ui adicionados via `pnpm dlx shadcn add <component>` em `components/ui/`.

Atualize este documento sempre que adicionar um token novo, mudar pesos de tipografia ou criar um componente de marca.
