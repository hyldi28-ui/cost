import React from 'react';

interface KPICardProps {
  label: string;
  primaryValue: number;
  isCompareCard?: boolean;
  primaryTotal?: number;
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

const KPICard: React.FC<KPICardProps> = ({ label, primaryValue, isCompareCard, primaryTotal }) => {
  const absDiff = isCompareCard && primaryTotal !== undefined ? primaryTotal - primaryValue : null;
  const diffRate = absDiff !== null && primaryValue !== 0 ? absDiff / primaryValue : null;

  const cardClass = isCompareCard
    ? 'bg-gray-100 dark:bg-gray-700/60 rounded-xl shadow p-5 flex flex-col gap-2 min-w-[180px] border border-gray-200 dark:border-gray-600'
    : 'bg-white dark:bg-gray-800 rounded-xl shadow p-5 flex flex-col gap-2 min-w-[180px]';

  return (
    <div className={cardClass}>
      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-2xl font-bold text-gray-900 dark:text-white">
        {formatKRW(primaryValue)}
      </span>
      {isCompareCard && absDiff !== null && diffRate !== null && (
        <div className="text-sm mt-1">
          <span className="text-gray-500 dark:text-gray-400 mr-1">차이</span>
          <span className={rateColor(absDiff)}>
            {absDiff > 0 ? '+' : ''}{formatKRW(absDiff)}
          </span>
          <span className={`ml-1 ${rateColor(absDiff)}`}>
            ({formatRate(diffRate)})
          </span>
        </div>
      )}
    </div>
  );
};

export default KPICard;
