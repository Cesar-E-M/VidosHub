import { toast as sonnerToast } from "sonner";

interface ToastProps {
  title: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
}

/**
 * Hook personalizado para mostrar notificaciones toast
 * Usa Sonner por debajo para las notificaciones
 */
export const useToast = () => {
  const toast = ({ title, description, variant = "default" }: ToastProps) => {
    const message = description ? `${title}: ${description}` : title;

    switch (variant) {
      case "destructive":
        sonnerToast.error(message);
        break;
      case "success":
        sonnerToast.success(message);
        break;
      default:
        sonnerToast(message);
    }
  };

  return { toast };
};
