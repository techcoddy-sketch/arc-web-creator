## Theme System for Remonk Reminder

A premium, accessible theme system added to Profile that personalizes accents, surfaces, and status colors while preserving the app's minimal identity.

### Scope (Phase 1 — ship now)

1. **6 predefined themes** (light + dark variants each)
   - **Vermilion** (default — current Remonk identity)
   - **Graphite** (neutral mono, productivity)
   - **Indigo** (calm focus)
   - **Forest** (warm green)
   - **Sunset** (peach/coral)
   - **Plum** (muted purple)

2. **Mode toggle**: Light / Dark / System (auto-follows OS).

3. **Status colors stay semantic** across all themes:
   - Valid → soft green
   - Expiring soon → soft amber
   - Expired → muted red
   Each theme tunes the *exact* hue but keeps the meaning intact.

4. **Profile integration**
   - New "Appearance" card in Profile (above Notifications).
   - Tap → opens `/settings/appearance` page.
   - Page shows: Mode segmented control + theme grid with live swatch previews + "Currently active" badge.
   - Tap a swatch = instant apply with smooth 250ms color transition.

5. **Persistence + sync**
   - Saved to `localStorage` immediately (zero-latency on next launch).
   - Synced to `profiles.theme_preference` jsonb (`{ theme: 'vermilion', mode: 'system' }`) so it follows the user across devices.

6. **Architecture**
   - All themes defined as HSL token sets in `src/lib/themes.ts`.
   - `ThemeProvider` context applies tokens to `:root` via CSS variables — no component changes needed because the whole app already uses `hsl(var(--primary))` etc.
   - `html { transition: background-color 250ms, color 250ms }` for smooth switching.
   - Status tokens (`--valid`, `--expiring`, `--expired` and their `-bg` / `-foreground` variants) are part of every theme.

### Technical Details

- **DB migration**: add `theme_preference jsonb default '{"theme":"vermilion","mode":"system"}'` to `profiles`.
- **Files added**:
  - `src/lib/themes.ts` — theme token registry
  - `src/contexts/ThemeContext.tsx` — provider + hook
  - `src/pages/AppearanceSettings.tsx` — settings page
- **Files edited**:
  - `src/App.tsx` — wrap with `ThemeProvider`
  - `src/index.css` — add transition + ensure all themed tokens are CSS variables
  - `src/pages/Profile.tsx` — add Appearance entry
  - route added to router

### Out of scope (future phases, architecture supports)

- Custom user-defined accent picker
- AI / wallpaper-derived themes
- Scheduled auto-switching (e.g. dark after sunset)
- Seasonal / focus-mode packs

These are noted in the philosophy but deferred so the first release stays focused and shippable.
