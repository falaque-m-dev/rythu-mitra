"use client";

import * as React from "react";
import { readCookie, writeCookie } from "@/lib/preferences";

export type Locale = "en" | "te";

type Dictionary = Record<string, string>;

const en: Dictionary = {
  "app.name": "Rythu Mitra",
  "app.tagline": "Smart farming, better tomorrow",
  "app.promise": "Grow more, earn more",
  "nav.home": "Home",
  "nav.doctor": "Crop Doctor",
  "nav.advisor": "AI Advisor",
  "nav.weather": "Weather",
  "nav.mandi": "Market",
  "actions.menu": "Menu",
  "actions.language": "Language",
  "actions.theme": "Theme",
  "actions.command": "Command menu",
  "actions.close": "Close",
  "actions.retry": "Try again",
  "common.loading": "Loading",
  "common.unavailable": "Not available on this deployment",
  "status.live": "Live AI",
  "status.degraded": "Local knowledge",
  "status.degradedHint":
    "Live AI is unavailable right now. Results below come from the local knowledge base, not a live model.",
  "home.hello": "Hello, farmer",
  "home.subtitle": "Smart solutions for smart farmers",
  "home.lead": "Your crops, weather and market — all in one place.",
  "home.scanNow": "Scan a crop",
  "home.askAi": "Ask AI",
  "home.today": "Today",
  "home.popularCrops": "Popular crops",
  "home.quickAccess": "Quick access",
  "home.expertAdvice": "Expert advice",
  "home.marketPrices": "Market prices",
  "home.todaysWeather": "Today's weather",
  "home.viewAll": "View all",
  "home.quick.scan": "Crop Doctor",
  "home.quick.weather": "Weather",
  "home.quick.mandi": "Market prices",
  "home.quick.advice": "Expert advice",
  "home.humidity": "Humidity",
  "home.wind": "Wind",
  "home.rain": "Rain",
  "home.feelsLike": "Feels like",
  "home.farmTip": "Farm tip",
  "home.weatherUnavailable": "Weather is unavailable right now.",
  "home.marketUnavailable": "Market prices are unavailable right now.",
  "assistant.open": "Open AI Advisor",
  "assistant.openHint": "Chat with the AI farm advisor without leaving this page.",
  "doctor.title": "Crop Doctor",
  "doctor.desc":
    "Photograph an affected leaf or upload an image to identify the disease and get treatment guidance.",
  "doctor.upload": "Upload image",
  "doctor.camera": "Open camera",
  "doctor.capture": "Capture and analyze",
  "doctor.cancel": "Cancel",
  "doctor.analyzing": "Analyzing leaf",
  "doctor.analyzingHint": "This can take a few seconds.",
  "doctor.requestFailed": "Request failed",
  "doctor.symptoms": "Symptoms",
  "doctor.organic": "Organic remedy",
  "doctor.chemical": "Chemical treatment",
  "doctor.prevention": "Prevention",
  "doctor.severity": "Severity",
  "doctor.listen": "Read aloud",
  "doctor.preparingAudio": "Preparing natural voice",
  "doctor.voiceUnavailable": "Natural voice is not available right now.",
  "doctor.audioFailed": "Could not play the audio.",
  "doctor.stop": "Stop audio",
  "doctor.reset": "New scan",
  "doctor.empty": "No image analyzed yet",
  "doctor.emptyHint": "Take a photo or upload a leaf image to begin.",
  "doctor.imageRequired": "Choose a leaf image first.",
  "doctor.fileReadFailed": "Could not read the selected file.",
  "doctor.cameraUnsupported": "Camera is not supported here. Upload an image instead.",
  "doctor.cameraDenied": "Camera access was denied. Upload an image instead.",
  "doctor.cameraNotReady": "The camera is not ready yet.",
  "doctor.captureFailed": "Could not capture the image.",
  "doctor.imageAlt": "Analyzed leaf",
  "advisor.title": "AI Advisor",
  "advisor.desc": "Ask about crops, fertilizer, pests, or field management.",
  "advisor.placeholder": "Type your question",
  "advisor.listen": "Listen",
  "advisor.stopListening": "Stop listening",
  "advisor.send": "Send",
  "advisor.thinking": "Consulting agronomy guidance",
  "advisor.empty": "No messages yet",
  "advisor.emptyHint": "Ask a question to start the conversation.",
  "advisor.clear": "Clear conversation",
  "advisor.subtitle": "Your farm expert, one tap away.",
  "advisor.greeting":
    "Namaste! I’m your farm advisor. Ask me about crops, pests, fertilizer or field work.",
  "advisor.suggestion1": "Which crop suits this season?",
  "advisor.suggestion2": "How much urea for paddy?",
  "advisor.suggestion3": "How do I control pests in chilli?",
  "advisor.failed": "Could not get a reply.",
  "weather.title": "Weather",
  "weather.desc": "Live conditions and an actionable field advisory.",
  "weather.location": "Region",
  "weather.temp": "Temperature",
  "weather.feels": "Feels like",
  "weather.humidity": "Humidity",
  "weather.rain": "Rain chance",
  "weather.wind": "Wind",
  "weather.advisory": "Field advisory",
  "weather.week": "7-day forecast",
  "weather.today": "Today",
  "weather.condition": "Condition",
  "weather.highLow": "High / Low",
  "weather.precipitation": "Rain chance",
  "mandi.title": "Mandi Prices",
  "mandi.desc": "Current market rates for regional commodities.",
  "mandi.search": "Search commodity or market",
  "mandi.updated": "Updated",
  "mandi.curated": "Curated reference rates",
  "mandi.curatedHint": "Confirm with your local mandi before selling.",
  "mandi.modal": "Modal price",
  "mandi.range": "Range",
  "mandi.empty": "No commodities match your search.",
  "mandi.all": "All",
  "mandi.cereals": "Cereals",
  "mandi.spices": "Spices",
  "mandi.vegetables": "Vegetables",
  "mandi.perKg": "per kg",
  "advice.title": "Expert Advice",
  "advice.desc": "Practical, field-tested guidance for healthier crops and better returns.",
  "advice.readMore": "Read more",
  "advice.all": "All articles",
  "advice.back": "Back to advice",
  "advice.by": "By",
  "footer.note": "Built for farmers in Telangana."
};

