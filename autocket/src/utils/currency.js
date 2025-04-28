// Utility to fetch and cache live currency rates
export async function fetchRates() {
  const API = 'https://api.exchangerate.host/latest?base=TRY&apikey=cb209632eb976311ed0378497b2ec8f2';
  const res = await fetch(API);
  if (!res.ok) throw new Error('Failed to fetch currency rates');
  const data = await res.json();
  // Always include TRY as 1
  return { TRY: 1, ...data.rates };
}

export function convertPrice(amount, from, to, rates) {
  if (!rates || !rates[from] || !rates[to]) return amount;
  // Convert to base TRY, then to target
  const amountInTry = amount / rates[from];
  return amountInTry * rates[to];
}
