// Utility to fetch and cache live currency rates
export async function fetchRates() {
  const API = 'https://api.exchangerate.host/latest?base=TRY'; // Free, no key required
  const res = await fetch(API);
  if (!res.ok) throw new Error('Failed to fetch currency rates');
  const data = await res.json();
  return data.rates;
}

export function convertPrice(amount, from, to, rates) {
  if (from === to) return amount;
  if (!rates || !rates[to]) return amount;
  return amount * rates[to];
}
