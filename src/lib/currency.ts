const CURRENCY_SYMBOL = 'RM';
const LOCALE = 'ms-MY';

export function formatCurrency(amount: number): string {
  return `${CURRENCY_SYMBOL} ${amount.toLocaleString(LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatCurrencyCompact(amount: number): string {
  if (amount >= 1_000_000) {
    return `${CURRENCY_SYMBOL} ${(amount / 1_000_000).toFixed(1)}J`;
  }
  if (amount >= 1_000) {
    return `${CURRENCY_SYMBOL} ${(amount / 1_000).toFixed(1)}K`;
  }
  return formatCurrency(amount);
}
