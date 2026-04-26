import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "TRY") {
  const currencyCode = currency === "TL" ? "TRY" : currency;
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: currencyCode,
  }).format(amount);
}
