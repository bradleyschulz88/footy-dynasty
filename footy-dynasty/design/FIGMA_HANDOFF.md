# Figma Dev Mode → code handoff

Use this as a **paste buffer** when copying from Figma Dev Mode into Cursor. Fill one section per screen or component, then paste the block into chat with your request.

## Frame / component

- **Figma frame name**:
- **File link** (view-only): 
- **Breakpoint**: desktop / tablet / mobile

## Colours (from Figma variables or fills)

Paste hex or rgba from Dev Mode:

| Token role | Hex / value | Maps to CSS (see `tokens.css`) |
|------------|-------------|----------------------------------|
| Background | | `--A-bg` or `--B-bg` |
| Panel | | `--A-panel` |
| Primary text | | `--A-text` |
| Accent | | `--A-accent` |
| Positive | | `--A-pos` |
| Negative | | `--A-neg` |

After updating Figma, sync **`design/tokens.json`** and **`tokens.css`** (`:root` and direction blocks) so Tailwind utilities stay aligned.

## Spacing & layout

From Dev Mode (padding, gap, width/height):

- Container max-width:
- Section padding:
- Stack gap:
- Grid columns:

App spacing scale (4px grid): `var(--space-1)` … `var(--space-10)` — see `design/tokens.json` → `space`.

Tailwind (optional): `p-token-4`, `gap-token-3`, `rounded-token-lg`, `text-token-body`.

## Typography

| Style | Figma style name | Size / weight | App variable |
|-------|------------------|---------------|---------------|
| Body | | | `var(--font-body)` |
| Label | | | `var(--font-micro)` / `var(--font-caption)` |
| Display | | | `var(--font-display)` |

Fonts: **Inter** (sans), **JetBrains Mono** (mono / labels in Direction A), **Bebas Neue** (display / Direction B labels).

## Radii & borders

| Element | Radius | App variable |
|---------|--------|--------------|
| Card / panel | | `var(--radius-lg)` (A) or `var(--radius-b-panel)` (B) |
| Button | | `var(--radius-sm)` |
| Pill | | `var(--radius-pill)` |

## Raw CSS snippet (from Figma “Copy as CSS”)

```css
/* paste Dev Mode CSS here */
```

## Notes for implementer

- Theme wrapper: root layout uses `dirA` or `dirB`; shared utilities use `--A-*` (remapped under B).
- Primitives: `src/components/primitives.jsx` (`css` helpers, `GlobalStyle`).
- JSON mirror for tools: `design/tokens.json`.
