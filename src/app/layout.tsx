import "./globals.css";
import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";
import { UploadModal } from "@/components/UploadModal";
import { AuthProvider } from "@/hooks/context/useAuth";
import { ThemeProvider } from "@/hooks/context/useTheme";
import { ToasterWrapper } from "@/components/ToasterWrapper";

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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || 
                  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <Theme>
            <AuthProvider>
              {children}
              <ToasterWrapper />
              <UploadModal />
            </AuthProvider>
          </Theme>
        </ThemeProvider>
      </body>
    </html>
  );
}
