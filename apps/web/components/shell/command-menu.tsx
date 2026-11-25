"use client";

import { useRouter } from "next/navigation";
import { Check, Globe, Moon, Sun, SunMoon } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from "@/components/ui/dialog";
import { useLocale, type Locale } from "@/components/providers/locale-provider";
import { useTheme, type Theme } from "@/components/providers/theme-provider";
import { navItems } from "@/lib/nav";

interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandMenu({ open, onOpenChange }: CommandMenuProps) {
  const router = useRouter();
  const { locale, setLocale, t } = useLocale();
  const { theme, setTheme } = useTheme();

  const run = (action: () => void) => {
    action();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0">
        <DialogTitle className="sr-only">{t("actions.command")}</DialogTitle>
        <DialogDescription className="sr-only">
          Navigate the application and change preferences.
        </DialogDescription>
        <Command loop>
          <CommandInput placeholder={`${t("actions.command")}…`} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Navigate">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.href}
                    value={`${t(item.labelKey)} ${item.href}`}
                    onSelect={() => run(() => router.push(item.href))}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span>{t(item.labelKey)}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading={t("actions.language")}>
              {(
                [
                  { value: "en", label: "English" },
                  { value: "te", label: "తెలుగు" }
                ] as { value: Locale; label: string }[]
              ).map((option) => (
                <CommandItem
                  key={option.value}
                  value={`language ${option.label}`}
                  onSelect={() => run(() => setLocale(option.value))}
                >
                  <Globe className="h-4 w-4" aria-hidden="true" />
                  <span>{option.label}</span>
                  {locale === option.value ? (
                    <Check className="ml-auto h-4 w-4" aria-hidden="true" />
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading={t("actions.theme")}>
              {(
                [
                  { value: "light", label: "Light", icon: Sun },
                  { value: "dark", label: "Dark", icon: Moon },
                  { value: "system", label: "System", icon: SunMoon }
                ] as { value: Theme; label: string; icon: typeof Sun }[]
              ).map((option) => {
                const Icon = option.icon;
                return (
                  <CommandItem
                    key={option.value}
                    value={`theme ${option.label}`}
                    onSelect={() => run(() => setTheme(option.value))}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span>{option.label}</span>
                    {theme === option.value ? (
                      <Check className="ml-auto h-4 w-4" aria-hidden="true" />
                    ) : null}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Shortcuts">
              <CommandItem value="shortcut command menu" disabled>
                <span>Open command menu</span>
                <CommandShortcut>⌘K</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
