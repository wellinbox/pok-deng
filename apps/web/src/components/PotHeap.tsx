import { money } from "../lib/money";

const DENOMS = [5000, 1000, 500, 100, 50, 25, 10, 5];

function piles(amount: number) {
  let left = Math.max(0, Math.floor(amount));
  return DENOMS.map((v) => {
    const n = Math.min(8, Math.floor(left / v));
    left -= n * v;
    return { v, n };
  }).filter((p) => p.n > 0);
}

export default function PotHeap({ amount }: { amount: number }) {
  if (amount <= 0) return null;
  const groups = piles(amount);
  return (
    <div className="pot-heap">
      <div className="pot-cols">
        {groups.map((g) => (
          <div key={g.v} className="pot-col">
            {Array.from({ length: g.n }).map((_, i) => (
              <i key={i} className={`chip-graphic c${g.v}`} style={{ zIndex: i + 1 }}>
                {g.v}
              </i>
            ))}
          </div>
        ))}
      </div>
      <div className="pot-heap-amt">{money(amount)}</div>
    </div>
  );
}
