import { money, stackChips } from "../lib/money";

export default function PotHeap({ amount }: { amount: number }) {
  const chips = stackChips(amount, 8);
  if (amount <= 0) return null;
  return (
    <div className="pot-heap">
      <div className="pot-heap-pile">
        {chips.map((v, i) => (
          <i
            key={`${v}-${i}`}
            className={`chip c${v}`}
            style={{ left: `${(i - (chips.length - 1) / 2) * 11}px`, zIndex: i + 1 }}
          >
            {v}
          </i>
        ))}
      </div>
      <div className="pot-heap-amt">{money(amount)}</div>
    </div>
  );
}
