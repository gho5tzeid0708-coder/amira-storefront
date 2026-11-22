import { createAdminClient } from "@/lib/supabase/admin";
import { logoutAdmin } from "./actions";
import OrdersTable, { AdminOrder } from "@/components/admin/OrdersTable";
import StockEditor, { AdminVariant } from "@/components/admin/StockEditor";

export const revalidate = 0;

export default async function AdminPage() {
  const supabase = createAdminClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });

  const { data: variants } = await supabase
    .from("product_variants")
    .select("*, products(name_en)")
    .order("product_id");

  return (
    <div className="min-h-[100dvh] bg-cream px-4 py-8 max-w-6xl mx-auto text-charcoal">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl">AMIRA Admin</h1>
        <form action={logoutAdmin}>
          <button className="text-sm underline opacity-70 hover:opacity-100">Sign out</button>
        </form>
      </div>

      <section className="mb-12">
        <h2 className="font-serif text-xl mb-4">Orders</h2>
        <OrdersTable orders={(orders ?? []) as AdminOrder[]} />
      </section>

      <section>
        <h2 className="font-serif text-xl mb-4">Stock Levels</h2>
        <StockEditor variants={(variants ?? []) as AdminVariant[]} />
      </section>
    </div>
  );
}
