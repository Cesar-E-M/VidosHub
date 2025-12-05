import "./globals.css";
import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";
import { Toaster } from "sonner";
import { UploadModal } from "@/components/UploadModal";
import { AuthProvider } from "@/hooks/context/useAuth";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <meta content="text/html;charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        <Theme>
          <AuthProvider>
            {children}
            <Toaster
              position="top-right"
              richColors
              theme="dark" // o "dark"
              toastOptions={{
                style: {
                  background: "white",
                  color: "#1f2937",
                  border: "1px solid #e5e7eb",
                  borderRadius: "0.75rem",
                  fontSize: "14px",
                  padding: "16px",
                },
                className: "custom-toast",
                duration: 4000,
              }}
            />
            <UploadModal />
          </AuthProvider>
        </Theme>
      </body>
    </html>
  );
}
