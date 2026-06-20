export const currencies = [
  { code: "GBP", label: "British Pound" },
  { code: "INR", label: "Indian Rupee" },
  { code: "USD", label: "US Dollar" },
  { code: "EUR", label: "Euro" },
  { code: "AED", label: "UAE Dirham" },
  { code: "CAD", label: "Canadian Dollar" },
  { code: "AUD", label: "Australian Dollar" },
];

export function currencyLabel(code) {
  const currency = currencies.find((item) => item.code === code);
  return currency ? `${currency.code} - ${currency.label}` : code || "GBP";
}

export function formatMoney(value, currencyCode = "GBP") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currencyCode || "GBP",
  }).format(Number(value ?? 0));
}
