# Design System — Universidade Invent

Identidade visual oficial entregue via **Claude Design** ([handoff bundle](./brand/design-system-v2/README.md) + manual de marca em [PDF](./brand/manual-de-marca-invent.pdf)). Esta é a fonte canônica do design system aplicado à Universidade Invent.

## Princípios

- **Mobile-first.** Aluno consome no celular durante deslocamento.
- **Performance é design.** Lighthouse 90+ em páginas-chave.
- **Acessibilidade nunca é "depois".** Toda iteração passa por checklist WCAG AA. Contraste mínimo AA em UI, AAA em corpo longo.
- **Player de vídeo é o componente mais importante** da experiência. Maior cuidado de polimento.
- **Sutileza vence excesso.** O V-mark e a `surface-premium` (dark hero) são acentos, nunca o protagonista de cada tela. Brand entra em hero, empty states e momentos de transição — não em formulários ou listas densas.

## Cores

Tokens em [`app/globals.css`](../app/globals.css) — primitivas Invent (`--invent-*`) + aliases semânticos HSL para shadcn/Tailwind. Em componentes, **prefira classes semânticas** (`bg-primary`, `text-accent`, `border-border`) sobre cor literal.

### Brand — palette canônica

| Token | Hex | Uso |
|---|---|---|
| **`--invent-gold-500`** (PRIMARY) | `#F7A600` | Cor dominante: CTAs primários, eyebrows, links de navegação ativos, headings hero. **Mais usada do que vermelho ou preto.** |
| `--invent-gold-600` | `#D08800` | Hover do primary |
| `--invent-gold-300` | `#FFC246` | Highlights em fundos escuros |
| **`--invent-red-500`** (ACCENT) | `#D81E2D` | Acentos, badges, indicadores ativos. Use **contra** dourado, não como surface |
| `--invent-red-700` | `#8E121C` | Hover do accent / texto em estados ativos |
| `--invent-red-50` | `#FFEDEE` | Background de itens ativos em listas/nav |
| `--invent-ink` | `#1F1F23` | Texto principal |
| `--invent-gray-700` | `#4B5566` | Texto secundário (cor exata do wordmark) |
| `--invent-gray-500` | `#8B92A0` | Texto terciário / captions |
| `--invent-gray-200` | `#E2E5EA` | Bordas, divisórias |
| `--invent-gray-50` | `#F7F8FA` | Background canvas |
| `--invent-black` | `#0A0A0B` | Surface premium (hero dark) |

### Cores por produto

| Produto | Inicial | Cor | Token |
|---|---|---|---|
| **TaxPlus** | T | Roxo profundo `#4527A0` | `bg-product-tax` |
| **BankPlus** | B | Dourado `#F7A600` | `bg-product-bank` |
| **ContractPlus** | C | Vermelho `#D81E2D` | `bg-product-contract` |
| **Invent Payroll** | (sem marca publicada) | Cinza cool `#4B5566` | `bg-product-payroll` |

Usar **só em surfaces específicas do produto** (cards de curso daquela trilha, badges de categoria, splashes de capa). Nunca usar TaxPlus roxo em chrome de UI fora de contexto TaxPlus.

### Gradiente V-mark

Vertical, dourado (topo) → vermelho (base):

```css
linear-gradient(180deg, #FFB000 0%, #F7A600 38%, #D81E2D 78%, #B81825 100%)
```

Utilities Tailwind: `bg-v-gradient`, `text-v-gradient`. **Uso restrito:**
- Headlines hero (uma palavra-chave; ex.: "SAP da Invent")
- Badges premium / "em destaque"
- Barras de progresso celebratórias
- Glow decorativo (com blur) em cards heroes

**Não usar** em fundos de seção inteira, botões normais, texto de corpo.

### Surface premium (dark)

Utility `surface-premium`. Fundo escuro com glows sutis dourado + vermelho. Usar em:
- Hero de marketing
- Painel de splash em páginas de auth
- Banners de seção tipo "ISV premiada"
- **Nunca** em UI operacional (admin, instrutor, aluno) — esses ficam sempre na variante light.

```html
<section class="surface-premium text-white">...</section>
```

## Tipografia

Substituição do manual oficial (Le Havre — Adobe Fonts, restrita ao logo) por Google Fonts:

- **Display: Barlow** (sans geométrico, levemente condensado) — pesos 500/600/700/800. Variável `--font-display`. Tailwind: `font-display`.
- **Body / UI: Inter** — pesos 400/500/600/700. Variável `--font-body`. Tailwind: `font-sans` (default).
- **Mono: JetBrains Mono** — para durações de aula, código, badges técnicos. Variável `--font-mono`. Tailwind: `font-mono`.

### Hierarquia

