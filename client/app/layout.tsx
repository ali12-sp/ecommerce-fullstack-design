import "./globals.css";
import { apiFetch } from "@/lib/api";
import { AppProvider } from "@/context/AppContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import type { SiteSettings } from "@/lib/types";

export const metadata = {
  title: "Brand | Ecommerce",
  description: "Responsive ecommerce full-stack app"
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  let siteSettings: SiteSettings | null = null;

  try {
    siteSettings = await apiFetch<SiteSettings>("/site-settings");
  } catch {
    siteSettings = null;
  }

  return (
    <html lang="en">
      <body>
        <AppProvider>
          <Header
            brandName={siteSettings?.brandName}
            localeLabel={siteSettings?.localeLabel}
            headerLinks={siteSettings?.headerLinks}
          />
          <main className="page-shell">{children}</main>
          <Footer />
        </AppProvider>
      </body>
    </html>
  );
}
