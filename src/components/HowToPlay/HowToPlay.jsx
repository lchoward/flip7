import { useState, useEffect, useRef } from "react";
import styles from "./HowToPlay.module.css";

const SLIDES = [
  {
    title: "Race to 200",
    text: "Be the first player to reach 200 points across multiple rounds.",
  },
  {
    title: "Hit or Stand",
    text: "Each turn, draw cards to build your hand. Hit to draw another card, or Stand to lock in your points.",
  },
  {
    title: "Stand",
    subtitle: "Case 1",
    text: "Locking in keeps your cards safe. You score the sum of your number cards.",
  },
  {
    title: "Hit",
    subtitle: "Case 2",
    text: "Drawing another card can boost your score \u2014 but risk busting if you draw a duplicate!",
  },
  {
    title: "Avoid Duplicates",
    text: "Drawing a number you already have means you bust \u2014 scoring 0 for the round.",
  },
  {
    title: "Flip 7!",
    text: "Collect exactly 7 unique number cards without busting for a +15 point bonus!",
  },
  {
    title: "Action Cards",
    text: (
      <ul className={styles.bulletList}>
        <li><strong>Freeze:</strong> Ends your turn immediately</li>
        <li><strong>Flip Three:</strong> Force any player to draw 3 cards, even yourself</li>
        <li><strong>Second Chance:</strong> Protects you from one bust</li>
      </ul>
    ),
  },
  {
    title: "Boost Your Score",
    text: "Modifier cards add bonus points. +2 to +10 add flat points. x2 doubles only your number cards!",
  },
];

function MiniCard({ value, className = "", style = {}, small }) {
  return (
    <div
      className={`${styles.miniCard} ${small ? styles.miniCardSmall : ""} ${className}`}
      style={style}
    >
      {value}
    </div>
  );
}

function numberColor(n) {
  return `hsl(${n * 28}, 70%, 50%)`;
}

/* Slide 1 — Race to 200 */
function Slide1() {
  return (
    <div className={styles.progressArea}>
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} />
      </div>
      <div className={styles.milestones}>
        <span>0</span>
        <span>50</span>
        <span>100</span>
        <span>150</span>
        <span className={styles.milestone200}>200</span>
      </div>
    </div>
  );
}

/* Slide 2 — Hit or Stand */
function Slide2() {
  const cards = [3, 7, 11];
  return (
    <div className={styles.dealArea}>
      <div className={styles.cardRow}>
        {cards.map((n, i) => (
          <MiniCard
            key={n}
            value={n}
            className={styles.dealIn}
            style={{
              background: numberColor(n),
              animationDelay: `${i * 0.25}s`,
            }}
          />
        ))}
      </div>
      <div className={styles.mockButtons}>
        <div className={`${styles.mockBtn} ${styles.mockHit}`}>Hit</div>
        <div className={`${styles.mockBtn} ${styles.mockStand}`}>Stand</div>
      </div>
    </div>
  );
}

/* Slide 3 — Stand (Case 1) */
function Slide3() {
  const cards = [3, 7, 11];
  return (
    <div className={styles.dealArea}>
      <div className={styles.cardRow}>
        {cards.map((n) => (
          <MiniCard
            key={n}
            value={n}
            style={{ background: numberColor(n) }}
          />
        ))}
      </div>
      <div className={styles.mockButtons}>
        <div className={`${styles.mockBtn} ${styles.mockStand} ${styles.standPulse}`}>Stand</div>
      </div>
      <div className={styles.scoreLockedArea}>
        <span className={styles.scoreLocked}>21 pts</span>
        <span className={styles.lockIcon}>Locked in!</span>
      </div>
    </div>
  );
}

/* Slide 4 — Hit (Case 2) */
function Slide4() {
  const baseCards = [3, 7, 11];
  return (
    <div className={styles.dealArea}>
      <div className={styles.cardRow}>
        {baseCards.map((n) => (
          <MiniCard
            key={n}
            value={n}
            style={{ background: numberColor(n) }}
          />
        ))}
        <MiniCard
          value={12}
          className={styles.dealIn}
          style={{
            background: numberColor(12),
            animationDelay: "0.6s",
          }}
        />
      </div>
      <div className={styles.scoreTransition}>
        <span className={styles.scoreOld}>21</span>
        <span className={styles.scoreArrow}>&rarr;</span>
        <span className={styles.scoreNew}>33</span>
      </div>
    </div>
  );
}

/* Slide 5 — Avoid Duplicates */
function Slide5() {
  const safeCards = [5, 9, 3];
  return (
    <div className={styles.bustArea}>
      <div className={styles.bustHand}>
        <div className={styles.bustDim} style={{ display: "flex", gap: 10 }}>
          {safeCards.map((n, i) => (
            <MiniCard
              key={`safe-${n}`}
              value={n}
              className={styles.dealIn}
              style={{
                background: numberColor(n),
                animationDelay: `${i * 0.25}s`,
              }}
            />
          ))}
          <MiniCard
            value={5}
            className={`${styles.dupeCard} ${styles.dupeHighlight}`}
            style={{ background: numberColor(5) }}
          />
        </div>
      </div>
      <div className={styles.bustScoreRow}>
        <span className={styles.bustBadge}>BUST!</span>
        <div className={styles.scoreTransition}>
          <span className={styles.scoreOld}>17</span>
          <span className={styles.scoreArrow}>&rarr;</span>
          <span className={styles.bustScoreZero}>0</span>
        </div>
      </div>
    </div>
  );
}

