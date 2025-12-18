export const formatCurrency = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) return 'N/A';
  const n = Math.abs(amount);
  if (n >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(amount / 1_000).toFixed(0)}k`;
  return `$${amount.toFixed(0)}`;
};