import type { Metadata } from "next";
import { MandiPanel } from "@/components/mandi/mandi-panel";

export const metadata: Metadata = {
  title: "Mandi Prices"
};

export default function MandiPage() {
  return <MandiPanel />;
}
