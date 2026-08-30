import React from "react";

interface LogoProps {
  className?: string;
  onClick?: () => void;
  size?: number;
}

export default function Logo({ className, onClick, size = 20 }: LogoProps) {
  const lineH = Math.max(2, Math.round(size * 0.14));
  const lineW = Math.max(10, Math.round(size * 0.6));
  const gap = Math.max(2, Math.round(size * 0.18));

  return (
    <div 
      className={className} 
      onClick={onClick}
      style={{ 
        display: "inline-flex", 
        alignItems: "center",
        cursor: onClick ? "pointer" : "inherit"
      }}
    >
      <span style={{ fontFamily: '"Space Grotesk", sans-serif' }}>VELUN</span>
      <div style={{ display: "flex", flexDirection: "column", gap: `${gap}px`, marginLeft: "2px", marginBottom: "2px" }}>
        <div style={{ width: `${lineW}px`, height: `${lineH}px`, backgroundColor: "#FFFFFF" }} />
        <div style={{ width: `${lineW}px`, height: `${lineH}px`, backgroundColor: "#A7F3D0" }} />
        <div style={{ width: `${lineW}px`, height: `${lineH}px`, backgroundColor: "var(--primary-accent)" }} />
      </div>
    </div>
  );
}
