# UI/UX — Diretrizes Visuais

**Summary**: Padrões de interface do sistema de gestão de cantina — design system, paleta de cores, tipografia e componentes implementados.

**Sources**: raw/prd.md, design bundle Nutrigourmet (Tailwind v4 + tokens)

**Last updated**: 2026-05-29

---

O PRD define estilo corporativo moderno com foco em valor percebido. A implementação adota o design system Nutrigourmet com paleta infantil vibrante e tipografia arredondada. (source: raw/prd.md)

## Stack de frontend

- **Framework CSS**: Tailwind CSS v4 via `@tailwindcss/postcss`
- **Tokens**: definidos em `styles/globals.css` com `@theme` (cores, fontes, radii, sombras)
- **Fontes**: carregadas via `next/font/google` em `pages/_app.js`

## Paleta de cores

| Token                  | Valor     | Uso                               |
| ---------------------- | --------- | --------------------------------- |
| `--color-brand-green`  | `#5BBF4E` | CTAs principais, botões primários |
| `--color-brand-teal`   | `#2ABAA6` | Foco de inputs, links secundários |
| `--color-brand-orange` | `#F5A623` | Tagline, acentos decorativos      |
| `--color-bg-page`      | `#FEFCFB` | Fundo da página                   |
| `--color-fg-1`         | `#272932` | Texto principal                   |
| `--color-danger`       | `#FF434E` | Erros, estados negativos          |

## Tipografia

| Fonte             | Variável         | Uso                        |
| ----------------- | ---------------- | -------------------------- |
| Fredoka 700       | `--font-brand`   | Wordmark, títulos de marca |
| Poppins           | `--font-primary` | Corpo, headings da UI      |
| Figtree           | `--font-body`    | Texto corrido              |
| Plus Jakarta Sans | `--font-button`  | Labels de botões           |

## Diretrizes visuais

- **Border radius**: `--radius-lg` (12px) para botões; `--radius-xl` (16px) para cards
- **Sombras**: `--shadow-md` (`0 2px 8px rgba(0,0,0,0.08)`) em cards e modais
- **Inputs**: borda `#E1E1E2`, foco em teal, erro em `#FF434E`
- **Botão primário**: verde `#5BBF4E`, hover `#4AA33E`, texto branco, disabled opacidade 60%
- **Animações**: mínimas — apenas `transition-colors` 150ms em hover states

## Intenção

A interface deve transmitir confiabilidade e profissionalismo para a Gestora ([[administrador]]), ao mesmo tempo que é ágil e direta para o [[operador]] no fluxo de vendas diárias.

## Related pages

- [[operador]]
- [[administrador]]
- [[prd-summary]]
