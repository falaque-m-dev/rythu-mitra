import type { Metadata } from "next";
import { AdviceBoard } from "@/components/advice/advice-board";

export const metadata: Metadata = {
  title: "Expert Advice"
};

export default function AdvicePage() {
  return <AdviceBoard />;
}
