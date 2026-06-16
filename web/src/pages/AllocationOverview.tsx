import React, { useEffect, useMemo, useState } from 'react';
import client from '../api/client';

interface AllocationItem {
  group: string;
  totalAmount: number;
  recordCount: number;
}

interface AllocationSummaryResponse {
  baseCurrency: string | null;
  items: AllocationItem[];
  warnings?: string[];
}

interface AllocationOverviewProps {
  currentOrg: string;
}

const DATE_RANGE = {
  from: '2026-03-01',
  to: '2026-03-31',
};

export function AllocationOverview({ currentOrg }: AllocationOverviewProps) {
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [summary, setSummary] = useState<AllocationSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentOrg) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    client
      .get<AllocationSummaryResponse>('/allocation/summary', {
        params: {
          from: DATE_RANGE.from,
          to: DATE_RANGE.to,
          ...(baseCurrency === 'original' ? {} : { baseCurrency }),
        },
      })
      .then((res) => {
        if (!cancelled) setSummary(res.data);
      })
      .catch((err) => {
        if (!cancelled) {
          setSummary(null);
          setError(err.response?.data?.error?.message || 'Failed to load allocation summary');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentOrg, baseCurrency]);

  const totals = useMemo(() => {
    const items = summary?.items ?? [];
    return items.reduce(
      (acc, item) => ({
        amount: acc.amount + item.totalAmount,
        records: acc.records + item.recordCount,
      }),
      { amount: 0, records: 0 }
    );
  }, [summary]);

  const currencyLabel = summary?.baseCurrency ?? 'original';
  const hasRows = (summary?.items ?? []).some((item) => item.recordCount > 0);

  return (
    <section style={styles.surface}>
      <div style={styles.titleBar}>
        <div>
          <h1 style={styles.title}>Allocation Overview</h1>
          <div style={styles.orgLine}>{currentOrg || 'No customer org selected'}</div>
        </div>

        <label style={styles.control}>
          <span style={styles.label}>Base Currency</span>
          <select
            value={baseCurrency}
            onChange={(event) => setBaseCurrency(event.target.value)}
            style={styles.select}
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="original">Original</option>
          </select>
        </label>
      </div>

      <div style={styles.metaRow}>
        <span>{DATE_RANGE.from}</span>
        <span>to</span>
        <span>{DATE_RANGE.to}</span>
      </div>

      {loading && <div style={styles.state}>Loading allocation summary...</div>}

      {!loading && error && <div style={styles.error}>{error}</div>}

      {!loading && !error && summary && !hasRows && (
        <div style={styles.state}>No allocation records found.</div>
      )}

      {!loading && !error && summary && hasRows && (
        <div style={styles.tableWrap}>
          {summary.warnings && summary.warnings.length > 0 && (
            <div style={styles.warningList}>
              {summary.warnings.map((warning) => (
                <div key={warning}>{warning}</div>
              ))}
            </div>
          )}
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.thLeft}>Group</th>
                <th style={styles.thRight}>Amount</th>
                <th style={styles.thRight}>Records</th>
              </tr>
            </thead>
            <tbody>
              {summary.items.map((item) => (
                <tr key={item.group}>
                  <td style={styles.tdLeft}>{item.group}</td>
                  <td style={styles.tdRight}>{formatAmount(item.totalAmount, currencyLabel)}</td>
                  <td style={styles.tdRight}>{item.recordCount}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td style={styles.totalLabel}>Total</td>
                <td style={styles.totalValue}>{formatAmount(totals.amount, currencyLabel)}</td>
                <td style={styles.totalValue}>{totals.records}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
}

function formatAmount(amount: number, currency: string) {
  if (currency === 'original') {
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

const styles: Record<string, React.CSSProperties> = {
  surface: {
    maxWidth: 920,
    margin: '0 auto',
    background: '#fff',
    border: '1px solid #d9dee7',
    borderRadius: 8,
    overflow: 'hidden',
  },
  titleBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    padding: '20px 24px',
    borderBottom: '1px solid #e7ebf0',
    flexWrap: 'wrap',
  },
  title: {
    margin: 0,
    fontSize: 20,
    lineHeight: 1.2,
    fontWeight: 700,
    color: '#172033',
  },
  orgLine: {
    marginTop: 6,
    fontSize: 13,
    color: '#5e6b7c',
    overflowWrap: 'anywhere',
  },
  control: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: '#3c4758',
  },
  select: {
    minWidth: 116,
    border: '1px solid #b9c1ce',
    borderRadius: 4,
    padding: '7px 10px',
    fontSize: 14,
    background: '#fff',
    color: '#172033',
  },
  metaRow: {
    display: 'flex',
    gap: 8,
    padding: '12px 24px',
    borderBottom: '1px solid #e7ebf0',
    background: '#f7f8fa',
    fontSize: 13,
    color: '#526071',
  },
  tableWrap: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    tableLayout: 'fixed',
  },
  thLeft: {
    padding: '12px 24px',
    textAlign: 'left',
    fontSize: 12,
    textTransform: 'uppercase',
    color: '#657185',
    borderBottom: '1px solid #e7ebf0',
  },
  thRight: {
    padding: '12px 24px',
    textAlign: 'right',
    fontSize: 12,
    textTransform: 'uppercase',
    color: '#657185',
    borderBottom: '1px solid #e7ebf0',
  },
  tdLeft: {
    padding: '14px 24px',
    borderBottom: '1px solid #edf0f4',
    color: '#1e293b',
    overflowWrap: 'anywhere',
  },
  tdRight: {
    padding: '14px 24px',
    borderBottom: '1px solid #edf0f4',
    textAlign: 'right',
    color: '#1e293b',
    fontVariantNumeric: 'tabular-nums',
  },
  totalLabel: {
    padding: '16px 24px',
    textAlign: 'right',
    fontWeight: 700,
    color: '#172033',
  },
  totalValue: {
    padding: '16px 24px',
    textAlign: 'right',
    fontWeight: 700,
    color: '#172033',
    fontVariantNumeric: 'tabular-nums',
  },
  state: {
    padding: 32,
    color: '#526071',
  },
  error: {
    margin: 24,
    padding: 14,
    border: '1px solid #f1b8b8',
    borderRadius: 6,
    background: '#fff5f5',
    color: '#9f1d1d',
  },
  warningList: {
    margin: 24,
    marginBottom: 0,
    padding: 14,
    border: '1px solid #e4c35b',
    borderRadius: 6,
    background: '#fff9db',
    color: '#6b5200',
    fontSize: 13,
    lineHeight: 1.5,
  },
};
