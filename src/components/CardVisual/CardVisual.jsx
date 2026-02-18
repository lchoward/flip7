import styles from "./CardVisual.module.css";

export default function CardVisual({ type, value, small, dimmed, highlight }) {
  const typeClass = type === "modifier" ? styles.modifier
    : type === "action" ? styles.action
    : styles.number;

  const bgStyle = type === "number"
    ? { background: `hsl(${value * 28}, 70%, 50%)` }
    : {};

  return (
    <div
      className={`${styles.card} ${typeClass} ${small ? styles.small : ""} ${dimmed ? styles.dimmed : ""} ${highlight ? styles.highlight : ""}`}
      style={bgStyle}
    >
      {value}
    </div>
  );
}
