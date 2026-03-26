import React, { useMemo } from 'react';
import { useDashboardStore } from '../store/dashboardStore';
import { aggregateByMonth } from '../lib/aggregator';
import KPICard from './KPICard';

const KPISection: React.FC = () => {
  const records = useDashboardStore((s) => s.records);
  const filterState = useDashboardStore((s) => s.filterState);

  const { totalPrimary, totalCompare } = useMemo(() => {
    const primaryAgg = aggregateByMonth(records, filterState);
    const compareAgg = filterState.compareRange
      ? aggregateByMonth(records, { ...filterState, primaryRange: filterState.compareRange })
      : null;

    const totalPrimary = primaryAgg.reduce((sum, a) => sum + a.amount, 0);
    const totalCompare = compareAgg ? compareAgg.reduce((sum, a) => sum + a.amount, 0) : undefined;

    return { totalPrimary, totalCompare };
  }, [records, filterState]);

  const hasCompare = totalCompare !== undefined;

  return (
    <div className="flex flex-wrap gap-4">
      <KPICard label={hasCompare ? "기준기간 총비용" : "총 비용"} primaryValue={totalPrimary} />
      {hasCompare && (
        <KPICard
          label="비교 기간 총 비용"
          primaryValue={totalCompare!}
          isCompareCard
          primaryTotal={totalPrimary}
        />
      )}
    </div>
  );
};

export default KPISection;
