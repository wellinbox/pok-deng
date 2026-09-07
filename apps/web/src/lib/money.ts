export function money(n: number | undefined | null) {
  const v = Math.round(Number(n) || 0);
  return v.toLocaleString("en-US");
}

export function stackChips(amount: number, max = 8) {
  const vals = [100, 50, 25, 10, 5];
  const out: number[] = [];
  let left = Math.max(0, Math.floor(amount));
  for (const v of vals) {
    while (left >= v && out.length < max) {
      out.push(v);
      left -= v;
    }
  }
  if (!out.length && amount > 0) out.push(5);
  return out;
}
