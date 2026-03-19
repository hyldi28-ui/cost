import React from 'react';

interface KPICardProps {
  label: string;
  primaryValue: number;
  compareValue?: number;
  momRate?: number | null;
  yoyRate?: number | null;
}

function formatKRW(value: number): string {
  return value.toLocaleString('ko-KR') + '원';
}

function formatRate(rate: number): string {
  const sign = rate > 0 ? '+' : '';
  return `${sign}${(rate * 100).toFixed(1)}%`;
}

function rateColor(rate: number): string {
  if (rate > 0) return 'text-blue-500 dark:text-blue-400';
  if (rate < 0) return 'text-orange-500 dark:text-orange-400';
  return 'text-gray-500 dark:text-gray-400';
}

const KPICard: React.FC<KPICardProps> = ({
  label,
  primaryValue,
  compareValue,
  momRate,
  yoyRate,
}) => {
  const hasCompare = compareValue !== undefined;
  const absDiff = hasCompare ? primaryValue - compareValue! : null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 flex flex-col gap-2 min-w-[180px]">
      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>

      <span className="text-2xl font-bold text-gray-900 dark:text-white">
        {formatKRW(primaryValue)}
      </span>

      {/* Compare value row */}
      {hasCompare && (
        <div className="flex flex-col gap-0.5 text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            비교: {formatKRW(compareValue!)}
          </span>
          {absDiff !== null && (
            <span className={rateColor(absDiff)}>
              차이: {absDiff > 0 ? '+' : ''}{formatKRW(absDiff)}
            </span>
          )}
        </div>
      )}

      {/* MoM rate */}
      {momRate !== undefined && (
        <div className="text-sm">
          <span className="text-gray-500 dark:text-gray-400 mr-1">MoM</span>
          {momRate === null ? (
            <span className="text-gray-400 dark:text-gray-500">비교 데이터 없음</span>
          ) : (
            <span className={rateColor(momRate)}>{formatRate(momRate)}</span>
          )}
        </div>
      )}

      {/* YoY rate */}
      {yoyRate !== undefined && (
        <div className="text-sm">
          <span className="text-gray-500 dark:text-gray-400 mr-1">YoY</span>
          {yoyRate === null ? (
            <span className="text-gray-400 dark:text-gray-500">비교 데이터 없음</span>
          ) : (
            <span className={rateColor(yoyRate)}>{formatRate(yoyRate)}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default KPICard;
