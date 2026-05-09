import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

export default function ResultsLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
