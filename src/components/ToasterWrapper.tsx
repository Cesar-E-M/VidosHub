"use client";

import { Toaster } from "sonner";
import { useTheme } from "@/hooks/context/useTheme";

export const ToasterWrapper = () => {
  const { theme } = useTheme();

  return (
    <Toaster
      position="top-right"
      richColors
      theme={theme}
      toastOptions={{
        style: {
          background: theme === "dark" ? "var(--dialog-bg)" : "white",
          color: theme === "dark" ? "var(--dialog-text)" : "#1f2937",
          border:
            theme === "dark"
              ? "1px solid var(--dialog-border)"
              : "1px solid #e5e7eb",
          borderRadius: "0.75rem",
          fontSize: "14px",
          padding: "16px",
        },
        className: "custom-toast",
        duration: 4000,
      }}
    />
  );
};
