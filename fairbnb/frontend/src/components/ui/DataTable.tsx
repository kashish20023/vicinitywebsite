'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

// ─── Column Definition ────────────────────────────────────────────────────────

export interface Column<T> {
  /** Column header label */
  header: string;
  /** Unique key for this column */
  key: string;
  /** Whether header & cell should be right-aligned */
  alignRight?: boolean;
  /** Render function for a row cell */
  render: (row: T) => React.ReactNode;
  /** Optional extra className on the <td> */
  cellClassName?: string;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  loadingMessage?: string;
  emptyIcon?: React.ReactNode;
  emptyTitle?: string;
  emptySubtitle?: string;
  className?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DataTable<T>({
  columns,
  data,
  rowKey,
  loading = false,
  loadingMessage = 'Loading data...',
  emptyIcon,
  emptyTitle = 'No results found',
  emptySubtitle = 'No records match your search.',
  className = '',
}: DataTableProps<T>) {
  return (
    <Card
      className={`border border-neutral-200 shadow-xs rounded-2xl overflow-hidden bg-white ${className}`}
    >
      <CardContent className="p-0">
        {loading ? (
          <div className="py-24 text-center text-neutral-400">
            <Loader2 className="w-8 h-8 animate-spin text-rose-500 mx-auto mb-3" />
            <p className="text-caption font-medium text-neutral-500">{loadingMessage}</p>
          </div>
        ) : data.length === 0 ? (
          <div className="p-16 text-center text-neutral-400">
            {emptyIcon && <div className="mb-2">{emptyIcon}</div>}
            <h3 className="font-semibold text-neutral-800 text-h4">{emptyTitle}</h3>
            <p className="text-caption text-neutral-500 mt-1">{emptySubtitle}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-caption whitespace-nowrap">
              <thead className="bg-neutral-50 text-neutral-500 text-overline font-semibold uppercase tracking-wider border-b border-neutral-200">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={`px-6 py-4 ${col.alignRight ? 'text-right' : ''}`}
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white text-neutral-900">
                {data.map((row) => (
                  <tr key={rowKey(row)} className="hover:bg-neutral-50/80 transition">
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-6 py-4 ${col.alignRight ? 'text-right relative' : ''} ${col.cellClassName ?? ''}`}
                      >
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
