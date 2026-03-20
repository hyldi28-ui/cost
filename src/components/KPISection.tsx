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

const KPISection: React.FC = () => {
  const records = useDashboardStore((s) => s.records);
  const filterState = useDashboardStore((s) => s.filterState);

  const { primaryAgg, totalPrimary, totalCompare, momRate } = useMemo(() => {
    const primaryAgg = aggregateByMonth(records, filterState);
    const compareAgg = filterState.compareRange
      ? aggregateByMonth(records, { ...filterState, primaryRange: filterState.compareRange })
      : null;

    const totalPrimary = primaryAgg.reduce((sum, a) => sum + a.amount, 0);
    const totalCompare = compareAgg ? compareAgg.reduce((sum, a) => sum + a.amount, 0) : undefined;
    const momRate = calcMoM(primaryAgg);

    return { primaryAgg, totalPrimary, totalCompare, momRate };
  }, [records, filterState]);

  const hasCompare = totalCompare !== undefined;

  return (
    <div className="flex flex-wrap gap-4">
      {/* 총 비용 */}
      <KPICard label={hasCompare ? "기준기간 총비용" : "총 비용"} primaryValue={totalPrimary} />

      {/* 비교 기간 총 비용 — 총 비용 바로 옆, 음영 카드 */}
      {hasCompare && (
        <KPICard
          label="비교 기간 총 비용"
          primaryValue={totalCompare!}
          isCompareCard
          primaryTotal={totalPrimary}
        />
      )}

      {/* MoM 변화율 */}
      <KPICard
        label="MoM 변화율"
        primaryValue={primaryAgg.length > 0 ? primaryAgg[primaryAgg.length - 1].amount : 0}
        momRate={momRate}
      />
    </div>
  );
};

export default KPISection;
