import { TRAY_CHIPS, chipLabel } from "../lib/chips";

export default function ChipTray({
  chip,
  onPick,
}: {
  chip: number;
  onPick: (value: number, el: HTMLButtonElement) => void;
}) {
  return (
    <div className="tray" role="listbox" aria-label="chips">
      {TRAY_CHIPS.map((v) => (
        <button
          key={v}
          type="button"
          className={`chip c${v} ${chip === v ? "on" : ""}`}
          onClick={(e) => onPick(v, e.currentTarget)}
        >
          {chipLabel(v)}
        </button>
      ))}
    </div>
  );
}
