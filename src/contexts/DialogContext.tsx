"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import CustomDialog from "@/components/CustomDialog";

interface DialogOptions {
  title?: string;
  message: string;
}

interface DialogContextType {
  showAlert: (message: string, title?: string) => Promise<void>;
  showConfirm: (message: string, title?: string) => Promise<boolean>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<"alert" | "confirm">("alert");
  const [options, setOptions] = useState<DialogOptions>({ message: "" });
  const [resolver, setResolver] = useState<{ resolve: (value: boolean) => void } | null>(null);

  const showAlert = useCallback((message: string, title?: string) => {
    return new Promise<void>((resolve) => {
      setOptions({ message, title });
      setType("alert");
      setIsOpen(true);
      setResolver({ resolve: () => resolve() });
    });
  }, []);

  const showConfirm = useCallback((message: string, title?: string) => {
    return new Promise<boolean>((resolve) => {
      setOptions({ message, title });
      setType("confirm");
      setIsOpen(true);
      setResolver({ resolve });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    if (resolver) resolver.resolve(true);
  }, [resolver]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    if (resolver) resolver.resolve(false);
  }, [resolver]);

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      <CustomDialog 
        isOpen={isOpen} 
        type={type} 
        options={options} 
        onConfirm={handleConfirm} 
        onCancel={handleCancel} 
      />
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return context;
}
