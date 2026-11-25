import { createClient } from "@/lib/supabase/server";
import { Product } from "@/lib/types";
import AnnouncementBar from "@/components/AnnouncementBar";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ProductGrid from "@/components/ProductGrid";
import CartDrawer from "@/components/CartDrawer";

export const revalidate = 0; // always show current stock

export default async function HomePage() {
  const supabase = createClient();
  const { data: products, error } = await supabase
    .from("products")
    .select("*, product_variants(*)")
    .eq("active", true)
    .order("category");

  if (error) throw new Error(`Failed to load active products: ${error.message}`);

  const safeProducts = (products ?? []) as Product[];

  return (
    <>
      <AnnouncementBar />
      <Navbar />
      <Hero />
      <ProductGrid products={safeProducts} />
      <footer className="text-center text-sm opacity-60 py-10">AMIRA — Tripoli, Libya</footer>
      <CartDrawer />
    </>
  );
}
