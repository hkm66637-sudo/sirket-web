import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";
import { CompanyProvider } from "@/context/company-context";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Şirket Yönetim Paneli",
  description: "E-ticaret ve Operasyon Yönetim Paneli",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={jakarta.className}>
        <AuthProvider>
          <CompanyProvider>
            {children}
          </CompanyProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
