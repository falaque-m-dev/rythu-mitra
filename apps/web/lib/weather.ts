import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudHail,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
  type LucideIcon
} from "lucide-react";

export type WeatherTone = "sunny" | "cloudy" | "rain" | "storm" | "snow" | "fog";

export interface WeatherVisual {
  key: WeatherTone;
  label: string;
  labelTe: string;
  icon: LucideIcon;
  gradient: string;
  soft: string;
  ink: string;
}

const visuals: Record<WeatherTone, WeatherVisual> = {
  sunny: {
    key: "sunny",
    label: "Sunny",
    labelTe: "ఎండ",
    icon: Sun,
    gradient: "linear-gradient(135deg, #FFF4CC 0%, #FFF9E8 55%, #FFFFFF 100%)",
    soft: "#FFF5D9",
    ink: "#8A5A00"
  },
  cloudy: {
    key: "cloudy",
    label: "Cloudy",
    labelTe: "మేఘావృతం",
    icon: CloudSun,
    gradient: "linear-gradient(135deg, #EAF3F8 0%, #F7FAFC 60%, #FFFFFF 100%)",
    soft: "#EDF4F7",
    ink: "#365768"
  },
  rain: {
    key: "rain",
    label: "Rain",
    labelTe: "వర్షం",
    icon: CloudRain,
    gradient: "linear-gradient(135deg, #E7F2FF 0%, #F5FAFF 60%, #FFFFFF 100%)",
    soft: "#EEF5FF",
    ink: "#245B8A"
  },
  storm: {
    key: "storm",
    label: "Thunderstorm",
    labelTe: "ఉరుములతో వర్షం",
    icon: CloudLightning,
    gradient: "linear-gradient(135deg, #EEEBFF 0%, #F7F5FF 60%, #FFFFFF 100%)",
    soft: "#F0EDFF",
    ink: "#4B3E91"
  },
  snow: {
    key: "snow",
    label: "Snow",
    labelTe: "మంచు",
    icon: CloudSnow,
    gradient: "linear-gradient(135deg, #EFF9FF 0%, #F8FDFF 60%, #FFFFFF 100%)",
    soft: "#EFF9FF",
    ink: "#2E647D"
  },
  fog: {
    key: "fog",
    label: "Fog",
    labelTe: "పొగమంచు",
    icon: CloudFog,
    gradient: "linear-gradient(135deg, #F1F4F2 0%, #F9FBFA 60%, #FFFFFF 100%)",
    soft: "#F0F3F1",
    ink: "#4E6056"
  }
};

export function getWeatherVisual(code: number | undefined, isDay = true): WeatherVisual {
  if (code === undefined || Number.isNaN(code)) {
    return isDay ? visuals.sunny : { ...visuals.sunny, icon: Moon };
  }
  if (code === 0) {
    return isDay ? visuals.sunny : { ...visuals.sunny, icon: Moon, label: "Clear night", labelTe: "స్పష్టమైన రాత్రి" };
  }
  if (code === 1 || code === 2) return visuals.cloudy;
  if (code === 3) return { ...visuals.cloudy, icon: Cloud };
  if (code === 45 || code === 48) return visuals.fog;
  if ([51, 53, 55, 56, 57].includes(code)) {
    return { ...visuals.rain, icon: CloudDrizzle, label: "Drizzle", labelTe: "చిరుజల్లు" };
  }
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return visuals.rain;
  if ([71, 73, 75, 77, 85, 86].includes(code)) return visuals.snow;
  if ([96, 99].includes(code)) {
    return { ...visuals.storm, icon: CloudHail, label: "Thunderstorm with hail", labelTe: "వడగళ్లతో ఉరుముల వర్షం" };
  }
  if (code === 95) return visuals.storm;
  return visuals.cloudy;
}

export const weatherWeekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const weatherWeekdaysTe = ["ఆది", "సోమ", "మంగళ", "బుధ", "గురు", "శుక్ర", "శని"];

export function formatWeatherDay(date: string, locale: string, index: number) {
  if (index === 0) return locale === "te" ? "నేడు" : "Today";
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return locale === "te" ? weatherWeekdaysTe[parsed.getDay()] : weatherWeekdays[parsed.getDay()];
}
