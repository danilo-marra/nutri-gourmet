# UI/UX — Diretrizes Visuais

**Summary**: Padrões de interface do sistema de gestão de cantina — design system, paleta de cores, tipografia e componentes implementados.

**Sources**: raw/prd.md, design bundle Nutrigourmet (Tailwind v4 + tokens)

**Last updated**: 2026-06-12 (PR #92)

---

O PRD define estilo corporativo moderno com foco em valor percebido. A implementação adota o design system Nutrigourmet com paleta infantil vibrante e tipografia arredondada. (source: raw/prd.md)

## Stack de frontend

- **Framework CSS**: Tailwind CSS v4 via `@tailwindcss/postcss`
- **Tokens**: definidos em `styles/globals.css` com `@theme` (cores, fontes, radii, sombras)
- **Fontes**: carregadas via `next/font/google` em `pages/_app.tsx`
- **Linguagem**: TypeScript em todo o frontend desde o PR #66 (`.tsx`/`.ts`); padrão `NextPageWithLayout` exportado por `pages/_app.tsx`

## Superfícies

| Superfície    | Rota      | Descrição                                                  |
| ------------- | --------- | ---------------------------------------------------------- |
| Landing page  | `/`       | Página de marketing para pais e diretores de escolas       |
| Login         | `/login`  | Autenticação de operadores, supervisores e administradores |
| App (interno) | `/app/**` | Área autenticada — dashboard e módulos operacionais        |

### Área autenticada (`/app/**`)

Todas as rotas sob `/app` usam o componente `AppShell` via padrão `getLayout`:

| Rota              | Módulo           | Status                             |
| ----------------- | ---------------- | ---------------------------------- |
| `/app`            | Dashboard        | Implementado (dados reais via SWR) |
| `/app/vendas`     | Vendas           | Implementado (PR #83)              |
| `/app/creditos`   | Créditos         | Implementado                       |
| `/app/fechamento` | Fechamento Caixa | Implementado (PR #84)              |
| `/app/relatorios` | Relatórios       | Implementado                       |
| `/app/alunos`     | Alunos           | Implementado (PR #85)              |
| `/app/produtos`   | Produtos         | Implementado (PR #86)              |
| `/app/usuarios`   | Usuários         | Implementado (PR #87)              |

**AppShell** (`components/AppShell.tsx`): sidebar fixa (logo, nav filtrado por `user.features`, user card + logout) + topbar (título da página + badge de role). Usa `useUser` hook internamente — exibe spinner durante carregamento, retorna `null` se não autenticado (redirect gerenciado pelo hook).

**Proteção de rotas**: `hooks/useUser.ts` — SWR sobre `GET /api/v1/user` (tipado como `SessionUser`, formato wire do `filterOutput`); redireciona para `/login` automaticamente se sessão inválida ou expirada.

## Paleta de cores

| Token                       | Valor     | Uso                               |
| --------------------------- | --------- | --------------------------------- |
| `--color-brand-green`       | `#5BBF4E` | CTAs principais, botões primários |
| `--color-brand-green-hover` | `#4AA33E` | Hover de botão primário           |
| `--color-brand-teal`        | `#2ABAA6` | Foco de inputs, links secundários |
| `--color-brand-teal-hover`  | `#239E8C` | Hover de teal                     |
| `--color-brand-orange`      | `#F5A623` | Tagline, acentos decorativos      |
| `--color-accent-yellow`     | `#FFCB65` | Blobs decorativos, hero landing   |
| `--color-bg-page`           | `#FEFCFB` | Fundo da página                   |
| `--color-gray-bg-section`   | `#F6F7F6` | Fundo de seções alternadas        |
| `--color-fg-1`              | `#272932` | Texto principal                   |
| `--color-fg-2`              | `#52545B` | Texto secundário                  |
| `--color-fg-3`              | `#8A8C90` | Texto desabilitado / placeholder  |
| `--color-danger`            | `#FF434E` | Erros, estados negativos          |
| `--color-brand-pix`         | `#7e22ce` | Badge/ícone de pagamento Pix      |
| `--color-brand-pix-subtle`  | `#f3e8ff` | Fundo de badge Pix                |

## Tipografia

| Fonte             | Variável         | Uso                               |
| ----------------- | ---------------- | --------------------------------- |
| Fredoka 700       | `--font-brand`   | Wordmark, títulos de marca        |
| Dancing Script    | `--font-tagline` | Tagline decorativa (landing page) |
| Poppins           | `--font-primary` | Corpo, headings da UI             |
| Figtree           | `--font-body`    | Texto corrido                     |
| Plus Jakarta Sans | `--font-button`  | Labels de botões                  |
| Inter             | `--font-data`    | Valores numéricos, stats          |

## Diretrizes visuais

- **Border radius**: `--radius-lg` (12px) para botões; `--radius-xl` (16px) para cards
- **Sombras**: `--shadow-md` (`0 2px 8px rgba(0,0,0,0.08)`) em cards e modais
- **Inputs**: borda `#E1E1E2`, foco em teal, erro em `#FF434E`
- **Botão primário**: verde `#5BBF4E`, hover `#4AA33E`, texto branco, disabled opacidade 60%
- **Animações**: mínimas — apenas `transition-colors` 150ms em hover states

## Componentes compartilhados

| Componente               | Arquivo                                 | Usado em                                                  |
| ------------------------ | --------------------------------------- | --------------------------------------------------------- |
| `AppShell`               | `components/AppShell.tsx`               | Todas as rotas `/app/**`                                  |
| `PasswordStrengthHelper` | `components/PasswordStrengthHelper.tsx` | `/recovery/[token_id]`, `/app/usuarios` (form de convite) |

**PasswordStrengthHelper**: recebe `password: string` e `onGenerate: (pwd: string) => void`. Exibe 5 critérios em tempo real (≥ 8 chars, maiúscula, minúscula, número, símbolo) com ícones ✓/✗ coloridos (`text-brand-green` / `text-danger`). Botão "Gerar senha segura" usa `crypto.getRandomValues` para gerar 12 chars satisfazendo todos os critérios. Sem dependências externas. (PR #92)

## Intenção

A **landing page** (`/`) usa paleta quente (gradiente creme→laranja→verde claro), hero com blobs decorativos em amarelo/laranja, e cópia direcionada a pais de alunos e diretores de escolas — transmitindo confiança e profissionalismo antes de qualquer login.

O **app interno** deve transmitir confiabilidade e profissionalismo para a Gestora ([[administrador]]), ao mesmo tempo que é ágil e direta para o [[operador]] no fluxo de vendas diárias.

Imagens da landing page usam fotografia real da cantina em `public/cantina/` (bandejas, cozinha, lanches).

## Related pages

- [[operador]]
- [[administrador]]
- [[prd-summary]]
