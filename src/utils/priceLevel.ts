const PRICE_LEVEL_MAP: Record<string, string> = {
  PRICE_LEVEL_INEXPENSIVE: "$",
  PRICE_LEVEL_MODERATE: "$$",
  PRICE_LEVEL_EXPENSIVE: "$$$",
  PRICE_LEVEL_VERY_EXPENSIVE: "$$$$",
};

export function formatPriceLevel(priceLevel: string | undefined): string | undefined {
  if (!priceLevel) return undefined;
  return PRICE_LEVEL_MAP[priceLevel];
}
