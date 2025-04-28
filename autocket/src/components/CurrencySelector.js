import React, { useEffect, useState } from 'react';
import './CurrencySelector.css';

const CURRENCIES = [
  { code: 'TRY', label: 'TL' },
  { code: 'USD', label: 'USD' },
  { code: 'EUR', label: 'EUR' },
  { code: 'GBP', label: 'GBP' },
  { code: 'JPY', label: 'JPY' },
];

export default function CurrencySelector({ currency, setCurrency, rates }) {
  // Sync currency/rates to localStorage for cross-tab and detail page
  useEffect(() => {
    localStorage.setItem('currency', currency);
  }, [currency]);
  useEffect(() => {
    if (rates && Object.keys(rates).length > 0) {
      localStorage.setItem('rates', JSON.stringify(rates));
    }
  }, [rates]);

  return (
    <div className="currency-selector-fixed">
      <select
        value={currency}
        onChange={e => setCurrency(e.target.value)}
        className="currency-select"
      >
        {CURRENCIES.map(cur => (
          <option key={cur.code} value={cur.code}>{cur.label}</option>
        ))}
      </select>
    </div>
  );
}
