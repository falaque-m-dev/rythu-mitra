import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/components/providers/locale-provider";
import { synthesizeSpeech } from "@/lib/api";
import { Advisor } from "./advisor";

vi.mock("@/lib/api", () => ({
  ApiError: class ApiError extends Error {},
  sendChat: vi.fn().mockResolvedValue({
    success: true,
    reply: "Use compost and avoid excess urea.",
    mode: "degraded"
  }),
  synthesizeSpeech: vi.fn().mockResolvedValue(new Blob(["wav"], { type: "audio/wav" }))
}));

class MockAudioContext {
  state = "running";
  destination = {};
  decodeAudioData = vi.fn().mockResolvedValue({ duration: 1 });
  resume = vi.fn().mockResolvedValue(undefined);
  close = vi.fn().mockResolvedValue(undefined);
  createBufferSource = vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    stop: vi.fn(),
    start: vi.fn(),
    onended: null
  }));
}

vi.stubGlobal("AudioContext", MockAudioContext);

vi.mock("sonner", () => ({
  toast: { error: vi.fn() }
}));

describe("Advisor", () => {
  it("shows a degraded badge and never claims a live model when the API degrades", async () => {
    const user = userEvent.setup();
    render(
      <LocaleProvider>
        <Advisor />
      </LocaleProvider>
    );

    await user.type(screen.getByLabelText("Type your question"), "How do I improve soil?");
    await user.click(screen.getByRole("button", { name: /send/i }));

    expect(await screen.findByText("Use compost and avoid excess urea.")).toBeInTheDocument();
    expect(screen.getByText("Local knowledge")).toBeInTheDocument();
    expect(screen.queryByText("Live AI")).not.toBeInTheDocument();
    await waitFor(() => expect(synthesizeSpeech).toHaveBeenCalled(), { timeout: 2000 });
  }, 10000);
});
