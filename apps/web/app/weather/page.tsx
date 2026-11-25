import type { Metadata } from "next";
import { WeatherPanel } from "@/components/weather/weather-panel";

export const metadata: Metadata = {
  title: "Weather"
};

export default function WeatherPage() {
  return <WeatherPanel />;
}
