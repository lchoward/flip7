import styles from "./BustChanceBanner.module.css";

export default function BustChanceBanner({ bustChance, bustCards, totalRemaining }) {
  const colorClass =
    bustChance >= 75 ? "bustDanger" :
    bustChance >= 50 ? "bustWarning" :
    bustChance >= 25 ? "bustCaution" :
    "bustSafe";

  return (
    <div className={`${styles.bustChanceBanner} ${colorClass}`}>
      <span className={styles.bustChanceValue}>{bustChance.toFixed(1)}%</span>
      <span className={styles.bustChanceLabel}>
        bust ({bustCards}/{totalRemaining})
      </span>
    </div>
  );
}
