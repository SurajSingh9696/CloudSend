# Styling and CSS Guide — CloudSend

This document explains how the project's CSS is organized, how to use the provided visual tokens and handcrafted classes, and how to extend or debug the styling.



Overview
- Tailwind CSS is the primary styling system; a small set of handcrafted global CSS classes implements the "paper ledger" motif.
- Fonts are loaded via next/font in `app/layout.tsx` and exposed as CSS variables for Tailwind fallback.
- `app/globals.css` imports Tailwind layers and declares runtime CSS variables and global handcrafted classes.
- Tailwind scans `./app/**/*.{ts,tsx}` and `./components/**/*.{ts,tsx}` (see `tailwind.config.ts`) to generate utilities.

How styles are loaded
1. Fonts: `app/layout.tsx` loads Google fonts with next/font and writes variables `--font-serif` and `--font-mono` on the `<html>` element.
2. Globals: `app/globals.css` is imported by the root layout; it contains `@tailwind` directives and the handcrafted rules.
3. Tailwind build: PostCSS loads Tailwind via `postcss.config.mjs`; Next.js triggers the PostCSS build during dev/build.

Design tokens (CSS variables)
Defined in `:root` inside `app/globals.css` — keep these and Tailwind config in sync when editing.
- --paper: #f5f1e8
- --paper-light: #fdfbf6
- --ink: #142033
- --muted: #687071
- --rule: #d8d1c4
- --rust: #a33b20
- --green: #1f3b2d

Tailwind theme extensions (`tailwind.config.ts`)
- Colors added: paper, paper-light, paper-mid, paper-dark, ink, ink-muted, ledger-green, green-muted, rust, rust-light, rust-mid, rule, muted
- Font families: `serif` and `mono` are configured to use the next/font CSS variables
- Small spacing and borderWidth additions are available (e.g., spacing `4.5`, `13`, `18`, borderWidth `3`)

Handcrafted global classes (what they do and how to use)
- .display-serif
  - Use: Add `className="display-serif"` to headings or display text to apply a serif display font (Georgia/Cambria/Times) instead of the mono default.
  - Tailwind alternative: `font-serif` (configured to use the same font variable)

- .paper-card
  - Use: Wrap ledger-like panels with `className="paper-card"` to apply paper texture, subtle ruled background, 1px border and light drop shadow.
  - Example: `<div className="paper-card p-6 rounded-md">...</div>`
  - Implementation notes: Includes an inner `::before` inset border for a framed look.

- .stamp
  - Use: Apply to badges/stamps to get an inset double-line and dashed inner border. Combine with color utilities: `text-rust bg-rust-light`.
  - Example: `<span className="relative inline-block stamp px-3 py-1 text-rust bg-rust-light">STAMP</span>`

- .otp-box:focus
  - Use: Focus styling for OTP/code inputs; shows an outline using the ledger green token.

- .upload-zone[data-dragging="true"]
  - Use: File upload drop zones should set the `data-dragging` attribute to `true` while a drag is active to change visuals.
  - Example markup: `<div className="upload-zone border-2 border-rule p-6" data-dragging={isDragging}>...</div>`
  - JS behavior: Toggle `data-dragging` in drag event handlers (dragenter/dragover/dragleave/drop).

Where to apply styles
- Use Tailwind utility classes for layout, spacing, typography, and responsive behavior.
- Use the handcrafted classes (`.paper-card`, `.stamp`, `.upload-zone`) for the ledger-specific visual motif.
- For component-scoped, non-Tailwind CSS, prefer CSS Modules (e.g., `Component.module.css`) imported into the component.
- Keep `app/globals.css` as the single global stylesheet imported in the root layout only.

Examples
- Ledger card
  - JSX: `<div className="paper-card p-6 rounded-md">...content...</div>`

- Stamped badge
  - JSX: `<div className="relative inline-block stamp px-3 py-1 text-rust bg-rust-light">STAMP</div>`

- Upload zone drag state
  - Markup: `<div className="upload-zone border-2 border-rule p-6" data-dragging={isDragging}>Drop files here</div>`
  - Toggle `isDragging` in your component's drag handlers.

Extending and changing styles
- Colors / tokens: Update `:root` in `app/globals.css` and mirror changes in `tailwind.config.ts`. Restart or let dev server pick up changes.
- New global utility: Add small visuals into `app/globals.css` near existing classes.
- Component-scoped styles: Use CSS Modules next to the component file.
- Fonts: Change or add fonts in `app/layout.tsx` using next/font and expose them as CSS variables for Tailwind fallback.

Debugging tips
- Missing Tailwind utility: Ensure the file using the class is covered by the `content` globs in `tailwind.config.ts`.
- Global changes not applied: Confirm `app/globals.css` is imported only in the root layout and Next dev server is running.
- Attribute-based states: Use DevTools to verify `data-dragging` or other attributes are present on the element.

Build & dev commands
- Dev server: `npm run dev` (http://localhost:3000)
- Production build: `npm run build` then `npm start`

Quick reference
- CSS variables: `--paper`, `--paper-light`, `--ink`, `--muted`, `--rule`, `--rust`, `--green` (see `app/globals.css`)
- Tailwind colors: `paper`, `paper-light`, `paper-mid`, `paper-dark`, `ink`, `ink-muted`, `ledger-green`, `green-muted`, `rust`, `rust-light`, `rust-mid`, `rule`, `muted`
- Global classes: `.paper-card`, `.stamp`, `.display-serif`, `.otp-box:focus`, `.upload-zone[data-dragging="true"]`
- Fonts: `font-serif` and `font-mono` tailwind utilities map to next/font variables defined in `app/layout.tsx`.

Next steps (optional)
- Add example component demonstrating `paper-card`, `stamp`, and drag behavior.
- Update README with a short styling overview and link to this file.

---

Document generated by Copilot CLI runtime in VS Code.
