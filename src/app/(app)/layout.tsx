import type { Metadata } from "next";
import { Lato } from "next/font/google";
import "./../globals.css";
import { Header } from "@/components/Heder";

const lato = Lato({
  subsets: ["latin"],
  weight: ["100", "300", "400", "700", "900"],
});

export const metadata: Metadata = {
  title: "VideoHub",
  description:
    "VideoHub es una plataforma de publicación de videos donde los usuarios pueden compartir sus creaciones, descubrir contenido nuevo y conectarse con otros amantes del video. Con una amplia variedad de categorías y una comunidad activa, VideoHub es el lugar perfecto para explorar y disfrutar de videos de alta calidad.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`${lato.className} flex min-h-screen flex-col antialiased`}>
      <Header />
      {children}
    </div>
  );
}
