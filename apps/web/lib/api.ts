import type { ChatResult, DiagnoseResult, MandiResult, WeatherResult } from "./types";

const API_BASE = "/api";
const DEFAULT_TIMEOUT = 20_000;
const AI_TIMEOUT = 60_000;

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 0, code = "request_failed") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit & { timeoutMs?: number }): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), init?.timeoutMs ?? DEFAULT_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers
      }
    });

    const contentType = response.headers.get("content-type") ?? "";

    if (!contentType.includes("application/json")) {
      throw new ApiError(
        "The server returned an unexpected response. The endpoint may not be available on this deployment.",
        response.status,
        "non_json_response"
      );
    }

    const payload = await response.json();

    if (!response.ok) {
      throw new ApiError(
        payload?.error ?? payload?.message ?? "Request failed.",
        response.status,
        "http_error"
      );
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("The request timed out. Please try again.", 0, "timeout");
    }
    throw new ApiError(
      "Could not reach the server. Check your connection and try again.",
      0,
      "network_error"
    );
  } finally {
    clearTimeout(timeout);
  }
}

export function getWeather(lat: number, lon: number, city: string, lang: string) {
  const query = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    city,
    lang
  });
  return request<WeatherResult>(`/weather?${query.toString()}`);
}

export function getMandiPrices() {
  return request<MandiResult>("/mandi");
}

export async function sendChat(query: string, lang: string): Promise<ChatResult> {
  const data = await request<{ success: boolean; reply: string; live?: boolean }>("/chat", {
    method: "POST",
    body: JSON.stringify({ query, lang }),
    timeoutMs: AI_TIMEOUT
  });

  return {
    success: data.success,
    reply: data.reply,
    mode: data.live === true ? "live" : "degraded"
  };
}

export async function diagnose(payload: {
  image: string;
  lang: string;
}): Promise<DiagnoseResult> {
  const data = await request<{ success: boolean; diagnosis: DiagnoseResult["diagnosis"]; live?: boolean }>(
    "/diagnose",
    {
      method: "POST",
      body: JSON.stringify(payload),
      timeoutMs: AI_TIMEOUT
    }
  );

  return {
    success: data.success,
    diagnosis: data.diagnosis,
    mode: data.live === true ? "live" : "degraded"
  };
}

export async function synthesizeSpeech(
  text: string,
  lang: string,
  voice?: string
): Promise<Blob> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  try {
    const response = await fetch(`${API_BASE}/tts`, {
      method: "POST",
      headers: {
        Accept: "audio/wav",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text, lang, voice }),
      signal: controller.signal
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const payload = await response.json();
        throw new ApiError(
          payload?.error ?? "Voice generation failed.",
          response.status,
          payload?.code ?? "tts_failed"
        );
      }
      throw new ApiError("Voice generation failed.", response.status, "tts_failed");
    }

    const blob = await response.blob();
    if (!blob.size) {
      throw new ApiError("Voice generation returned empty audio.", 502, "tts_empty");
    }
    return blob;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("Voice generation timed out. Please try again.", 0, "timeout");
    }
    throw new ApiError(
      "Could not reach the voice service. Check your connection and try again.",
      0,
      "network_error"
    );
  } finally {
    clearTimeout(timeout);
  }
}
