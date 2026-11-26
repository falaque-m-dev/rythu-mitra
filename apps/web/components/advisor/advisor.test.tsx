import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/components/providers/locale-provider";
import { sendChat, synthesizeSpeech } from "@/lib/api";
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

  it("accepts array-like speech results without crashing", async () => {
    const user = userEvent.setup();
    type SpeechEvent = {
      results: ArrayLike<ArrayLike<{ transcript?: string }>>;
    };
    const instances: MockSpeechRecognition[] = [];

    class MockSpeechRecognition {
      lang = "";
      interimResults = false;
      continuous = false;
      onresult: ((event: SpeechEvent) => void) | null = null;
      onend: (() => void) | null = null;
      onerror: ((event: { error?: string }) => void) | null = null;
      start = vi.fn();
      stop = vi.fn();

      constructor() {
        instances.push(this);
      }
    }

    vi.stubGlobal("SpeechRecognition", MockSpeechRecognition);
    Object.defineProperty(window, "isSecureContext", { configurable: true, value: true });

    render(
      <LocaleProvider>
        <Advisor />
      </LocaleProvider>
    );

    await user.click(screen.getByRole("button", { name: "Listen" }));

    const recognition = instances[0];
    expect(recognition.start).toHaveBeenCalledOnce();

    act(() => {
      recognition.onresult?.({
        results: {
          length: 1,
          0: { length: 1, 0: { transcript: "How much urea for paddy?" } }
        }
      });
    });

    expect(screen.getByLabelText("Type your question")).toHaveValue("How much urea for paddy?");
  });

  it("renders assistant markdown instead of showing markdown tokens", async () => {
    const user = userEvent.setup();
    vi.mocked(sendChat).mockResolvedValueOnce({
      success: true,
      reply: "**Paddy advice**\n\n***\n\n* Add compost\n* Rotate crops",
      mode: "live"
    });
    render(
      <LocaleProvider>
        <Advisor />
      </LocaleProvider>
    );

    await user.type(screen.getByLabelText("Type your question"), "How do I improve soil?");
    await user.click(screen.getByRole("button", { name: /send/i }));

    expect(await screen.findByText("Paddy advice")).toBeInTheDocument();
    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(document.querySelector("hr")).toBeInTheDocument();
    expect(screen.queryByText("**Paddy advice**")).not.toBeInTheDocument();
    expect(screen.queryByText("***")).not.toBeInTheDocument();
  }, 10000);
});
