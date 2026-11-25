export const OPEN_ASSISTANT_EVENT = "rythu:open-assistant";

export function openAssistant() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_ASSISTANT_EVENT));
}
