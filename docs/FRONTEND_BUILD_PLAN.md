# Rythu Mitra — Frontend Build Plan (Next.js)

## 1. Stack
- Next.js (App Router) + React + TypeScript
- Tailwind CSS with CSS-variable design tokens
- shadcn/ui (Radix) primitives, Sonner, Vaul, cmdk, NumberFlow
- Magic UI (subtle motion) + Aceternity UI (one standout per page)
- lucide-react icons

## 2. Design System
### Color tokens (HSL, light/dark)
- `--primary` deep emerald; `--accent` harvest amber; `--destructive` rose
- `--background` warm paper; `--foreground` green-black; `--muted`, `--border`, `--ring`
- No ad-hoc hex in components; everything via semantic tokens.

### Typography
- UI: Plus Jakarta Sans
- Telugu: Noto Sans Telugu
- Data/numerals: JetBrains Mono

### Geometry & motion
- Radius: `0.75rem` base, `1rem` cards, `1.5rem` hero
- Spacing: 4px scale
- Shadows: `shadow-subtle`, `shadow-card`, `shadow-elevated`
- Motion: 150/250/400ms; respect `prefers-reduced-motion`

## 3. Component → Library
| Component | Library |
|---|---|
| Button, Input, Card, Dialog, Dropdown, Tabs, Badge | shadcn/ui |
| Tooltip, Switch, Select, ScrollArea | Radix |
| Toasts | Sonner |
| Mobile drawer | Vaul |
| Command menu | cmdk |
| Animated numbers | NumberFlow |
| Subtle reveals / shiny text | Magic UI |
| Standout hero / result reveal | Aceternity UI |
| Icons | lucide-react |

## 4. Page Standout Rule (one per page)
| Page | Standout moment |
|---|---|
| Crop Doctor | TextGenerateEffect on real diagnosis |
| Advisor | AnimatedShinyText waiting indicator |
| Weather | NumberFlow temperature |
| Mandi | NumberFlow modal price |
| Expo | Spotlight hero |

## 5. Honesty & State Rules
- No sample/mock data, no example scenarios hardcoded.
- AI responses carry `mode: "live" | "degraded"`; degraded shows an amber warning, never success.
- Sonner is used for errors/warnings; success toasts only for verified actions.
- Missing endpoints show an explicit "not available on this deployment" state.
- Loading, empty, error, and degraded states are first-class.

## 6. Accessibility
- Semantic landmarks, labelled controls, visible focus rings.
- WCAG AA contrast, 48px touch targets, keyboard-operable command menu and dialogs.
- Reduced-motion fallbacks.

## 7. Running
```powershell
cd apps/web
npm install
npm run dev        # http://localhost:3100
npm run build      # production build
npm run lint       # ESLint (flat config, Next core-web-vitals + TS)
npm run typecheck  # tsc --noEmit
npm test           # Vitest unit tests
```
`/api/*` is proxied to `API_ORIGIN` (default `http://localhost:3000`). Set `API_ORIGIN` in the environment to point at the backend.

## 8. Structure
```
apps/web/
├── app/            # layout + routes
├── components/
│   ├── ui/         # shadcn primitives
│   ├── magic/      # subtle motion
│   ├── aceternity/ # standout visuals
│   ├── shell/      # nav, command menu, mobile drawer
│   ├── doctor|advisor|weather|mandi|expo/
│   └── providers/  # locale, theme
└── lib/            # api client, types, utils
```
