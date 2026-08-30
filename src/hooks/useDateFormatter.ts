"use client";
import { useSettings } from "@/contexts/SettingsContext";

export function useDateFormatter() {
  const { settings, isLoaded } = useSettings();

  const formatDate = (dateInput: string | Date | number) => {
    if (!isLoaded) return "";
    
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return "Invalid Date";

    const format = settings.dateFormat || "us";
    
    if (format === "us") {
      // June 20, 2026
      return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    } else if (format === "eu") {
      // 20 June 2026
      return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    } else if (format === "iso") {
      // 2026-06-20
      return date.toISOString().split("T")[0];
    }
    
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };

  return { formatDate };
}
