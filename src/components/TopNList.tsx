import { useDashboardStore } from '../store/dashboardStore';
import type { TopNItem } from '../types';

interface TopNListProps {
  items: TopNItem[];
  n?: number;
}

function formatAmount(value: number): string {
  const sign = value >= 0 ? '+' : '-';
  const abs = Math.abs(value);
  if (abs >= 100_000_000) {
    return `${sign}${(abs / 100_000_000).toFixed(1)}억`;
  }
  if (abs >= 10_000) {
    return `${sign}${(abs / 10_000).toFixed(0)}만`;
  }
  return `${sign}${abs.toLocaleString()}`;
}

function formatRate(rate: number): string {
  if (!isFinite(rate)) return '신규';
  const sign = rate >= 0 ? '+' : '';
  return `${sign}${(rate * 100).toFixed(1)}%`;
}

interface ItemRowProps {
  item: TopNItem;
  isIncrease: boolean;
}

function ItemRow({ item, isIncrease }: ItemRowProps) {
  const colorClass = isIncrease
    ? 'text-blue-600 dark:text-blue-400'
    : 'text-orange-500 dark:text-orange-400';

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[50%]">
        {item.label}
      </span>
      <div className="flex gap-3 text-sm font-medium">
        <span className={colorClass}>{formatAmount(item.absoluteDiff)}</span>
        <span className={colorClass}>{formatRate(item.changeRate)}</span>
      </div>
    </div>
  );
}

export default function TopNList({ items, n = 5 }: TopNListProps) {
  const compareRange = useDashboardStore((s) => s.filterState.compareRange);

  if (items.length === 0) {
    const message = compareRange
      ? '변화 항목이 없습니다'
      : '비교 기간을 설정하면 TOP 5 변화 항목을 확인할 수 있습니다';

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">
          TOP {n} 변화 항목
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">
          {message}
        </p>
      </div>
    );
  }

  const increases = items.filter((i) => i.changeRate > 0).slice(0, n);
  const decreases = items.filter((i) => i.changeRate < 0).slice(0, n);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">
        TOP {n} 변화 항목
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 증가 항목 */}
        <div>
          <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">
            ▲ 증가 항목
          </h3>
          {increases.length > 0 ? (
            increases.map((item) => (
              <ItemRow key={item.label} item={item} isIncrease={true} />
            ))
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-2">증가 항목 없음</p>
          )}
        </div>

        {/* 감소 항목 */}
        <div>
          <h3 className="text-sm font-medium text-orange-500 dark:text-orange-400 mb-2">
            ▼ 감소 항목
          </h3>
          {decreases.length > 0 ? (
            decreases.map((item) => (
              <ItemRow key={item.label} item={item} isIncrease={false} />
            ))
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-2">감소 항목 없음</p>
          )}
        </div>
      </div>
    </div>
  );
}
