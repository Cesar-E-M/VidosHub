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
            <Toaster position="top-right" richColors />
            <UploadModal />
          </AuthProvider>
        </Theme>
      </body>
    </html>
  );
}
