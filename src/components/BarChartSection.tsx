import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useDashboardStore } from '../store/dashboardStore';
import { aggregateByDimension } from '../lib/aggregator';

type Dimension = 'account' | 'platform' | 'category';

const TABS: { key: Dimension; label: string }[] = [
  { key: 'account', label: '계정' },
  { key: 'platform', label: '플랫폼' },
  { key: 'category', label: '카테고리' },
];

function formatAmount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return value.toLocaleString();
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { primaryShare?: number; compareShare?: number } }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <p className="mb-1 text-sm font-semibold text-gray-700 dark:text-gray-200">{label}</p>
      {payload.map((entry) => {
        const share =
          entry.name === '기준 기간'
            ? entry.payload.primaryShare
            : entry.payload.compareShare;
        return (
          <div key={entry.name} className="mt-1">
            <p
              className="text-sm"
              style={{ color: entry.name === '기준 기간' ? '#3b82f6' : '#f97316' }}
            >
              {entry.name}: {entry.value.toLocaleString()}원
            </p>
            {share != null && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                전체 대비: {(share * 100).toFixed(1)}%
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

const BarChartSection: React.FC = () => {
  const [activeDimension, setActiveDimension] = useState<Dimension>('account');

  const records = useDashboardStore((s) => s.records);
  const filterState = useDashboardStore((s) => s.filterState);

  const { chartData, hasCompare } = useMemo(() => {
    const primaryData = aggregateByDimension(records, filterState, activeDimension);

    const hasCompare = filterState.compareRange != null;
    const compareData = hasCompare
      ? aggregateByDimension(
          records,
          { ...filterState, primaryRange: filterState.compareRange! },
          activeDimension
        )
      : [];

    const compareMap = new Map(compareData.map((d) => [d.dimension, d]));

    const chartData = primaryData.map((p) => {
      const c = compareMap.get(p.dimension);
      return {
        label: p.dimension,
        primary: p.amount,
        primaryShare: p.share,
        compare: c?.amount ?? 0,
        compareShare: c?.share ?? 0,
      };
    });

    // Also include compare-only items
    const primaryLabels = new Set(primaryData.map((p) => p.dimension));
    for (const c of compareData) {
      if (!primaryLabels.has(c.dimension)) {
        chartData.push({
          label: c.dimension,
          primary: 0,
          primaryShare: 0,
          compare: c.amount,
          compareShare: c.share,
        });
      }
    }

    // Sort by primary amount descending
    chartData.sort((a, b) => b.primary - a.primary);

    return { chartData, hasCompare };
  }, [records, filterState, activeDimension]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      {/* Tab bar */}
      <div className="mb-4 flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-700">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveDimension(tab.key)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-200 ${
              activeDimension === tab.key
                ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Chart or empty state */}
      {chartData.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <p className="text-sm text-gray-400 dark:text-gray-500">표시할 데이터가 없습니다</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              interval={0}
              angle={chartData.length > 5 ? -30 : 0}
              textAnchor={chartData.length > 5 ? 'end' : 'middle'}
              height={chartData.length > 5 ? 60 : 30}
            />
            <YAxis
              tickFormatter={formatAmount}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
              width={56}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
            />
            <Bar
              dataKey="primary"
              name="기준 기간"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              animationDuration={250}
            />
            {hasCompare && (
              <Bar
                dataKey="compare"
                name="비교 기간"
                fill="#f97316"
                radius={[4, 4, 0, 0]}
                animationDuration={250}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default BarChartSection;
