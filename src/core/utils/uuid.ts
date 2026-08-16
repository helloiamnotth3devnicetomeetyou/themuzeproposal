/** RFC 9562 UUIDs in canonical hyphenated form (versions 1 through 8). */
export const UUID_PATTERN_SOURCE =
  "[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
export const UUID_PATTERN = new RegExp(`^${UUID_PATTERN_SOURCE}$`, "i");

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}
