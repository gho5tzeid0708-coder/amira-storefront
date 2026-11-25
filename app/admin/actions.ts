"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createAdminSessionToken,
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken
} from "@/lib/admin-session";
import { OrderStatus } from "@/lib/types";

async function requireAdmin() {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  if (!token || !(await verifyAdminSessionToken(token))) {
    redirect("/admin/login");
  }
}

export async function loginAdmin(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (password !== process.env.ADMIN_PASSWORD) {
    redirect("/admin/login?error=1");
  }
  const sessionToken = await createAdminSessionToken();
  cookies().set(ADMIN_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8 // 8 hours
  });
  redirect("/admin");
}

export async function logoutAdmin() {
  await requireAdmin();
  cookies().delete(ADMIN_SESSION_COOKIE);
  redirect("/admin/login");
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  await requireAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) throw new Error("Invalid order ID");
  if (!["pending", "confirmed", "out_for_delivery", "delivered", "cancelled"].includes(status)) {
    throw new Error("Invalid order status");
  }

  const supabase = createAdminClient();
  await supabase.from("orders").update({ status }).eq("id", orderId);
}

export async function updateStock(variantId: string, newQuantity: number) {
  await requireAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(variantId)) throw new Error("Invalid variant ID");
  if (!Number.isInteger(newQuantity)) throw new Error("Stock quantity must be an integer");

  const supabase = createAdminClient();
  await supabase.from("product_variants").update({ stock_quantity: Math.max(0, newQuantity) }).eq("id", variantId);
}
