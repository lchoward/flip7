import styles from "./ConfirmDialog.module.css";

export default function ConfirmDialog({ title, message, onConfirm, onCancel, confirmLabel = "Confirm", cancelLabel = "Cancel", variant = "default" }) {
  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.dialog} onClick={e => e.stopPropagation()}>
        <h3>{title}</h3>
        <div className={styles.message}>{message}</div>
        <div className={styles.actions}>
          <button className="btn btn-ghost" onClick={onCancel}>{cancelLabel}</button>
          <button className={`btn btn-primary btn-small ${variant === "warning" ? styles.warningBtn : ""}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
