/**
 * Rythu Mitra design system.
 *
 * Single source of truth for the AgriGrow-inspired visual language.
 * Components should read colours, images, radii, content and navigation
 * from this file instead of hard-coding values.
 */

export const theme = {
  brand: {
    name: "Rythu Mitra",
    shortName: "Rythu",
    tagline: "Smart Farming, Better Tomorrow",
    promise: "Grow More, Earn More",
    description:
      "AI-powered crop care, live weather and mandi prices for every farmer."
  },

  colors: {
    primary: "#1F7A3D",
    primaryDark: "#0E5A2A",
    primaryDeep: "#083D1C",
    primarySoft: "#EAF6EC",
    primaryMuted: "#CFEBD6",
    leaf: "#6DBE45",
    leafSoft: "#F1FAEA",
    accent: "#F5B82E",
    accentSoft: "#FFF5D9",
    accentDeep: "#8A5A00",
    sky: "#3E9DDB",
    skySoft: "#EAF6FF",
    rain: "#4A90D9",
    rainSoft: "#EEF5FF",
    violet: "#7C6BD6",
    violetSoft: "#F2EFFF",
    danger: "#D9534F",
    dangerSoft: "#FDECEC",
    warning: "#D99A00",
    warningSoft: "#FFF8E1",
    ink: "#14281A",
    inkSoft: "#3E5546",
    muted: "#748577",
    line: "#E1EADF",
    surface: "#F5F8F2",
    card: "#FFFFFF",
    cream: "#FBFCF8",
    white: "#FFFFFF"
  },

  gradients: {
    hero: "linear-gradient(135deg, #083D1C 0%, #0E5A2A 45%, #1F7A3D 100%)",
    heroSoft: "linear-gradient(135deg, #EAF6EC 0%, #F8FCF3 70%, #FFF9E6 100%)",
    market: "linear-gradient(135deg, #FFF9E8 0%, #FFFFFF 70%)",
    weather: "linear-gradient(135deg, #EAF6FF 0%, #F8FCFF 70%)",
    advice: "linear-gradient(135deg, #F2EFFF 0%, #FFFFFF 70%)",
    ai: "linear-gradient(135deg, #0E5A2A 0%, #1F7A3D 55%, #6DBE45 100%)"
  },

  radius: {
    sm: "12px",
    md: "16px",
    lg: "22px",
    xl: "28px",
    pill: "999px"
  },

  shadows: {
    card: "0 14px 34px -26px rgba(8, 61, 28, 0.42)",
    soft: "0 8px 22px -18px rgba(8, 61, 28, 0.35)",
    float: "0 18px 42px -16px rgba(8, 61, 28, 0.55)"
  },

  images: {
    hero: "/images/hero-farmer.jpg",
    field: "/images/field.jpg",
    farmerPhone: "/images/farmer-phone.jpg",
    market: "/images/market.jpg",
    advice: "/images/advice-crop.jpg",
    crops: {
      wheat: "/images/crop-wheat.jpg",
      rice: "/images/crop-rice.jpg",
      maize: "/images/crop-maize.jpg",
      cotton: "/images/crop-cotton.jpg",
      tomato: "/images/crop-tomato.jpg",
      chilli: "/images/crop-chilli.jpg",
      turmeric: "/images/crop-turmeric.jpg"
    }
  },

  nav: [
    { href: "/", labelKey: "nav.home", icon: "home" },
    { href: "/doctor", labelKey: "nav.doctor", icon: "scan" },
    { href: "/weather", labelKey: "nav.weather", icon: "cloud" },
    { href: "/mandi", labelKey: "nav.mandi", icon: "rupee" }
  ],

  quickAccess: [
    { href: "/doctor", labelKey: "home.quick.scan", icon: "scan", tone: "green" },
    { href: "/weather", labelKey: "home.quick.weather", icon: "cloud", tone: "blue" },
    { href: "/mandi", labelKey: "home.quick.mandi", icon: "rupee", tone: "amber" },
    { href: "/advice", labelKey: "home.quick.advice", icon: "book", tone: "violet" }
  ],

  crops: [
    {
      id: "wheat",
      name: "Wheat",
      nameTe: "గోధుమ",
      image: "/images/crop-wheat.jpg",
      tag: "Rabi",
      description: "High-yield crop suitable for all soil types.",
      tip: "Sow when the temperature stays between 18°C and 25°C."
    },
    {
      id: "rice",
      name: "Rice",
      nameTe: "వరి",
      image: "/images/crop-rice.jpg",
      tag: "Kharif",
      description: "The staple crop of Telangana.",
      tip: "Maintain 2–3 cm of standing water during tillering."
    },
    {
      id: "maize",
      name: "Maize",
      nameTe: "మొక్కజొన్న",
      image: "/images/crop-maize.jpg",
      tag: "Kharif / Rabi",
      description: "Fast-growing, high-demand feed and food crop.",
      tip: "Avoid waterlogging; maize roots are sensitive to excess water."
    },
    {
      id: "cotton",
      name: "Cotton",
      nameTe: "పత్తి",
      image: "/images/crop-cotton.jpg",
      tag: "Kharif",
      description: "Long-staple cotton for textile and oil markets.",
      tip: "Scout for pink bollworm from square formation onwards."
    },
    {
      id: "chilli",
      name: "Red Chilli",
      nameTe: "ఎర్ర మిరప",
      image: "/images/crop-chilli.jpg",
      tag: "Kharif",
      description: "Guntur's signature crop with strong export demand.",
      tip: "Use drip irrigation to reduce leaf curl and fruit rot."
    },
    {
      id: "tomato",
      name: "Tomato",
      nameTe: "టమాటా",
      image: "/images/crop-tomato.jpg",
      tag: "Year-round",
      description: "High-value horticulture crop for local markets.",
      tip: "Stake plants early to keep fruit off the soil."
    },
    {
      id: "turmeric",
      name: "Turmeric",
      nameTe: "పసుపు",
      image: "/images/crop-turmeric.jpg",
      tag: "Kharif",
      description: "Nizamabad and Salem belt's golden spice.",
      tip: "Provide partial shade during the first 30 days."
    }
  ],

  weatherRegions: [
    { name: "Hyderabad", state: "Telangana", stateTe: "తెలంగాణ", lat: 17.385, lon: 78.4867 },
    { name: "Warangal", state: "Telangana", stateTe: "తెలంగాణ", lat: 17.9674, lon: 79.5889 },
    { name: "Nizamabad", state: "Telangana", stateTe: "తెలంగాణ", lat: 18.672, lon: 78.094 },
    { name: "Karimnagar", state: "Telangana", stateTe: "తెలంగాణ", lat: 18.4392, lon: 79.1286 },
    { name: "Ramagundam", state: "Telangana", stateTe: "తెలంగాణ", lat: 18.7615, lon: 79.4788 },
    { name: "Mancherial", state: "Telangana", stateTe: "తెలంగాణ", lat: 18.8714, lon: 79.4443 },
    { name: "Adilabad", state: "Telangana", stateTe: "తెలంగాణ", lat: 19.67, lon: 78.53 },
    { name: "Nalgonda", state: "Telangana", stateTe: "తెలంగాణ", lat: 17.056, lon: 79.2688 },
    { name: "Suryapet", state: "Telangana", stateTe: "తెలంగాణ", lat: 17.1405, lon: 79.6225 },
    { name: "Mahabubnagar", state: "Telangana", stateTe: "తెలంగాణ", lat: 16.7435, lon: 77.9923 }
  ],

  assistant: {
    title: "AI Advisor",
    subtitle: "Your farm expert, one tap away.",
    greeting:
      "Namaste! I’m your farm advisor. Ask me about crops, pests, fertilizer or field work.",
    suggestions: [
      "Which crop suits this season?",
      "How much urea for paddy?",
      "How do I control pests in chilli?"
    ]
  },

  advice: [
    {
      id: "healthy-crop-growth",
      title: "Top 5 Tips for Healthy Crop Growth",
      titleTe: "ఆరోగ్యకరమైన పంట ఎదుగుదలకు 5 చిట్కాలు",
      excerpt:
        "Simple field practices that improve root health, leaf colour and yield.",
      excerptTe:
        "వేర్ల ఆరోగ్యం, ఆకు రంగు మరియు దిగుబడిని మెరుగుపరిచే సులభమైన పద్ధతులు.",
      image: "/images/advice-crop.jpg",
      category: "Crop Care",
      readTime: "4 min read",
      author: "Rythu Mitra Agronomy Desk"
    },
    {
      id: "soil-testing",
      title: "Why Soil Testing Saves Money",
      titleTe: "మట్టి పరీక్ష ఎందుకు డబ్బు ఆదా చేస్తుంది",
      excerpt:
        "Match fertilizer to your soil instead of guessing. A quick guide.",
      excerptTe:
        "ఊహించకుండా మీ మట్టికి సరిపోయే ఎరువులు ఎంచుకోండి. ఒక చిన్న మార్గదర్శిని.",
      image: "/images/field.jpg",
      category: "Soil Health",
      readTime: "5 min read",
      author: "Rythu Mitra Agronomy Desk"
    },
    {
      id: "pest-scouting",
      title: "Scout Early, Spray Less",
      titleTe: "ముందుగా గుర్తించండి, తక్కువ పిచికారీ చేయండి",
      excerpt:
        "A 10-minute weekly walk can catch pests before they spread.",
      excerptTe:
        "వారానికి 10 నిమిషాల పరిశీలన తెగుళ్లు వ్యాపించకముందే గుర్తించగలదు.",
      image: "/images/farmer-phone.jpg",
      category: "Pest Control",
      readTime: "3 min read",
      author: "Rythu Mitra Agronomy Desk"
    },
    {
      id: "market-timing",
      title: "Get a Better Price at the Mandi",
      titleTe: "మార్కెట్లో మంచి ధర పొందండి",
      excerpt:
        "Grade, dry and time your produce before you reach the yard.",
      excerptTe:
        "యార్డుకు చేరుకునే ముందు మీ పంటను గ్రేడ్ చేయండి, ఆరబెట్టండి, సమయం చూసుకోండి.",
      image: "/images/market.jpg",
      category: "Market",
      readTime: "6 min read",
      author: "Rythu Mitra Market Desk"
    }
  ]
};

export default theme;
