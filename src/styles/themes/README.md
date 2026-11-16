# Themes

A theme is a single CSS file that sets design tokens. Nothing else changes:
components read the tokens, so every page — posts, search, comments, login —
follows the active theme.

```
src/styles/
  tokens.css          # the token contract and its default values
  theme.css           # the active theme; a single @import
  themes/
    _template.css     # copy this to start a theme
    anthracite.css    # the current theme
```

## Apply a theme

Edit `src/styles/theme.css` and change the import:

```css
@import "./themes/anthracite.css";
```

That is the whole switch. No build arguments, no environment variables, and it
works the same in Docker.

## Create a theme

1. Copy `_template.css` to `themes/<name>.css`.
2. Set the colour tokens. The template lists every one; leaving a token out
   keeps its default from `tokens.css`.
3. Optionally set `--font-*`, `--font-size-*`, `--radius-*` or shadow tokens for
   a different character.
4. Mirror the light values in the `@supports not (color: light-dark(...))` block
   at the bottom so older browsers get the same palette.
5. Point `theme.css` at the new file.

## Rules

- Only set custom properties on `:root`. Don't style selectors in a theme; if a
  component needs a new value, add a token to `tokens.css` and use it there.
- Colours use `light-dark(<light>, <dark>)`. A plain colour changes both modes
  at once.
- Component CSS must use tokens, never literal colours or font stacks. Run
  `pnpm check:theme` to catch violations; it allows `#000`/`#fff` for masks and
  the `@supports` probe, and `font-family` keywords such as `inherit`.

## Fonts

Webfonts are loaded by Astro's font pipeline in `astro.config.mjs`
(`--font-body`, `--font-mono`). A theme that only changes colours, spacing or
scale needs no config change. A theme with a different typeface additionally
needs its font added to that `fonts` array (or self-hosted `@font-face` rules),
then it can set `--font-body`/`--font-heading` in the theme file.

## Scope

This covers the public site. The EmDash admin UI under `/_emdash/admin` is
EmDash's own interface and does not use these tokens.
