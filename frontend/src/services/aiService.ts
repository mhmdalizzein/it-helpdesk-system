import API_BASE_URL from "../api";
import { getToken } from "./authService";

export type AITextResponse = {
  result: string;
};

export type AIRecommendationRequest = {
  title: string;
  description: string;
};

export type AIRecommendationResponse = {
  recommendedId: number;
  recommendedName: string;
  reason: string;
};

export type AIStatusResponse = {
  provider: string;
  mode: "Demo" | "Live";
  isConfigured: boolean;
  model: string | null;
  message: string;
};

async function postAI<T>(path: string, body: unknown = {}): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/ai/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let result: unknown = text;

  try {
    result = JSON.parse(text);
  } catch {
    // Keep a non-JSON response as text for the fallback error below.
  }

  if (!response.ok) {
    const message = typeof result === "object" && result !== null
      ? String((result as Record<string, unknown>).message || "AI request failed.")
      : `AI request failed (${response.status}).`;
    throw new Error(message);
  }

  return result as T;
}

export function generateTicketSummary(ticketId: number): Promise<AITextResponse> {
  return postAI(`ticket-summary/${ticketId}`);
}

export function getTroubleshootingSuggestions(ticketId: number): Promise<AITextResponse> {
  return postAI(`troubleshooting/${ticketId}`);
}

export function recommendPriority(
  request: AIRecommendationRequest,
): Promise<AIRecommendationResponse> {
  return postAI("recommend-priority", request);
}

export function recommendCategory(
  request: AIRecommendationRequest,
): Promise<AIRecommendationResponse> {
  return postAI("recommend-category", request);
}

export function askHelpdeskAssistant(message: string): Promise<AITextResponse> {
  return postAI("chat", { message });
}

export async function getAIStatus(): Promise<AIStatusResponse> {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/ai/status`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Failed to load AI status.");
  return result as AIStatusResponse;
}
