import type { Metadata } from "next";
import { Advisor } from "@/components/advisor/advisor";

export const metadata: Metadata = {
  title: "AI Advisor"
};

export default function AdvisorPage() {
  return <Advisor />;
}
