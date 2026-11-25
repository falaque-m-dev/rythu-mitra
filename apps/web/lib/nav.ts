import type { LucideIcon } from "lucide-react";
import theme from "@/theme";
import { navIconMap } from "@/lib/content";

export interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = theme.nav.map((item) => ({
  href: item.href,
  labelKey: item.labelKey,
  icon: navIconMap[item.icon] ?? navIconMap.home
}));

export const primaryMobileNav = navItems;
