"use client";

import React from "react";
import styles from "./CustomDialog.module.css";
import { AlertCircle, HelpCircle } from "lucide-react";

interface CustomDialogProps {
  isOpen: boolean;
  type: "alert" | "confirm";
  options: { title?: string; message: string };
  onConfirm: () => void;
  onCancel: () => void;
}

export default function CustomDialog({ isOpen, type, options, onConfirm, onCancel }: CustomDialogProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={(e) => {
      // Allow clicking outside to dismiss alert, but not confirm
      if (type === "alert" && e.target === e.currentTarget) {
        onConfirm();
      }
    }}>
      <div className={styles.dialog}>
        <div className={styles.header}>
          <div className={`${styles.iconWrap} ${type === 'confirm' ? styles.iconWrapConfirm : styles.iconWrapAlert}`}>
            {type === 'confirm' ? <HelpCircle size={24} /> : <AlertCircle size={24} />}
          </div>
          <h3 className={styles.title}>{options.title || (type === "alert" ? "Notification" : "Please Confirm")}</h3>
        </div>
        <div className={styles.content}>
          <p className={styles.message}>{options.message}</p>
        </div>
        <div className={styles.actions}>
          {type === "confirm" && (
            <button className={styles.cancelBtn} onClick={onCancel}>
              Cancel
            </button>
          )}
          <button className={`${styles.confirmBtn} ${type === 'confirm' ? styles.confirmBtnDanger : ''}`} onClick={onConfirm}>
            {type === "confirm" ? "Confirm" : "OK"}
          </button>
        </div>
      </div>
    </div>
  );
}
