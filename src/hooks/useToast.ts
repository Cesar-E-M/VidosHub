import { toast as sonnerToast } from "sonner";

interface ToastProps {
  title: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
}

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
