/** Tiny classnames helper — joins truthy class fragments. */
export function clsx(
  ...parts: Array<string | false | null | undefined>
): string {
  return parts.filter(Boolean).join(" ");
}
