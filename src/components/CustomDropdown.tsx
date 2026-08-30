"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import styles from "./CustomDropdown.module.css";

export default function CustomDropdown({ value, options, onChange, align = "right", theme = "dark" }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  const selectedOption = options.find((o: any) => o.value === value) || options[0];

  return (
    <div className={`${styles.customSelect} ${theme === 'light' ? styles.light : ''}`} ref={dropdownRef}>
      <div className={styles.customSelectTrigger} onClick={() => setIsOpen(!isOpen)}>
        {selectedOption ? selectedOption.label : value}
        <ChevronDown size={14} style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', opacity: 0.6 }} />
      </div>
      {isOpen && (
        <div className={`${styles.customSelectMenu} ${align === 'right' ? styles.menuRight : styles.menuLeft}`}>
          {options.map((o: any) => (
            <div 
              key={o.value} 
              className={`${styles.customSelectOption} ${value === o.value ? styles.customSelectOptionActive : ''}`}
              onClick={() => { onChange(o.value); setIsOpen(false); }}
            >
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
