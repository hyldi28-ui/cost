import React, { useMemo } from 'react';
import { useDashboardStore } from '../store/dashboardStore';
import { aggregateByMonth } from '../lib/aggregator';
import KPICard from './KPICard';

function calcMoM(agg: { month: string; amount: number }[]): number | null {
  if (agg.length < 2) return null;
  const last = agg[agg.length - 1].amount;
  const prev = agg[agg.length - 2].amount;
  if (prev === 0) return null;
  return (last - prev) / prev;
}

function calcYoY(agg: { month: string; amount: number }[]): number | null {
  if (agg.length === 0) return null;
  const lastEntry = agg[agg.length - 1];
  const lastMonth = lastEntry.month; // "YYYY-MM"
  const [year, month] = lastMonth.split('-');
  const prevYearMonth = `${parseInt(year) - 1}-${month}`;
  const prevEntry = agg.find((a) => a.month === prevYearMonth);
  if (!prevEntry || prevEntry.amount === 0) return null;
  return (lastEntry.amount - prevEntry.amount) / prevEntry.amount;
}

const KPISection: React.FC = () => {
  const records = useDashboardStore((s) => s.records);
  const filterState = useDashboardStore((s) => s.filterState);

  const { primaryAgg, compareAgg, totalPrimary, totalCompare, momRate, yoyRate } =
    useMemo(() => {
      const primaryAgg = aggregateByMonth(records, filterState);

      const compareAgg =
        filterState.compareRange
          ? aggregateByMonth(records, {
              ...filterState,
              primaryRange: filterState.compareRange,
            })
          : null;

      const totalPrimary = primaryAgg.reduce((sum, a) => sum + a.amount, 0);
      const totalCompare = compareAgg
        ? compareAgg.reduce((sum, a) => sum + a.amount, 0)
        : undefined;

      const momRate = calcMoM(primaryAgg);
      const yoyRate = calcYoY(primaryAgg);

      return { primaryAgg, compareAgg, totalPrimary, totalCompare, momRate, yoyRate };
    }, [records, filterState]);

  return (
    <div className="flex flex-wrap gap-4">
      {/* 총 비용 */}
      <KPICard
        label="총 비용"
        primaryValue={totalPrimary}
        compareValue={totalCompare}
      />

      {/* MoM 변화율 */}
      <KPICard
        label="MoM 변화율"
        primaryValue={primaryAgg.length > 0 ? primaryAgg[primaryAgg.length - 1].amount : 0}
        momRate={momRate}
      />

      {/* YoY 변화율 */}
      <KPICard
        label="YoY 변화율"
        primaryValue={primaryAgg.length > 0 ? primaryAgg[primaryAgg.length - 1].amount : 0}
        yoyRate={yoyRate}
      />

      {/* 비교 기간 총 비용 (compareRange 설정 시) */}
      {compareAgg && totalCompare !== undefined && (
        <KPICard
          label="비교 기간 총 비용"
          primaryValue={totalCompare}
        />
      )}
    </div>
  );
};

export default KPISection;
