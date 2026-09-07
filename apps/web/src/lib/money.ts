export function money(n: number | undefined | null) {
  const v = Math.round(Number(n) || 0);
  return v.toLocaleString("en-US");
}
