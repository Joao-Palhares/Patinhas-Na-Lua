import { Decimal } from "@prisma/client/runtime/library";

/**
 * Safely converts a Prisma Decimal to a JavaScript number.
 * Handles null/undefined values gracefully.
 */
export function toNumber(value: Decimal | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  return value.toNumber();
}

/**
 * Formats a number as currency (EUR)
 */
export function formatCurrency(value: number | Decimal | null | undefined): string {
  const num = toNumber(value);
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(num);
}

/**
 * Formats a number with fixed decimal places
 */
export function formatPrice(value: number | Decimal | null | undefined, decimals: number = 2): string {
  const num = toNumber(value);
  return num.toFixed(decimals) + "€";
}

/**
 * Serializes a service/entity with Decimal prices to plain objects
 * Safe for passing to client components
 */
export function serializeDecimalFields<T extends Record<string, any>>(
  obj: T,
  decimalFields: (keyof T)[]
): T {
  const result = { ...obj };
  for (const field of decimalFields) {
    if (result[field] !== undefined && result[field] !== null) {
      // @ts-ignore
      result[field] = toNumber(result[field]);
    }
  }
  return result;
}
