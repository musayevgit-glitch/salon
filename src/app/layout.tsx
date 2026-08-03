import type { Metadata } from "next";
import "./globals.css";
import "./mobile.css";
import "./admin-mobile.css";
import "./booking-manage.css";
import "./manager-operations.css";
import "./catalog-admin.css";
export const metadata: Metadata = { title: "Salonomia | Gözəllik üçün vaxt ayır", description: "Salon rezervasiyalarını asanlaşdıran platforma" };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="az"><body>{children}</body></html>; }
