import validator from "validator";

/**
 * Sanitizes user input to prevent XSS attacks
 * Escapes HTML special characters and enforces max length
 */
export function sanitizeString(input: string, maxLength: number = 200): string {
  const trimmed = input.trim();
  if (trimmed.length > maxLength) {
    throw new Error(`Input exceeds maximum length of ${maxLength} characters`);
  }
  return validator.escape(trimmed);
}

/**
 * Sanitizes optional string fields
 */
export function sanitizeOptionalString(
  input: string | undefined,
  maxLength: number = 500,
): string | undefined {
  if (!input) return input;
  return sanitizeString(input, maxLength);
}

/**
 * Validates and sanitizes email
 */
export function sanitizeEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();
  if (!validator.isEmail(trimmed)) {
    throw new Error("Invalid email format");
  }
  return validator.normalizeEmail(trimmed) || trimmed;
}
