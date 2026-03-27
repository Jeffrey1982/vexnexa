import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { CookieBanner } from "@/components/marketing/CookieBanner";
import { SkipLink } from "@/components/marketing/SkipLink";
import { Toaster } from "@/components/ui/toaster";

export default function ReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <SkipLink />
      <Navbar />
      <main id="main-content" className="flex-1" tabIndex={-1}>
        {children}
      </main>
      <Footer />
      <CookieBanner />
      <Toaster />
    </div>
  );
}
