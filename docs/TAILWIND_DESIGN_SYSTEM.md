# Tailwind CSS Design System & Mobile Ergonomics

## 1. PostCSS & Utility-First Pipeline
Tailwind CSS runs through a standard PostCSS build pipeline:
```
client/src/index.css
  ├── @tailwind base;
  ├── @tailwind components;
  └── @tailwind utilities;
```
Compiled via PostCSS (`postcss.config.js`) with `tailwindcss` and `autoprefixer`. In production, the Tailwind CLI purges all unused classes, delivering an ultra-small CSS payload (~15KB gzipped).

---

## 2. Color Palette & Agro-Theming
The palette is specifically selected for agricultural environments (high outdoor sunlight visibility, legible contrast ratios meeting WCAG 2.1 AA):
- **Emerald Primary (`#065f46`, `#047857`, `#059669`)**: Symbolizes healthy crops, vitality, and primary interface actions.
- **Amber Accent (`#f59e0b`, `#d97706`, `#78350f`)**: Used for agricultural warnings, weather alerts, and APMC market prices.
- **Rose Destructive (`#f43f5e`, `#e11d48`)**: High-severity disease indicators and microphone recording states.
- **Slate Neutral (`#0f172a`, `#334155`, `#f8fafc`)**: Base text, subtle borders, and soft card backdrops.

---

## 3. Mobile Viewport & Ergonomics
1. **Thumb Zone Architecture**:
   On mobile devices, navigation is placed in a fixed bottom bar (`bottom-0 inset-x-0`) within natural thumb reach, avoiding awkward top-of-screen reachability.
2. **Minimum Touch Targets (48px × 48px)**:
   Buttons, audio playback toggles, and photo triggers maintain a minimum size of 48px to prevent accidental taps on field touchscreens.
3. **Viewport Adaptation**:
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
   ```
   Prevents double-tap zooming on buttons and supports notch/island screens via `viewport-fit=cover`.
