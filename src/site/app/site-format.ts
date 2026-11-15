export function formatSiteRubles(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

// Цена товара с пометкой "От", когда у вариантов разные цены и вариант ещё не выбран.
export function formatSitePriceFrom(value: number, hasRange: boolean) {
  return `${hasRange ? "От " : ""}${formatSiteRubles(value)} ₽`;
}
