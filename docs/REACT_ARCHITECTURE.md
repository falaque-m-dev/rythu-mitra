# React Architecture & Engineering Standards: Rythu Mitra

## 1. Architectural Overview
Rythu Mitra's client is engineered as a modern Single Page Application (SPA) using **React 18** and **Vite**. It follows strict React core principles:
- **Declarative UI**: Component rendering is a pure function of state and props.
- **Unidirectional Data Flow**: State is lifted to parent containers (`App.jsx`) where shared, and passed down as immutable props.
- **Component Modularity**: High cohesion and loose coupling between feature modules.
- **Hook-Driven Lifecycle**: Modern hooks (`useState`, `useEffect`, `useRef`, `useCallback`) replace legacy class component lifecycles.

---

## 2. Component Hierarchy
```
App (Root State: currentTab, lang, hostInfo)
│
├── Navbar (Header, Brand, Language Toggle [EN/TE], QR Mobile Connect Modal)
│
├── Feature Views (Conditional rendering based on active tab):
│   ├── CropDoctor (Camera Viewfinder, File Upload, AI Diagnosis Card, Speech Synthesis)
│   ├── ChatBot (Bilingual STT Microphone, Speech-to-Text Input, Audio Playback)
│   ├── WeatherCard (Open-Meteo Integration, 5-Day Outlook, Spraying Advisories)
│   ├── MandiPrices (APMC Regional Market Rates, Search, Filter, Price Trends)
│   └── ExpoDemoTray (1-Click Curated Presets for Demonstration to Judges)
│
├── MobileBottomNav (Ergonomic thumb-accessible navigation bar on viewports < 768px)
└── Footer (Project metadata and attribution)
```

---

## 3. State Management Best Practices
1. **Lifting State Up**:
   The active language (`lang`: `'en' | 'te'`) and active navigation tab (`currentTab`) live at the top-level `App` component so all child components react synchronously when toggled.
2. **Audio & Media Stream Lifecycle (`useRef`)**:
   Camera streams (`navigator.mediaDevices.getUserMedia`) and speech synthesis instances are retained in React refs (`streamRef`, `synthRef`) rather than state to avoid unnecessary re-renders. Every stream track is explicitly stopped on unmount to release hardware locks.
3. **Optimistic UI & Clean Async Operations**:
   API calls use `async/await` wrapped in standard `try/catch` blocks with explicit loading states (`loading`, `analyzing`) to give clear visual feedback.

---

## 4. Build Pipeline with Vite
Vite is selected as the build tool for standard development and production bundling:
- **Rollup-Based Production Build**: Tree-shakes unused dependencies, generates minified CSS and JS bundles, and splits chunks for optimal mobile caching.
- **Zero-Latency HMR (Hot Module Replacement)**: During local development, Vite serves native ES modules for instantaneous component updates.
- **Proxy Configuration**: `vite.config.js` routes all `/api/*` requests to the Node.js backend on `http://localhost:3000`.
