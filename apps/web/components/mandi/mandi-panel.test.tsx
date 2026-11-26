import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { LocaleProvider } from "@/components/providers/locale-provider";
import { getMandiPrices } from "@/lib/api";
import { MandiPanel } from "./mandi-panel";

vi.mock("@/lib/api", () => ({
  ApiError: class ApiError extends Error {},
  getMandiPrices: vi.fn().mockResolvedValue({
    updated_at: "Today, 06:00 AM IST",
    mode: "curated",
    source: "curated-dataset",
    live: false,
    commodities: [
      {
        id: "chilli_teja",
        name_en: "Red Chilli (Teja)",
        name_te: "ఎర్ర మిరప (తేజ)",
        variety: "Teja",
        market_en: "Guntur Mirchi Yard, AP",
        market_te: "గుంటూరు మిర్చి యార్డ్",
        min_price: 18500,
        max_price: 22400,
        modal_price: 20800,
        unit: "INR / Kg",
        change: "+1450",
        trend: "up"
      }
    ]
  })
}));

vi.mock("@number-flow/react", () => ({
  default: ({ value }: { value: number }) => <span>{value}</span>
}));

vi.mock("@/components/magic/blur-fade", () => ({
  BlurFade: ({ children }: { children: ReactNode }) => <div>{children}</div>
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn() }
}));

describe("MandiPanel", () => {
  it("labels curated rates instead of presenting them as live", async () => {
    render(
      <LocaleProvider>
        <MandiPanel />
      </LocaleProvider>
    );

    expect(await screen.findByText(/Curated reference rates/)).toBeInTheDocument();
    expect(screen.getByText(/Confirm with your local mandi/)).toBeInTheDocument();
    expect(await screen.findByText("Red Chilli (Teja)")).toBeInTheDocument();
  });

  it("does not show an error toast when prices cannot be loaded", async () => {
    vi.mocked(getMandiPrices).mockRejectedValueOnce(new Error("government api unavailable"));

    render(
      <LocaleProvider>
        <MandiPanel />
      </LocaleProvider>
    );

    expect(await screen.findByText("Could not load prices.")).toBeInTheDocument();
    expect(toast.error).not.toHaveBeenCalled();
  });
});
