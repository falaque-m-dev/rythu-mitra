import type { Metadata, Viewport } from "next";
import { cookies, headers } from "next/headers";
import { JetBrains_Mono, Noto_Sans_Telugu, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { LocaleProvider } from "@/components/providers/locale-provider";
import { AppShell } from "@/components/shell/app-shell";
import { Toaster } from "@/components/ui/sonner";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap"
});

const telugu = Noto_Sans_Telugu({
  subsets: ["telugu"],
  variable: "--font-telugu",
  display: "swap"
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap"
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3100";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Rythu Mitra",
    template: "%s · Rythu Mitra"
  },
  description:
    "AI agricultural companion for farmers in Telangana. Diagnose crop disease, ask agronomy questions, and check weather and mandi prices.",
  applicationName: "Rythu Mitra",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Rythu Mitra",
    title: "Rythu Mitra",
    description:
      "AI agricultural companion for farmers in Telangana.",
    locale: "en_IN",
    url: siteUrl
  },
  twitter: {
    card: "summary",
    title: "Rythu Mitra",
    description:
      "AI agricultural companion for farmers in Telangana."
  }
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F8F2" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1412" }
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

const themeScript = `(function(){try{var m=document.cookie.match(/(?:^|; )rythu-theme=([^;]*)/);var t=m?decodeURIComponent(m[1]):(localStorage.getItem('rythu-theme')||'light');var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light';}catch(e){}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [requestHeaders, cookieStore] = await Promise.all([headers(), cookies()]);
  const nonce = requestHeaders.get("x-nonce") ?? undefined;
  const localeValue = cookieStore.get("rythu-locale")?.value;
  const initialLocale = localeValue === "te" ? "te" : "en";
  const themeValue = cookieStore.get("rythu-theme")?.value;
  const initialTheme =
    themeValue === "light" || themeValue === "dark" || themeValue === "system"
      ? themeValue
      : "light";

  return (
    <html lang={initialLocale} suppressHydrationWarning>
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${sans.variable} ${telugu.variable} ${mono.variable}`}>
        <ThemeProvider initialTheme={initialTheme}>
          <LocaleProvider initialLocale={initialLocale}>
            <AppShell>{children}</AppShell>
            <Toaster />
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
