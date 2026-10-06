'use client';

import React from 'react';

export interface PropertyPriceTagProps {
  basePrice: number;
  originalPrice?: number;
  priceUnit?: string;
  currencySymbol?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_STYLES = {
  sm: { price: 'text-sm font-bold', unit: 'text-xs text-gray-400' },
  md: { price: 'font-bold font-tabular text-gray-900 text-body-lg', unit: 'text-caption font-normal text-gray-400' },
  lg: { price: 'text-xl font-bold font-tabular text-gray-900', unit: 'text-sm font-normal text-gray-500' },
};

export function PropertyPriceTag({
  basePrice,
  originalPrice,
  priceUnit = '/night',
  currencySymbol = '₹',
  size = 'md',
  className = '',
}: PropertyPriceTagProps) {
  const formattedPrice = `${currencySymbol}${Math.round(basePrice || 0).toLocaleString('en-IN')}`;
  const formattedOriginal = originalPrice
    ? `${currencySymbol}${Math.round(originalPrice).toLocaleString('en-IN')}`
    : null;

  return (
    <div className={`flex items-baseline gap-1 ${className}`}>
      {formattedOriginal && (
        <span className="text-caption line-through text-neutral-400 font-tabular mr-1">
          {formattedOriginal}
        </span>
      )}
      <span className={SIZE_STYLES[size].price}>
        {formattedPrice}
      </span>
      <span className={SIZE_STYLES[size].unit}>
        {priceUnit}
      </span>
    </div>
  );
}
