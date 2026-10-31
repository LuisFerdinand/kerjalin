import { Footer } from "@/components/marketing/footer";
import { Navbar } from "@/components/marketing/navbar";

export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
