"use client";

import React, { useEffect, useRef } from "react";
import { useSettings } from "@/contexts/SettingsContext";

export default function EffectLayer() {
  const { settings, isLoaded } = useSettings();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isLoaded || !settings.cursorTrail || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener("resize", handleResize);

    let mouse = { x: -100, y: -100 };
    let lastMouse = { x: -100, y: -100 };
    
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove);

    interface Particle {
      x: number;
      y: number;
      age: number;
    }
    const particles: Particle[] = [];

    let animationFrameId: number;
    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Add new particle only if mouse moved
      if (mouse.x > 0 && mouse.y > 0 && (mouse.x !== lastMouse.x || mouse.y !== lastMouse.y)) {
        particles.push({ x: mouse.x, y: mouse.y, age: 0 });
        lastMouse.x = mouse.x;
        lastMouse.y = mouse.y;
      }

      // Get computed color of primary accent
      const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-accent').trim() || 'var(--primary-accent)';

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.age++;
        if (p.age > 30) {
          particles.splice(i, 1);
          i--;
          continue;
        }

        const opacity = 1 - (p.age / 30);
        ctx.beginPath();
        // The particle shrinks as it gets older
        ctx.arc(p.x, p.y, 6 * opacity, 0, Math.PI * 2);
        ctx.fillStyle = accentColor;
        ctx.globalAlpha = opacity;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isLoaded, settings.cursorTrail]);

  if (!isLoaded || !settings.cursorTrail) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 9999,
      }}
    />
  );
}
