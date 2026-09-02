import { AxiosError } from "axios";
import { apiClient } from "./client";

/**
 * AI endpoints. These go through apiClient rather than bare fetch on purpose:
 * it attaches the Bearer token under the key the app actually writes
 * (`sfh-token`), and refreshes an expired Neon Auth JWT and retries once
 * instead of surfacing a 401. Hand-rolled fetch calls here were sending no
 * usable credentials and always failed authentication.
 */

export interface TransferSuggestion {
  playerName: string;
  position: string;
  rationale: string;
  fitScore: number;
}

/** The API reports failures as `{ error }`; reading `message` hid the reason. */
export function apiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as
      | { error?: string; message?: string }
      | undefined;
    return data?.error || data?.message || err.message || fallback;
  }
  return err instanceof Error ? err.message : fallback;
}

/** Suggest signings to strengthen a squad. Requires an authenticated user. */
export async function suggestTransfers(
  teamId: string,
): Promise<TransferSuggestion[]> {
  const { data } = await apiClient.post<{
    data: { suggestions: TransferSuggestion[] };
  }>("/ai/transfer", { teamId });

  return data.data.suggestions ?? [];
}

/** Whether the AI features are configured server-side. */
export async function aiStatus(): Promise<{ enabled: boolean }> {
  const { data } = await apiClient.get<{ enabled: boolean }>("/ai/status");
  return data;
}
