import { isAxiosError } from "axios";

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError<{ message?: string }>(error)) {
    if (!error.response) return "Can't reach the server. Check your connection and try again.";
    return error.response.data?.message ?? fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

export function apiErrorCode(error: unknown): string | undefined {
  return isAxiosError<{ code?: string }>(error) ? error.response?.data?.code : undefined;
}
