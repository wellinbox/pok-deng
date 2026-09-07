export const TRAY_CHIPS = [5, 10, 25, 50, 100, 500, 1000, 5000] as const;

export function chipLabel(v: number) {
  if (v >= 1000) return `${v / 1000}k`;
  return String(v);
}
