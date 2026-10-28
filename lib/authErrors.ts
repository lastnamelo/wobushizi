export function formatAuthError(error: unknown): string {
  const details = error && typeof error === "object"
    ? error as { message?: unknown; code?: unknown; details?: { code?: unknown } }
    : null;
  const message = typeof details?.message === "string" ? details.message : "";
  const code = details?.code ?? details?.details?.code;

  if (code === "otp_expired" || /link.*(?:invalid|expired)|token.*(?:invalid|expired)/i.test(message)) {
    return "This sign-in link has expired or has already been used. Request a new email, then open the sign-in link in the newest message.";
  }

  if (/failed to fetch|networkerror|fetch failed|load failed/i.test(message)) {
    return "Could not reach the sign-in service. Check your connection, or try opening the website in another browser.";
  }

  return message || "Sign-in could not be completed. Please try again.";
}
