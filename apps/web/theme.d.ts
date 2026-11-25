export interface ThemeNavItem {
  href: string;
  labelKey: string;
  icon: string;
}

export interface ThemeQuickAccessItem extends ThemeNavItem {
  tone: "green" | "blue" | "amber" | "violet";
}

export interface ThemeCrop {
  id: string;
  name: string;
  nameTe: string;
  image: string;
  tag: string;
  description: string;
  tip: string;
}

export interface ThemeAdvice {
  id: string;
  title: string;
  titleTe: string;
  excerpt: string;
  excerptTe: string;
  image: string;
  category: string;
  readTime: string;
  author: string;
}

export interface ThemeRegion {
  name: string;
  state: "Telangana";
  stateTe: string;
  lat: number;
  lon: number;
}

export interface ThemeConfig {
  brand: {
    name: string;
    shortName: string;
    tagline: string;
    promise: string;
    description: string;
  };
  colors: Record<
    | "primary"
    | "primaryDark"
    | "primaryDeep"
    | "primarySoft"
    | "primaryMuted"
    | "leaf"
    | "leafSoft"
    | "accent"
    | "accentSoft"
    | "accentDeep"
    | "sky"
    | "skySoft"
    | "rain"
    | "rainSoft"
    | "violet"
    | "violetSoft"
    | "danger"
    | "dangerSoft"
    | "warning"
    | "warningSoft"
    | "ink"
    | "inkSoft"
    | "muted"
    | "line"
    | "surface"
    | "card"
    | "cream"
    | "white",
    string
  >;
  gradients: Record<"hero" | "heroSoft" | "market" | "weather" | "advice" | "ai", string>;
  radius: Record<"sm" | "md" | "lg" | "xl" | "pill", string>;
  shadows: Record<"card" | "soft" | "float", string>;
  images: {
    hero: string;
    field: string;
    farmerPhone: string;
    market: string;
    advice: string;
    crops: Record<
      "wheat" | "rice" | "maize" | "cotton" | "tomato" | "chilli" | "turmeric",
      string
    >;
  };
  nav: ThemeNavItem[];
  quickAccess: ThemeQuickAccessItem[];
  crops: ThemeCrop[];
  weatherRegions: ThemeRegion[];
  assistant: {
    title: string;
    subtitle: string;
    greeting: string;
    suggestions: string[];
  };
  advice: ThemeAdvice[];
}

export const theme: ThemeConfig;
export default theme;
