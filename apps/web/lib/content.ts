import {
  BookOpen,
  CloudSun,
  Home,
  IndianRupee,
  ScanLine,
  Sprout,
  Wheat,
  type LucideIcon
} from "lucide-react";
import theme from "@/theme";

export const navIconMap: Record<string, LucideIcon> = {
  home: Home,
  scan: ScanLine,
  cloud: CloudSun,
  rupee: IndianRupee,
  book: BookOpen,
  leaf: Sprout,
  wheat: Wheat
};

export const quickAccessTones: Record<
  "green" | "blue" | "amber" | "violet",
  { bg: string; text: string; ring: string }
> = {
  green: { bg: "bg-primary/10", text: "text-primary", ring: "ring-primary/15" },
  blue: { bg: "bg-sky-500/10", text: "text-sky-600 dark:text-sky-300", ring: "ring-sky-500/15" },
  amber: { bg: "bg-amber-500/15", text: "text-amber-700 dark:text-amber-300", ring: "ring-amber-500/20" },
  violet: { bg: "bg-violet-500/10", text: "text-violet-600 dark:text-violet-300", ring: "ring-violet-500/15" }
};

export function getCropForCommodity(id: string, name: string) {
  const haystack = `${id} ${name}`.toLowerCase();
  if (haystack.includes("wheat")) return theme.crops.find((crop) => crop.id === "wheat");
  if (haystack.includes("paddy") || haystack.includes("rice")) {
    return theme.crops.find((crop) => crop.id === "rice");
  }
  if (haystack.includes("maize") || haystack.includes("corn")) {
    return theme.crops.find((crop) => crop.id === "maize");
  }
  if (haystack.includes("cotton")) return theme.crops.find((crop) => crop.id === "cotton");
  if (haystack.includes("chilli")) return theme.crops.find((crop) => crop.id === "chilli");
  if (haystack.includes("tomato")) return theme.crops.find((crop) => crop.id === "tomato");
  if (haystack.includes("turmeric")) return theme.crops.find((crop) => crop.id === "turmeric");
  return undefined;
}

export function commodityCategory(id: string, name: string) {
  const haystack = `${id} ${name}`.toLowerCase();
  if (["paddy", "wheat", "maize", "rice"].some((key) => haystack.includes(key))) {
    return "cereals";
  }
  if (["turmeric", "chilli"].some((key) => haystack.includes(key))) {
    return "spices";
  }
  return "vegetables";
}

export function localiseCropName(
  crop: { name: string; nameTe: string } | undefined,
  locale: string
) {
  if (!crop) return "";
  return locale === "te" ? crop.nameTe : crop.name;
}
