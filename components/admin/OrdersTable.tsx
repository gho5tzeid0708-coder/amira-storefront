"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATUSES } from "@/lib/constants";
import { OrderStatus } from "@/lib/types";
import { updateOrderStatus } from "@/app/admin/actions";

export type AdminOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  phone: string;
  city: string | null;
  address_landmark: string | null;
  fulfillment_type: "delivery" | "pickup";
  female_courier: boolean;
  pickup_branch: string | null;
  subtotal_lyd: number;
  delivery_fee_lyd: number;
  total_lyd: number;
  payment_method: string;
  status: OrderStatus;
  created_at: string;
  order_items: {
    id: string;
    is_bundle: boolean;
    bundle_details_json: any;
    quantity: number;
    unit_price_lyd: number;
    product_id: string | null;
    variant_id: string | null;
  }[];
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled"
};

export default function OrdersTable({ orders }: { orders: AdminOrder[] }) {
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const filtered = useMemo(() => (filter === "all" ? orders : orders.filter((o) => o.status === filter)), [orders, filter]);

  const changeStatus = (orderId: string, status: OrderStatus) => {
    startTransition(async () => {
      await updateOrderStatus(orderId, status);
      router.refresh();
    });
  };

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setFilter("all")}
          className={"text-sm px-3 py-1.5 rounded-full border " + (filter === "all" ? "bg-charcoal text-cream border-charcoal" : "border-hairline")}
        >
          All ({orders.length})
        </button>
        {ORDER_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={"text-sm px-3 py-1.5 rounded-full border " + (filter === s ? "bg-charcoal text-cream border-charcoal" : "border-hairline")}
          >
            {STATUS_LABEL[s]} ({orders.filter((o) => o.status === s).length})
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl overflow-hidden">
        {filtered.length === 0 && <p className="p-4 text-sm opacity-60">No orders in this view.</p>}
        {filtered.map((o) => (
          <div key={o.id} className="border-b border-hairline last:border-0">
            <button onClick={() => setExpanded(expanded === o.id ? null : o.id)} className="w-full text-start p-4 flex flex-wrap items-center gap-3">
              <span className="font-medium">{o.order_number}</span>
              <span className="text-sm opacity-70">{o.customer_name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-stone border border-hairline">
                {o.fulfillment_type === "pickup" ? "Pickup" : "Delivery"}
              </span>
              <span className="text-sm opacity-70">{o.fulfillment_type === "pickup" ? o.pickup_branch : o.city}</span>
              {o.female_courier && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-wine/10 text-wine border border-wine/30">Female courier</span>
              )}
              <span className="text-sm opacity-70">{o.phone}</span>
              <span className="text-sm font-medium ms-auto">{o.total_lyd} د.ل</span>
              <select
                value={o.status}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => changeStatus(o.id, e.target.value as OrderStatus)}
                disabled={isPending}
                className="text-sm border rounded-lg px-2 py-1 bg-white"
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </button>

            {expanded === o.id && (
              <div className="px-4 pb-4 text-sm flex flex-col gap-2">
                <p className="opacity-70">{o.address_landmark}</p>
                <div className="bg-cream rounded-lg p-3 flex flex-col gap-1">
                  {o.order_items.map((item) => (
                    <p key={item.id}>
                      Product × {item.quantity} — {item.unit_price_lyd} د.ل each
                    </p>
                  ))}
                  <div className="flex justify-between border-t border-hairline mt-1 pt-1">
                    <span>Subtotal</span>
                    <span>{o.subtotal_lyd} د.ل</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery</span>
                    <span>{o.delivery_fee_lyd} د.ل</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
