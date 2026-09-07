export default function Toast({
  text,
  kind = "info",
  onClose,
}: {
  text: string;
  kind?: "info" | "error" | "ok";
  onClose: () => void;
}) {
  if (!text) return null;
  return (
    <div className={`toast-pop ${kind}`} role="status">
      <i className={`fa-solid ${kind === "error" ? "fa-circle-exclamation" : kind === "ok" ? "fa-circle-check" : "fa-bell"}`} />
      <p>{text}</p>
      <button type="button" onClick={onClose} aria-label="close">×</button>
    </div>
  );
}
