import { DECK } from "../../constants/deck";
import styles from "./DeckTracker.module.css";

export default function DeckTracker({ dealt, deckOpen, onToggle, lastReshuffle, onReset }) {
  return (
    <div className={styles.deckSection}>
      <div className={styles.deckToggle} onClick={onToggle}>
        <h3>🃏 Deck Tracker</h3>
        <span style={{ color: "var(--text-dim)", fontSize: 14 }}>{deckOpen ? "▲" : "▼"}</span>
      </div>
      {deckOpen && dealt && (
        <div className="fade-in">
          <div style={{ fontSize: 13, color: "var(--text-dim)", margin: "8px 0" }}>
            {lastReshuffle ? `Since last reshuffle (round ${lastReshuffle})` : "Since game start"}
          </div>
          <div className={styles.sectionLabel}>Number Cards</div>
          <div className={styles.deckGrid}>
            {Array.from({ length: 13 }, (_, i) => {
              const total = DECK.numbers[i];
              const used = dealt.numbers[i] || 0;
              const rem = Math.max(0, total - used);
              return (
                <div key={i} className={`${styles.deckCard} ${rem === 0 ? styles.depleted : ""} ${rem <= 1 && rem > 0 ? styles.low : ""}`}>
                  <div className={styles.deckCardValue}>{i}</div>
                  <div className={styles.deckCardCount}>{rem}/{total}</div>
                </div>
              );
            })}
          </div>
          <div className={styles.sectionLabel} style={{ marginTop: 12 }}>Modifiers</div>
          <div className={styles.deckGrid}>
            {Object.entries(DECK.modifiers).map(([key, total]) => {
              const used = dealt.modifiers[key] || 0;
              const rem = Math.max(0, total - used);
              return (
                <div key={key} className={`${styles.deckCard} ${rem === 0 ? styles.depleted : ""} ${rem <= 1 && rem > 0 ? styles.low : ""}`}>
                  <div className={styles.deckCardValue}>{key}</div>
                  <div className={styles.deckCardCount}>{rem}/{total}</div>
                </div>
              );
            })}
          </div>
          <div className={styles.sectionLabel} style={{ marginTop: 12 }}>Actions</div>
          <div className={styles.deckGrid}>
            {Object.entries(DECK.actions).map(([key, total]) => {
              const used = dealt.actions[key] || 0;
              const rem = Math.max(0, total - used);
              return (
                <div key={key} className={`${styles.deckCard} ${rem === 0 ? styles.depleted : ""}`}>
                  <div className={styles.deckCardValue} style={{ fontSize: 11 }}>{key}</div>
                  <div className={styles.deckCardCount}>{rem}/{total}</div>
                </div>
              );
            })}
          </div>
          {onReset && (
            <button className="btn btn-ghost" onClick={onReset} style={{ marginTop: 12, width: "100%" }}>
              🔄 Deck Reshuffled
            </button>
          )}
        </div>
      )}
    </div>
  );
}
