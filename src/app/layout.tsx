import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import "./mobile.css";
import "./admin-mobile.css";
import "./booking-manage.css";
import "./manager-operations.css";
import "./catalog-admin.css";

const headingFont = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-heading", display: "swap" });
const bodyFont = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = { title: "Salonomia | Gözəllik üçün vaxt ayır", description: "Salon rezervasiyalarını asanlaşdıran platforma" };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="az" className={`${headingFont.variable} ${bodyFont.variable}`}><body>{children}</body></html>;
}
