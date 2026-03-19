import type { Insight } from '../types';

interface InsightCardsProps {
  insights: Insight[];
}

export default function InsightCards({ insights }: InsightCardsProps) {
  if (insights.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">
          인사이트
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">
          현재 기간에 특이 패턴이 감지되지 않았습니다
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">
        인사이트
      </h2>
      <div className="flex flex-col gap-3">
        {insights.map((insight, idx) => {
          const isIncrease = insight.direction === 'increase';
          const borderColor = isIncrease
            ? 'border-blue-400 dark:border-blue-500'
            : 'border-orange-400 dark:border-orange-500';
          const badgeColor = isIncrease
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
            : 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
          const dirLabel = isIncrease ? '▲ 증가' : '▼ 감소';

          return (
            <div
              key={idx}
              className={`flex items-start gap-3 p-4 rounded-lg border-l-4 bg-gray-50 dark:bg-gray-700 ${borderColor}`}
            >
              <span className={`text-xs font-semibold px-2 py-1 rounded whitespace-nowrap ${badgeColor}`}>
                {dirLabel}
              </span>
              <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
                {insight.message}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
