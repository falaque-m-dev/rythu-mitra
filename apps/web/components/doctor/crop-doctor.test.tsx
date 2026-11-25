import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/components/providers/locale-provider";
import { CropDoctor } from "./crop-doctor";

vi.mock("@/lib/api", () => ({
  ApiError: class ApiError extends Error {},
  diagnose: vi.fn().mockResolvedValue({
    success: true,
    mode: "live",
    diagnosis: {
      crop: "Tomato",
      disease: "Early blight",
      severity: "Moderate",
      symptoms: "Brown spots on lower leaves.",
      organic_cure: "Apply neem oil.",
      chemical_cure: "Use a copper-based fungicide.",
      prevention: "Rotate crops."
    }
  }),
  synthesizeSpeech: vi.fn().mockResolvedValue(new Blob(["voice"], { type: "audio/wav" }))
}));

vi.mock("@/components/aceternity/text-generate-effect", () => ({
  TextGenerateEffect: ({ text }: { text: string }) => <span>{text}</span>
}));

vi.mock("@/components/magic/blur-fade", () => ({
  BlurFade: ({ children }: { children: ReactNode }) => <div>{children}</div>
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), warning: vi.fn() }
}));

const startMock = vi.fn();
const decodeMock = vi.fn().mockResolvedValue({ duration: 1 });
const resumeMock = vi.fn().mockResolvedValue(undefined);

class MockAudioContext {
  state = "running";
  destination = {};
  decodeAudioData = decodeMock;
  resume = resumeMock;
  close = vi.fn().mockResolvedValue(undefined);
  createBufferSource = vi.fn(() => ({
    buffer: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
    stop: vi.fn(),
    start: startMock,
    onended: null
  }));
}

afterEach(() => {
  startMock.mockClear();
  decodeMock.mockClear();
  resumeMock.mockClear();
  vi.unstubAllGlobals();
});

describe("CropDoctor", () => {
  it("automatically plays natural generated audio after a scan", async () => {
    const { synthesizeSpeech } = await import("@/lib/api");
    vi.stubGlobal("AudioContext", MockAudioContext);

    const user = userEvent.setup();
    const { container } = render(
      <LocaleProvider>
        <CropDoctor />
      </LocaleProvider>
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, new File(["leaf"], "leaf.png", { type: "image/png" }));

    expect(await screen.findByText("Early blight")).toBeInTheDocument();
    await waitFor(() => {
      expect(synthesizeSpeech).toHaveBeenCalledWith(
        expect.stringContaining("Tomato"),
        "en"
      );
    });
    await waitFor(() => {
      expect(startMock).toHaveBeenCalledTimes(1);
    });
    expect(decodeMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: /stop audio/i })).toBeInTheDocument();
  });
});
