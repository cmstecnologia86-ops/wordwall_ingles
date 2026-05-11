import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wordwall Inglés",
  description: "Generador de actividades de inglés con IA para practicar desde material escolar."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
