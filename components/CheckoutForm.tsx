"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "./providers";
import { DELIVERY_AREAS, PICKUP_BRANCHES, DeliveryArea, PickupBranch } from "@/lib/delivery-data";
import { QUICK_AREA_IDS } from "@/lib/constants";
import { CartLine, FulfillmentType } from "@/lib/types";
import { placeOrder, PlaceOrderResult } from "@/app/actions";

function SearchPicker<T extends { id: string; nameAr: string; nameEn: string }>({
  items,
  getFee,
  selectedId,
  onSelect,
  placeholder,
  lang
}: {
  items: T[];
  getFee: (item: T) => number;
  selectedId: string;
  onSelect: (item: T) => void;
  placeholder: string;
  lang: "ar" | "en";
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selected = items.find((i) => i.id === selectedId) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.nameAr.includes(query.trim()) || i.nameEn.toLowerCase().includes(q));
  }, [items, query]);

  return (
    <div className="relative">
      <input
        type="text"
        value={selected && !open ? (lang === "en" ? selected.nameEn : selected.nameAr) : query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className="w-full border border-hairline rounded-lg p-2.5 text-base bg-white"
      />
      {open && (
        <div className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-hairline rounded-lg shadow-sm">
          {filtered.length === 0 && <p className="p-3 text-sm opacity-60">—</p>}
          {filtered.map((item) => (
            <button
              type="button"
              key={item.id}
              onMouseDown={() => {
                onSelect(item);
                setQuery("");
                setOpen(false);
              }}
              className="w-full text-start px-3 py-2 text-sm hover:bg-stone flex justify-between gap-2"
            >
              <span>{lang === "en" ? item.nameEn : item.nameAr}</span>
              <span className="opacity-60 shrink-0">+{getFee(item)} د.ل</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CheckoutForm({
  lines,
  subtotal,
  onBack,
  onSuccess
}: {
  lines: CartLine[];
  subtotal: number;
  onBack: () => void;
  onSuccess: (result: Extract<PlaceOrderResult, { ok: true }>) => void;
}) {
  const { lang, t } = useLanguage();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [fulfillment, setFulfillment] = useState<FulfillmentType>("delivery");
  const [areaId, setAreaId] = useState("");
  const [femaleCourier, setFemaleCourier] = useState(false);
  const [branchId, setBranchId] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const area = DELIVERY_AREAS.find((a) => a.id === areaId) ?? null;
  const branch = PICKUP_BRANCHES.find((b) => b.id === branchId) ?? null;

  const fee =
    fulfillment === "pickup"
      ? branch?.fee ?? 0
      : femaleCourier && area?.womenFee != null
        ? area.womenFee
        : area?.standardFee ?? 0;
  const total = subtotal + fee;

  const switchFulfillment = (f: FulfillmentType) => {
    setFulfillment(f);
    setErrors({});
  };

  const submit = async () => {
    setSubmitting(true);
    const res = await placeOrder({
      name,
      phone,
      fulfillment,
      areaId: fulfillment === "delivery" ? areaId : undefined,
      femaleCourier: fulfillment === "delivery" ? femaleCourier : false,
      branchId: fulfillment === "pickup" ? branchId : undefined,
      address: fulfillment === "delivery" ? address : "",
      landmark,
      lines
    });
    setSubmitting(false);

    if (!res.ok) {
      const fieldErrors: Record<string, string> = {};
      if (res.error === "name") fieldErrors.name = t.errName;
      if (res.error === "phone") fieldErrors.phone = t.errPhone;
      if (res.error === "area") fieldErrors.area = t.errArea;
      if (res.error === "branch") fieldErrors.branch = t.errBranch;
      if (res.error === "address") fieldErrors.address = t.errAddr;
      setErrors(fieldErrors);
      return;
    }
    onSuccess(res);
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.fullName}
          className="w-full border border-hairline rounded-lg p-2.5 text-base bg-white"
        />
        {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
      </div>
      <div>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={`${t.phone} — ${t.phoneHint}`}
          className="w-full border border-hairline rounded-lg p-2.5 text-base bg-white"
        />
        {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
      </div>

      <div>
        <p className="text-sm mb-2 opacity-70">{t.fulfillmentLabel}</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => switchFulfillment("delivery")}
            className={
              "text-sm px-3 py-2 rounded-lg border " +
              (fulfillment === "delivery" ? "bg-charcoal text-cream border-charcoal" : "border-hairline")
            }
          >
            {t.homeDelivery}
          </button>
          <button
            type="button"
            onClick={() => switchFulfillment("pickup")}
            className={
              "text-sm px-3 py-2 rounded-lg border " +
              (fulfillment === "pickup" ? "bg-charcoal text-cream border-charcoal" : "border-hairline")
            }
          >
            {t.branchPickup}
          </button>
        </div>
      </div>

      {fulfillment === "delivery" ? (
        <>
          <div className="flex gap-2 flex-wrap">
            {QUICK_AREA_IDS.map((id) => {
              const a = DELIVERY_AREAS.find((x) => x.id === id);
              if (!a) return null;
              return (
                <button
                  type="button"
                  key={a.id}
                  onClick={() => {
                    setAreaId(a.id);
                    setFemaleCourier(false);
                  }}
                  className={
                    "text-xs px-3 py-1.5 rounded-full border " +
                    (areaId === a.id ? "bg-charcoal text-cream border-charcoal" : "border-hairline hover:border-wine")
                  }
                >
                  {(lang === "en" ? a.nameEn : a.nameAr)} (+{a.standardFee} د.ل)
                </button>
              );
            })}
          </div>

          <SearchPicker
            items={DELIVERY_AREAS as DeliveryArea[]}
            getFee={(a) => a.standardFee}
            selectedId={areaId}
            onSelect={(a) => {
              setAreaId(a.id);
              setFemaleCourier(false);
            }}
            placeholder={t.areaSearchPlaceholder}
            lang={lang}
          />
          {errors.area && <p className="text-xs text-red-600 mt-1">{errors.area}</p>}

          {area && area.womenFee != null && (
            <label className="flex items-center gap-2 text-sm bg-stone border border-hairline rounded-lg p-3">
              <input type="checkbox" checked={femaleCourier} onChange={(e) => setFemaleCourier(e.target.checked)} />
              <span className="flex-1">{t.femaleCourier}</span>
              <span className="text-wine font-medium">+{area.womenFee} د.ل</span>
            </label>
          )}

          <div>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t.address}
              className="w-full border border-hairline rounded-lg p-2.5 text-base bg-white"
            />
            {errors.address && <p className="text-xs text-red-600 mt-1">{errors.address}</p>}
          </div>
        </>
      ) : (
        <>
          <SearchPicker
            items={PICKUP_BRANCHES as PickupBranch[]}
            getFee={(b) => b.fee}
            selectedId={branchId}
            onSelect={(b) => setBranchId(b.id)}
            placeholder={t.branchSearchPlaceholder}
            lang={lang}
          />
          {errors.branch && <p className="text-xs text-red-600 mt-1">{errors.branch}</p>}
        </>
      )}

      <input
        value={landmark}
        onChange={(e) => setLandmark(e.target.value)}
        placeholder={t.landmark}
        className="w-full border border-hairline rounded-lg p-2.5 text-base bg-white"
      />

      <div>
        <p className="text-sm mb-2 opacity-70">{t.payMethod}</p>
        <div className="bg-stone border border-wine/40 rounded-lg p-3 text-sm">{t.codBadge}</div>
      </div>

      <div className="border-t border-hairline pt-3 text-sm flex flex-col gap-1">
        <div className="flex justify-between">
          <span>{t.subtotal}</span>
          <span>{subtotal} د.ل</span>
        </div>
        <div className="flex justify-between">
          <span>{t.delivery}</span>
          <span>{fee} د.ل</span>
        </div>
        <div className="flex justify-between font-medium text-base">
          <span>{t.total}</span>
          <span>{total} د.ل</span>
        </div>
      </div>

      <button
        onClick={submit}
        disabled={submitting}
        className="w-full bg-charcoal text-cream rounded-lg py-2.5 hover:bg-wine transition-colors disabled:opacity-60"
      >
        {submitting ? t.placingOrder : t.place}
      </button>
      <button onClick={onBack} className="text-sm opacity-70 underline">
        {t.back}
      </button>
    </div>
  );
}
