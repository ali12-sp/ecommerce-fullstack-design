export function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

export function formatPrice(price: number) {
  return `$${price.toFixed(2)}`;
}

export function calculateOrderSummary(subtotal: number, couponCode = "") {
  const normalizedCoupon = couponCode.trim().toUpperCase();
  const discount = normalizedCoupon === "SAVE10" ? roundCurrency(subtotal * 0.1) : 0;
  const shippingFee = subtotal >= 100 ? 0 : subtotal > 0 ? 15 : 0;
  const tax = roundCurrency((subtotal - discount) * 0.08);
  const total = roundCurrency(subtotal - discount + shippingFee + tax);

  return {
    normalizedCoupon,
    discount,
    shippingFee,
    tax,
    total
  };
}
