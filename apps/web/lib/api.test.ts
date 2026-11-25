import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, diagnose, getMandiPrices, sendChat, synthesizeSpeech } from "./api";

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers as Record<string, string> | undefined)
    }
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("sendChat", () => {
  it("marks a live model reply as live", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ success: true, reply: "Use compost.", live: true }))
    );

    await expect(sendChat("How do I improve soil?", "en")).resolves.toEqual({
      success: true,
      reply: "Use compost.",
      mode: "live"
    });
  });

  it("reports a reply without live:true as degraded, never live", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ success: true, reply: "Local answer." }))
    );

    const result = await sendChat("How do I improve soil?", "en");

    expect(result.mode).toBe("degraded");
  });
});

describe("diagnose", () => {
  it("passes the live flag through as an explicit mode", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          success: true,
          live: false,
          diagnosis: { crop: "Tomato", disease: "Early blight" }
        })
      )
    );

    const result = await diagnose({ image: "data:image/png;base64,abc", lang: "en" });

    expect(result.mode).toBe("degraded");
    expect(result.diagnosis).toEqual({ crop: "Tomato", disease: "Early blight" });
  });
});

describe("synthesizeSpeech", () => {
  it("returns generated audio as a blob", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(new Blob(["wav"]), {
          status: 200,
          headers: { "content-type": "audio/wav" }
        })
      )
    );

    const blob = await synthesizeSpeech("నమస్తే", "te");

    expect(blob.size).toBeGreaterThan(0);
  });

  it("surfaces the tts_not_configured code instead of falling back", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          { error: "Natural voice is not configured.", code: "tts_not_configured" },
          { status: 503 }
        )
      )
    );

    await expect(synthesizeSpeech("Hello", "en")).rejects.toMatchObject({
      code: "tts_not_configured",
      status: 503
    });
  });
});

describe("request failure handling", () => {
  it("rejects non-JSON responses instead of guessing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("<html>Not found</html>", {
          status: 200,
          headers: { "content-type": "text/html" }
        })
      )
    );

    const error = await getMandiPrices().catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ code: "non_json_response", status: 200 });
  });

  it("surfaces the server error message for HTTP failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ error: "Missing image" }, { status: 400 }))
    );

    await expect(
      diagnose({ image: "", lang: "en" })
    ).rejects.toMatchObject({ code: "http_error", status: 400, message: "Missing image" });
  });

  it("reports network failures without pretending success", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(getMandiPrices()).rejects.toMatchObject({ code: "network_error" });
  });

  it("aborts slow requests and reports a timeout", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_input: RequestInfo | URL, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () =>
              reject(new DOMException("Aborted", "AbortError"))
            );
          })
      )
    );

    const pending = getMandiPrices();
    const assertion = expect(pending).rejects.toMatchObject({ code: "timeout" });

    await vi.advanceTimersByTimeAsync(20_000);
    await assertion;
  });
});
