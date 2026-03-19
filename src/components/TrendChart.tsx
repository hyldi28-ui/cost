import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { MonthlyPoint } from '../types';

interface TrendChartProps {
  primarySeries: MonthlyPoint[];
  compareSeries?: MonthlyPoint[];
}

function formatAmount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return value.toLocaleString();
}

/**
 * 동기간 비교 모드: X축을 상대 순서(1월차, 2월차...)로 맞춰 두 라인을 겹쳐 표시.
 * primarySeries[0]과 compareSeries[0]을 같은 X 위치에 놓는다.
 */
function buildOverlayData(
  primarySeries: MonthlyPoint[],
  compareSeries: MonthlyPoint[],
): Array<{ label: string; primary: number; compare: number; primaryMonth: string; compareMonth: string }> {
  const len = Math.max(primarySeries.length, compareSeries.length);
  return Array.from({ length: len }, (_, i) => {
    const p = primarySeries[i];
    const c = compareSeries[i];
    // X축 레이블: "1월", "2월" ...
    const label = `${i + 1}월`;
    return {
      label,
      primary: p?.amount ?? 0,
      compare: c?.amount ?? 0,
      primaryMonth: p?.month ?? '',
      compareMonth: c?.month ?? '',
    };
  });
}

/** 절대 날짜 모드 (compare 없을 때) */
function buildAbsoluteData(
  primarySeries: MonthlyPoint[],
): Array<{ month: string; primary: number }> {
  return primarySeries.map((p) => ({ month: p.month, primary: p.amount }));
}

interface OverlayTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { primaryMonth: string; compareMonth: string } }>;
  label?: string;
}

function OverlayTooltip({ active, payload, label }: OverlayTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const primaryEntry = payload.find((p) => p.name === '기준 기간');
  const compareEntry = payload.find((p) => p.name === '비교 기간');
  const primaryAmount = primaryEntry?.value ?? 0;
  const compareAmount = compareEntry?.value ?? 0;
  const changeRate = compareAmount !== 0 ? ((primaryAmount - compareAmount) / compareAmount) * 100 : null;
  const meta = payload[0]?.payload;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800 text-sm">
      <p className="mb-1 font-semibold text-gray-700 dark:text-gray-200">{label}</p>
      {primaryEntry && (
        <p className="text-blue-600 dark:text-blue-400">
          기준 ({meta?.primaryMonth}): {primaryAmount.toLocaleString()}원
        </p>
      )}
      {compareEntry && (
        <p className="text-orange-500 dark:text-orange-400">
          비교 ({meta?.compareMonth}): {compareAmount.toLocaleString()}원
        </p>
      )}
      {changeRate !== null && (
        <p className={`mt-1 text-xs font-medium ${changeRate >= 0 ? 'text-blue-500' : 'text-orange-500'}`}>
          변화율: {changeRate >= 0 ? '+' : ''}{changeRate.toFixed(1)}%
        </p>
      )}
    </div>
  );
}

interface SimpleTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
  label?: string;
}

function SimpleTooltip({ active, payload, label }: SimpleTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800 text-sm">
      <p className="mb-1 font-semibold text-gray-700 dark:text-gray-200">{label}</p>
      <p className="text-blue-600 dark:text-blue-400">{payload[0].value.toLocaleString()}원</p>
    </div>
  );
}

export default function TrendChart({ primarySeries, compareSeries }: TrendChartProps) {
  if (primarySeries.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <p className="text-sm text-gray-400 dark:text-gray-500">표시할 데이터가 없습니다</p>
      </div>
    );
  }

  const hasCompare = compareSeries && compareSeries.length > 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <ResponsiveContainer width="100%" height={300}>
        {hasCompare ? (
          // 동기간 비교 모드: X축을 상대 순서로 겹쳐 표시
          <LineChart
            data={buildOverlayData(primarySeries, compareSeries)}
            margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
            <YAxis tickFormatter={formatAmount} tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={false} width={56} />
            <Tooltip content={<OverlayTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
            <Line
              type="monotone" dataKey="primary" name="기준 기간"
              stroke="#3b82f6" strokeWidth={2}
              dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }}
              animationDuration={250}
            />
            <Line
              type="monotone" dataKey="compare" name="비교 기간"
              stroke="#f97316" strokeWidth={2} strokeDasharray="6 3"
              dot={{ r: 4, fill: '#f97316' }} activeDot={{ r: 6 }}
              animationDuration={250}
            />
          </LineChart>
        ) : (
          // 단일 기간 모드
          <LineChart
            data={buildAbsoluteData(primarySeries)}
            margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
            <YAxis tickFormatter={formatAmount} tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={false} width={56} />
            <Tooltip content={<SimpleTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
            <Line
              type="monotone" dataKey="primary" name="기준 기간"
              stroke="#3b82f6" strokeWidth={2}
              dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }}
              animationDuration={250}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
