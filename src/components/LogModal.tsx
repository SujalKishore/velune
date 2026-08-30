import React, { useState } from 'react';
import { X, Calendar, Clock } from 'lucide-react';
import styles from './LogModal.module.css';

interface LogModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (date: string, time: string) => void;
  defaultDate?: string;
}

export default function LogModal({ title, isOpen, onClose, onSave, defaultDate }: LogModalProps) {
  const [date, setDate] = useState(() => {
    if (defaultDate) return new Date(defaultDate).toISOString().split('T')[0];
    return new Date().toISOString().split('T')[0];
  });
  
  const [time, setTime] = useState(() => {
    if (defaultDate) return new Date(defaultDate).toTimeString().slice(0,5);
    return new Date().toTimeString().slice(0,5);
  });

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Log: {title}</h2>
          <button onClick={onClose} className={styles.closeBtn}><X size={20} /></button>
        </div>
        <div className={styles.body}>
          <div className={styles.inputGroup}>
            <label><Calendar size={16} /> Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className={styles.input} />
          </div>
          <div className={styles.inputGroup}>
            <label><Clock size={16} /> Time</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} className={styles.input} />
          </div>
          <button 
            className={styles.saveBtn} 
            onClick={() => onSave(date, time)}
          >
            Save Log
          </button>
        </div>
      </div>
    </div>
  );
}