/* Slide 6 — Flip 7 */
function Slide6() {
  const cards = [1, 4, 6, 8, 10, 2, 12];
  const sum = cards.reduce((a, b) => a + b, 0);
  return (
    <div className={styles.flip7Area}>
      <div className={styles.cardArc}>
        {cards.map((n, i) => (
          <MiniCard
            key={n}
            value={n}
            small
            className={styles.arcCard}
            style={{
              background: numberColor(n),
              animationDelay: `${i * 0.3}s`,
              transform: `rotate(${(i - 3) * 5}deg)`,
            }}
          />
        ))}
      </div>
      <div className={styles.flip7Badge}>FLIP 7! +15</div>
      <div className={styles.flip7Score}>
        <span className={styles.scoreOld}>{sum}</span>
        <span className={styles.scoreArrow}>+15 =</span>
        <span className={styles.scoreNew}>{sum + 15}</span>
      </div>
    </div>
  );
}

/* Slide 7 — Action Cards */
function Slide7() {
  const actions = [
    { name: "\u2744\uFE0F", label: "Freeze" },
    { name: "3x", label: "Flip Three" },
    { name: "\u2764\uFE0F", label: "Second Chance" },
  ];
  return (
    <div className={styles.actionArea}>
      {actions.map((a, i) => (
        <div
          key={a.label}
          className={styles.actionItem}
          style={{ animationDelay: `${i * 0.3}s` }}
        >
          <MiniCard
            value={a.name}
            className={styles.actionCard}
            style={{ fontSize: 20 }}
          />
          <span className={styles.actionLabel}>{a.label}</span>
        </div>
      ))}
    </div>
  );
}

/* Slide 8 — Boost Your Score */
function Slide8() {
  return (
    <div className={styles.scoreArea}>
      {/* Step 1: Base number cards → 11 */}
      <div className={styles.scoreStep} style={{ animationDelay: "0s" }}>
        <MiniCard value={3} style={{ background: numberColor(3) }} small />
        <span className={styles.scorePlus}>+</span>
        <MiniCard value={8} style={{ background: numberColor(8) }} small />
        <span className={styles.scorePlus}>=</span>
        <span className={styles.scoreDisplay}>11</span>
      </div>
      {/* Step 2: x2 doubles number cards → (3+8)x2 = 22 */}
      <div className={styles.scoreStep} style={{ animationDelay: "0.8s" }}>
        <span className={styles.scoreFormula}>(3 + 8)</span>
        <MiniCard
          value="x2"
          className={`${styles.modifierCard} ${styles.slideInCard}`}
          small
          style={{ animationDelay: "0.8s" }}
        />
        <span className={styles.scorePlus}>=</span>
        <span className={`${styles.scoreDisplay} ${styles.scoreChange}`} style={{ animationDelay: "1.2s" }}>
          22
        </span>
      </div>
      {/* Step 3: +4 modifier adds flat → 22+4 = 26 */}
      <div className={styles.scoreStep} style={{ animationDelay: "1.6s" }}>
        <span className={styles.scoreFormula}>22</span>
        <span className={styles.scorePlus}>+</span>
        <MiniCard
          value="+4"
          className={`${styles.modifierCard} ${styles.slideInCard}`}
          small
          style={{ animationDelay: "1.6s" }}
        />
        <span className={styles.scorePlus}>=</span>
        <span className={`${styles.scoreDisplay} ${styles.scoreChange}`} style={{ animationDelay: "2s" }}>
          26
        </span>
      </div>
    </div>
  );
}

const SLIDE_VISUALS = [Slide1, Slide2, Slide3, Slide4, Slide5, Slide6, Slide7, Slide8];

export default function HowToPlay({ onClose }) {
  const [current, setCurrent] = useState(0);
  const touchRef = useRef(null);
  const isLast = current === SLIDES.length - 1;
  const isFirst = current === 0;

  const goNext = () => {
    if (!isLast) setCurrent((c) => c + 1);
  };

  const goPrev = () => {
    if (!isFirst) setCurrent((c) => c - 1);
  };

  // Keyboard navigation + Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Touch swipe
  const onTouchStart = (e) => {
    touchRef.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    if (touchRef.current === null) return;
    const diff = touchRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
    touchRef.current = null;
  };

  const Visual = SLIDE_VISUALS[current];
  const slide = SLIDES[current];

  return (
    <div
      className={styles.overlay}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
        &times;
      </button>

      <div className={styles.carousel}>
        <div className={styles.slide} key={current}>
          {slide.subtitle && (
            <span className={styles.slideSubtitle}>{slide.subtitle}</span>
          )}
          <h2 className={styles.slideTitle}>{slide.title}</h2>
          <div className={styles.visual}>
            <Visual />
          </div>
          <div className={styles.slideText}>{slide.text}</div>
        </div>

        <div className={styles.nav}>
          <button
            className={styles.navBtn}
            onClick={goPrev}
            disabled={isFirst}
            aria-label="Previous slide"
          >
            &#8249;
          </button>

          <div className={styles.dots}>
            {SLIDES.map((_, i) => (
              <button
                key={i}
                className={`${styles.dot} ${i === current ? styles.dotActive : ""}`}
                onClick={() => setCurrent(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

          {isLast ? (
            <button
              className="btn btn-primary btn-small"
              onClick={onClose}
              style={{ borderRadius: 50 }}
            >
              Got It!
            </button>
          ) : (
            <button
              className={styles.navBtn}
              onClick={goNext}
              aria-label="Next slide"
            >
              &#8250;
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