const te: Dictionary = {
  "app.name": "రైతు మిత్ర",
  "app.tagline": "స్మార్ట్ వ్యవసాయం, మెరుగైన రేపు",
  "app.promise": "ఎక్కువ పండించండి, ఎక్కువ సంపాదించండి",
  "nav.home": "హోమ్",
  "nav.doctor": "పంట డాక్టర్",
  "nav.advisor": "AI సలహాదారు",
  "nav.weather": "వాతావరణం",
  "nav.mandi": "మార్కెట్",
  "actions.menu": "మెనూ",
  "actions.language": "భాష",
  "actions.theme": "థీమ్",
  "actions.command": "కమాండ్ మెనూ",
  "actions.close": "మూసివేయండి",
  "actions.retry": "మళ్లీ ప్రయత్నించండి",
  "common.loading": "లోడ్ అవుతోంది",
  "common.unavailable": "ఈ డిప్లాయ్‌మెంట్‌లో అందుబాటులో లేదు",
  "status.live": "ప్రత్యక్ష AI",
  "status.degraded": "స్థానిక సమాచారం",
  "status.degradedHint":
    "ప్రత్యక్ష AI ప్రస్తుతం అందుబాటులో లేదు. క్రింది ఫలితాలు స్థానిక సమాచారం నుండి వచ్చాయి, ప్రత్యక్ష మోడల్ నుండి కాదు.",
  "home.hello": "నమస్కారం, రైతు",
  "home.subtitle": "స్మార్ట్ రైతులకు స్మార్ట్ పరిష్కారాలు",
  "home.lead": "మీ పంటలు, వాతావరణం మరియు మార్కెట్ — అన్నీ ఒకే చోట.",
  "home.scanNow": "పంటను స్కాన్ చేయండి",
  "home.askAi": "AIని అడగండి",
  "home.today": "నేడు",
  "home.popularCrops": "ప్రసిద్ధ పంటలు",
  "home.quickAccess": "త్వరిత ప్రాప్యత",
  "home.expertAdvice": "నిపుణుల సలహాలు",
  "home.marketPrices": "మార్కెట్ ధరలు",
  "home.todaysWeather": "నేటి వాతావరణం",
  "home.viewAll": "అన్నీ చూడండి",
  "home.quick.scan": "పంట డాక్టర్",
  "home.quick.weather": "వాతావరణం",
  "home.quick.mandi": "మార్కెట్ ధరలు",
  "home.quick.advice": "నిపుణుల సలహాలు",
  "home.humidity": "తేమ",
  "home.wind": "గాలి",
  "home.rain": "వర్షం",
  "home.feelsLike": "అనుభూతి",
  "home.farmTip": "వ్యవసాయ చిట్కా",
  "home.weatherUnavailable": "వాతావరణం ఇప్పుడు అందుబాటులో లేదు.",
  "home.marketUnavailable": "మార్కెట్ ధరలు ఇప్పుడు అందుబాటులో లేవు.",
  "assistant.open": "AI సలహాదారుని తెరవండి",
  "assistant.openHint": "ఈ పేజీని వదలకుండా AI వ్యవసాయ సలహాదారుతో చాట్ చేయండి.",
  "doctor.title": "పంట డాక్టర్",
  "doctor.desc": "తెగులు సోకిన ఆకు ఫోటో తీయండి లేదా అప్‌లోడ్ చేయండి.",
  "doctor.upload": "ఫోటో అప్‌లోడ్",
  "doctor.camera": "కెమెరా తెరవండి",
  "doctor.capture": "తీసి విశ్లేషించండి",
  "doctor.cancel": "రద్దు",
  "doctor.analyzing": "ఆకును విశ్లేషిస్తోంది",
  "doctor.analyzingHint": "ఇది కొన్ని సెకన్లు పట్టవచ్చు.",
  "doctor.requestFailed": "అభ్యర్థన విఫలమైంది",
  "doctor.symptoms": "లక్షణాలు",
  "doctor.organic": "సేంద్రీయ నివారణ",
  "doctor.chemical": "రసాయన చికిత్స",
  "doctor.prevention": "ముందస్తు జాగ్రత్తలు",
  "doctor.severity": "తీవ్రత",
  "doctor.listen": "వినండి",
  "doctor.preparingAudio": "సహజ స్వరం సిద్ధమవుతోంది",
  "doctor.voiceUnavailable": "సహజ స్వరం ఇప్పుడు అందుబాటులో లేదు.",
  "doctor.audioFailed": "ఆడియోను ప్లే చేయలేకపోయాము.",
  "doctor.stop": "ఆపండి",
  "doctor.reset": "కొత్త స్కాన్",
  "doctor.empty": "ఇంకా చిత్రం విశ్లేషించలేదు",
  "doctor.emptyHint": "ప్రారంభించడానికి ఫోటో తీయండి లేదా అప్‌లోడ్ చేయండి.",
  "doctor.imageRequired": "ముందుగా ఆకు చిత్రాన్ని ఎంచుకోండి.",
  "doctor.fileReadFailed": "ఎంచుకున్న ఫైల్‌ను చదవలేకపోయాము.",
  "doctor.cameraUnsupported": "ఇక్కడ కెమెరా అందుబాటులో లేదు. ఫోటో అప్‌లోడ్ చేయండి.",
  "doctor.cameraDenied": "కెమెరా అనుమతి నిరాకరించబడింది. ఫోటో అప్‌లోడ్ చేయండి.",
  "doctor.cameraNotReady": "కెమెరా ఇంకా సిద్ధంగా లేదు.",
  "doctor.captureFailed": "చిత్రాన్ని తీయలేకపోయాము.",
  "doctor.imageAlt": "విశ్లేషించిన ఆకు",
  "advisor.title": "AI సలహాదారు",
  "advisor.desc": "పంటలు, ఎరువులు, తెగుళ్ల గురించి అడగండి.",
  "advisor.placeholder": "మీ ప్రశ్నను టైప్ చేయండి",
  "advisor.listen": "వింటిని",
  "advisor.stopListening": "వింటువాడిని ఆపండి",
  "advisor.send": "పంపండి",
  "advisor.thinking": "వ్యవసాయ సమాచారం చూస్తోంది",
  "advisor.empty": "ఇంకా సందేశాలు లేవు",
  "advisor.emptyHint": "సంభాషణ ప్రారంభించడానికి ప్రశ్న అడగండి.",
  "advisor.clear": "సంభాషణను క్లియర్ చేయండి",
  "advisor.subtitle": "మీ వ్యవసాయ నిపుణుడు, ఒక్క తట్టులో.",
  "advisor.greeting":
    "నమస్కారం! నేను మీ వ్యవసాయ సలహాదారుడిని. పంటలు, తెగుళ్లు, ఎరువులు లేదా పొలం పనుల గురించి అడగండి.",
  "advisor.suggestion1": "ఈ సీజన్‌కు ఏ పంట సరిపోతుంది?",
  "advisor.suggestion2": "వరికి ఎంత యూరియా వేయాలి?",
  "advisor.suggestion3": "మిరపలో తెగుళ్లను ఎలా నియంత్రించాలి?",
  "advisor.failed": "సమాధానం పొందలేకపోయాము.",
  "weather.title": "వాతావరణం",
  "weather.desc": "ప్రత్యక్ష పరిస్థితులు మరియు వ్యవసాయ సూచన.",
  "weather.location": "ప్రాంతం",
  "weather.temp": "ఉష్ణోగ్రత",
  "weather.feels": "అనుభూతి",
  "weather.humidity": "తేమ",
  "weather.rain": "వర్ష సూచన",
  "weather.wind": "గాలి",
  "weather.advisory": "వ్యవసాయ సూచన",
  "weather.week": "7 రోజుల సూచన",
  "weather.today": "నేడు",
  "weather.condition": "పరిస్థితి",
  "weather.highLow": "గరిష్ఠ / కనిష్ఠ",
  "weather.precipitation": "వర్ష సూచన",
  "mandi.title": "మార్కెట్ ధరలు",
  "mandi.desc": "ప్రాంతీయ పంటల ప్రస్తుత మార్కెట్ ధరలు.",
  "mandi.search": "పంట లేదా మార్కెట్ వెతకండి",
  "mandi.updated": "నవీకరించబడింది",
  "mandi.curated": "సూచనాత్మక ధరలు",
  "mandi.curatedHint": "అమ్మకానికి ముందు మీ స్థానిక మార్కెట్‌లో నిర్ధారించుకోండి.",
  "mandi.modal": "సగటు ధర",
  "mandi.range": "పరిధి",
  "mandi.empty": "మీ శోధనకు సరిపోయే పంటలు లేవు.",
  "mandi.all": "అన్నీ",
  "mandi.cereals": "ధాన్యాలు",
  "mandi.spices": "మసాలాలు",
  "mandi.vegetables": "కూరగాయలు",
  "mandi.perKg": "ప్రతి కిలోకు",
  "advice.title": "నిపుణుల సలహాలు",
  "advice.desc": "ఆరోగ్యకరమైన పంటలు మరియు మంచి ఆదాయానికి ఆచరణాత్మక మార్గదర్శనం.",
  "advice.readMore": "మరింత చదవండి",
  "advice.all": "అన్ని వ్యాసాలు",
  "advice.back": "సలహాలకు తిరిగి వెళ్లండి",
  "advice.by": "రచయిత",
  "footer.note": "ఆంధ్రప్రదేశ్ మరియు తెలంగాణ రైతుల కోసం."
};