| Nível | Classe Tailwind | Uso |
|---|---|---|
| Display XL | `font-display text-6xl md:text-7xl font-extrabold tracking-tight` | Hero da home |
| Display L | `font-display text-4xl md:text-5xl font-extrabold tracking-tight` | Headers de seção (sobre, catálogo) |
| Display M | `font-display text-3xl md:text-4xl font-bold tracking-tight` | Section headings dentro de páginas |
| Display S | `font-display text-xl md:text-2xl font-bold tracking-tight` | Card titles, modal headings |
| Body L | `text-lg md:text-xl text-muted-foreground` | Lead paragraph |
| Body | `text-base` | Padrão |
| Small | `text-sm text-muted-foreground` | Meta, captions |
| Micro/eyebrow | `text-xs font-semibold uppercase tracking-wider text-primary` | Eyebrow labels |

## Espaçamento e raios

- Radius base: `--radius: 0.5rem` (8px). `rounded-md` (6), `rounded-lg` (8), `rounded-xl` (12), `rounded-2xl` (16). `rounded-full` para pills/avatars.
- Sombras: `shadow-xs` / `shadow-sm` / `shadow-md` / `shadow-lg` / `shadow-xl` — todas calibradas no `tailwind.config.ts`.
- Container: max 1280px (Tailwind default ajustado).
- Vertical rhythm: `py-16 md:py-20` (padrão), `py-20 md:py-28` (hero).

## Componentes

### Logos (`components/brand/InventLogo.tsx`)

Sempre PNGs oficiais via `next/image` (em `public/brand/`).

| Componente | Quando usar |
|---|---|
| `<InventLogo variant="light-bg" />` | Fundos claros — `invent-cinza.png` (wordmark cinza + V colorido) |
| `<InventLogo variant="dark-bg" />` | Fundos escuros (surface-premium, hero dark) — `invent-branca.png` |
| `<InventVMark />` | Símbolo "V" isolado — `v-mark.png`. Usar em badges, favicons, decorações |
| `<ProductLogo product="taxplus" />` | Logo do produto Invent específico (taxplus/bankplus/contractplus) |

Tamanho mínimo recomendado: 100px de largura para o wordmark completo.

### Layout

- **Marketing**: `<SiteHeader />` + `<SiteFooter />` de `components/marketing/SiteShell.tsx`. Header sticky, footer simples.
- **Área logada**: `<AppShell />` de `components/app/AppShell.tsx` — sidebar fixa de 260px à esquerda (desktop) com nav por papel, mini-card de trilha, user box. Em mobile vira topbar.

### Auth

`components/auth/SignInForm.tsx` + `SignUpForm.tsx` + `OAuthButton.tsx` (Google/Microsoft) + `SignOutButton.tsx` — tudo wired aos server actions em `lib/auth/actions.ts`.

## Iconografia

Inline SVG (estilo Lucide) em `components/app/AppShell.tsx#ICONS`. Stroke 1.75px, 18-24px nominal, `currentColor`. Para casos novos: copiar do conjunto Lucide e seguir o mesmo formato (stroke-based, sem fill). Não usar emoji em UI de produto.

## Tom e voz

- **Português brasileiro**, segunda pessoa direta ("você"). Sem formalidade exagerada; sem gíria.
- Verbo no imperativo afirmativo em CTAs ("Explorar cursos", "Continuar curso", "Emitir certificado").
- Frases curtas em hero; parágrafos médios em corpo.
- Produtos em PascalCase: TaxPlus, BankPlus, ContractPlus (nunca "Tax Plus" ou "TAXPLUS"). SAP com `®` quando o contexto for legal/institucional (SAP®, SAP Business One®).
- Sem emoji em UI de produto. OK em copy de email moderadamente.
- Vibe markers que recorrem na marca: "Otimizar a performance de pessoas e empresas", "Sem dor de cabeça", "Jeito InventER de ser".

## Acessibilidade

- Focus visible: `focus:ring-2 focus:ring-primary/30`.
- Alvos de toque mínimos 44×44px em mobile.
- Imagens decorativas (V-mark de fundo, hero illustrations) têm `aria-hidden`.
- Sem dependência exclusiva de cor: cards de categoria usam barra colorida + texto, indicadores de progresso usam % textual.
- Cores semânticas têm contraste verificado:
  - `foreground` em `background`: AAA
  - `muted-foreground` em `background`: AA+
  - `primary-foreground` em `primary` (branco em dourado): borderline AA — para texto pequeno, considerar `text-invent-gray-900` no hover

## Onde tocar quando o design evoluir

| O que mudou | Onde editar |
|---|---|
| Tokens (cores, radius, sombra) | `app/globals.css` (vars CSS) + `tailwind.config.ts` (aliases) |
| Fonte | `app/layout.tsx` (next/font config) + `tailwind.config.ts` (fontFamily) |
| Logo | `components/brand/InventLogo.tsx` + arquivos em `public/brand/` |
| Header/footer marketing | `components/marketing/SiteShell.tsx` |
| Sidebar logada | `components/app/AppShell.tsx` |
| Forms de auth | `components/auth/*.tsx` |

Sempre atualize **este documento** quando adicionar token novo, mudar peso de tipografia ou criar componente de marca.
