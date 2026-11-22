"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { OrderStatus } from "@/lib/types";

export async function loginAdmin(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (password !== process.env.ADMIN_PASSWORD) {
    redirect("/admin/login?error=1");
  }
  cookies().set("amira_admin", "true", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8 // 8 hours
  });
  redirect("/admin");
}

export async function logoutAdmin() {
  cookies().delete("amira_admin");
  redirect("/admin/login");
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const supabase = createAdminClient();
  await supabase.from("orders").update({ status }).eq("id", orderId);
}

export async function updateStock(variantId: string, newQuantity: number) {
  const supabase = createAdminClient();
  await supabase.from("product_variants").update({ stock_quantity: Math.max(0, newQuantity) }).eq("id", variantId);
}