const dictionaries: Record<Locale, Dictionary> = { en, te };

const LOCALE_KEY = "rythu-locale";
const localeListeners = new Set<() => void>();

function readStoredLocale(): Locale {
  if (typeof window === "undefined") return "en";
  try {
    const stored = window.localStorage.getItem(LOCALE_KEY);
    if (stored === "en" || stored === "te") {
      return stored;
    }
  } catch {
    // localStorage can be unavailable in private or restricted contexts.
  }
  const cookie = readCookie(LOCALE_KEY);
  if (cookie === "en" || cookie === "te") {
    return cookie;
  }
  return "en";
}

function subscribeLocale(listener: () => void) {
  localeListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    localeListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function writeLocale(locale: Locale) {
  try {
    window.localStorage.setItem(LOCALE_KEY, locale);
  } catch {
    // Persisting the preference is best-effort; the UI still updates in memory.
  }
  writeCookie(LOCALE_KEY, locale);
  localeListeners.forEach((listener) => listener());
}

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const LocaleContext = React.createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  children,
  initialLocale = "en"
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const getServerSnapshot = React.useCallback(() => initialLocale, [initialLocale]);
  const locale = React.useSyncExternalStore<Locale>(
    subscribeLocale,
    readStoredLocale,
    getServerSnapshot
  );

  React.useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = React.useCallback((next: Locale) => writeLocale(next), []);

  const value = React.useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key: string) => dictionaries[locale][key] ?? dictionaries.en[key] ?? key
    }),
    [locale, setLocale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = React.useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return context;
}
