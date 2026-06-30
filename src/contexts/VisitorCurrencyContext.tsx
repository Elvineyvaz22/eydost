import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type DisplayCurrency = 'USD' | 'AZN';

const AZN_PER_USD = 1.7;

type VisitorCurrencyContextValue = {
  country: string | null;
  currency: DisplayCurrency;
  isLoading: boolean;
};

const VisitorCurrencyContext = createContext<VisitorCurrencyContextValue>({
  country: null,
  currency: 'USD',
  isLoading: true,
});

export function VisitorCurrencyProvider({ children }: { children: ReactNode }) {
  const [country, setCountry] = useState<string | null>(() => {
    if (typeof sessionStorage === 'undefined') return null;
    return sessionStorage.getItem('eydost_visitor_country');
  });
  const [isLoading, setIsLoading] = useState(!country);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/geo-country', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (cancelled) return;
        const nextCountry =
          typeof payload?.country === 'string' && payload.country.length === 2
            ? payload.country.toUpperCase()
            : null;
        setCountry(nextCountry);
        if (nextCountry && typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('eydost_visitor_country', nextCountry);
        }
      })
      .catch(() => {
        if (!cancelled) setCountry(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({
      country,
      currency: country === 'AZ' ? 'AZN' : 'USD',
      isLoading,
    }),
    [country, isLoading],
  );

  return <VisitorCurrencyContext.Provider value={value}>{children}</VisitorCurrencyContext.Provider>;
}

export function useVisitorCurrency() {
  return useContext(VisitorCurrencyContext);
}

export function formatDisplayMoney(amount: number, currency: DisplayCurrency): string {
  if (!Number.isFinite(amount)) return currency === 'AZN' ? '₼0.00' : '$0.00';
  return currency === 'AZN' ? `₼${amount.toFixed(2)}` : `$${amount.toFixed(2)}`;
}

export function formatUsdForVisitor(usdAmount: number, currency: DisplayCurrency): string {
  const amount = currency === 'AZN' ? usdAmount * AZN_PER_USD : usdAmount;
  return formatDisplayMoney(amount, currency);
}

export function formatPriceStringForVisitor(price: string, currency: DisplayCurrency): string {
  const amount = Number((price || '').replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(amount)) return price;
  const isAzn = price.includes('₼') || /\bAZN\b/i.test(price);
  const usdAmount = isAzn ? amount / AZN_PER_USD : amount;
  return formatUsdForVisitor(usdAmount, currency);
}

export function formatMinorForVisitor(
  sellMinor: number,
  sourceCurrency: string | undefined,
  displayCurrency: DisplayCurrency,
): string {
  const amount = sellMinor / 10000;
  const source = (sourceCurrency || 'AZN').toUpperCase();
  const usdAmount = source === 'AZN' ? amount / AZN_PER_USD : amount;
  return formatUsdForVisitor(usdAmount, displayCurrency);
}
