import type { Metadata } from "next";
import { HomeDashboard } from "@/components/home/home-dashboard";

export const metadata: Metadata = {
  title: "Smart Farming Home"
};

export default function HomePage() {
  return <HomeDashboard />;
}
