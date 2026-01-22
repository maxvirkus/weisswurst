export function formatEuro(amount: number): string {
  return amount.toLocaleString('de-DE', {
    style: 'currency',
    currency: 'EUR',
  });
}

export function formatNumber(num: number): string {
  return num.toLocaleString('de-DE');
}

export function parseGermanNumber(input: string): number {
  // Replace German comma with dot for parsing
  const normalized = input.replace(',', '.');
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
}
