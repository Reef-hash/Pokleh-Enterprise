// Centralized user-friendly error messages for common Supabase errors
// Maps raw DB errors to human-readable messages

type ErrorInput = { message?: string; code?: string; details?: string } | string | null | undefined;

const ERROR_MAP: Record<string, string> = {
  "23505": "A record with this value already exists.",
  "23503": "This record is linked to other data and cannot be modified.",
  "23502": "Required fields are missing.",
  "42P01": "System configuration error. Please contact support.",
  "42501": "You do not have permission to perform this action.",
  "PGRST116": "No matching record found.",
  "invalid_credentials": "Invalid email or password.",
  "email_taken": "This email is already registered.",
  "weak_password": "Password must be at least 6 characters.",
};

const SPECIFIC_MAP: Record<string, Record<string, string>> = {
  sales: {
    "23503": "Cannot delete this customer — they have existing sales records.",
  },
  suppliers: {
    "23503": "Cannot delete this supplier — they have existing stock intake records.",
  },
  trucks: {
    "23503": "Cannot delete this truck — it has customers or staff assigned.",
  },
};

export function getUserFriendlyError(error: ErrorInput, context?: string): string {
  if (!error) return "An unexpected error occurred.";

  const message = typeof error === "string" ? error : error.message || "";
  const code = typeof error === "object" && error !== null ? (error as any).code : undefined;

  // Check context-specific messages first
  if (context && code && SPECIFIC_MAP[context]?.[code]) {
    return SPECIFIC_MAP[context][code];
  }

  // Check general error codes
  if (code && ERROR_MAP[code]) {
    return ERROR_MAP[code];
  }

  // Fall back to the raw message, truncated if needed
  if (message) {
    return message.length > 120 ? message.substring(0, 120) + "..." : message;
  }

  return "An unexpected error occurred.";
}
