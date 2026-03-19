import { useMemo } from "react";
import { useDashboardStore } from "./store/dashboardStore";
import { aggregateByMonth, aggregateByDimension, calculateTopN } from "./lib/aggregator";
import { detectInsights } from "./lib/insightEngine";
import ThemeToggle from "./components/ThemeToggle";
import CSVUploader from "./components/CSVUploader";
import FilterPanel from "./components/FilterPanel";
import KPISection from "./components/KPISection";
import TrendChart from "./components/TrendChart";
import BarChartSection from "./components/BarChartSection";
import DonutChart from "./components/DonutChart";
import TopNList from "./components/TopNList";
import InsightCards from "./components/InsightCards";
import ErrorBoundary from "./components/ErrorBoundary";
import SkeletonCard from "./components/SkeletonCard";
import type { DonutSegment } from "./types";

function App() {
  const records = useDashboardStore((s) => s.records);
  const filterState = useDashboardStore((s) => s.filterState);
  const isLoading = useDashboardStore((s) => s.isLoading);
  const setFilterState = useDashboardStore((s) => s.setFilterState);

  const { primarySeries, compareSeries, topNItems, insights, donutData } = useMemo(() => {
    const primarySeries = aggregateByMonth(records, filterState);
    const compareSeries = filterState.compareRange
      ? aggregateByMonth(records, { ...filterState, primaryRange: filterState.compareRange })
      : undefined;
    const primaryDimAgg = aggregateByDimension(records, filterState, "category");
    const compareDimAgg = filterState.compareRange
      ? aggregateByDimension(records, { ...filterState, primaryRange: filterState.compareRange }, "category")
      : [];
    const topNItems = filterState.compareRange ? calculateTopN(primaryDimAgg, compareDimAgg) : [];
    const insights = detectInsights(primarySeries, 0.3, "전체");
    const donutData: DonutSegment[] = primaryDimAgg.map((d) => ({
      label: d.dimension,
      amount: d.amount,
      share: d.share,
    }));
    return { primarySeries, compareSeries, topNItems, insights, donutData };
  }, [records, filterState]);

  function handleSegmentClick(_dimension: string, value: string) {
    const current = filterState.categories;
    if (!current.includes(value)) {
      setFilterState({ categories: [...current, value] });
    }
  }

  const hasData = records.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <div className="flex items-center justify-end">
          <ThemeToggle />
        </div>
        {!hasData && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-full max-w-lg">
              <CSVUploader />
            </div>
          </div>
        )}
        {hasData && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-1"><CSVUploader /></div>
              <div className="lg:col-span-2"><FilterPanel /></div>
            </div>
            <div>
              {isLoading ? (
                <div className="flex flex-wrap gap-4">
                  <SkeletonCard height="h-28" />
                  <SkeletonCard height="h-28" />
                  <SkeletonCard height="h-28" />
                </div>
              ) : (
                <KPISection />
              )}
            </div>
            <div>
              {isLoading ? (
                <SkeletonCard height="h-72" />
              ) : (
                <ErrorBoundary>
                  <TrendChart primarySeries={primarySeries} compareSeries={compareSeries} />
                </ErrorBoundary>
              )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                {isLoading ? <SkeletonCard height="h-80" /> : (
                  <ErrorBoundary><BarChartSection /></ErrorBoundary>
                )}
              </div>
              <div>
                {isLoading ? <SkeletonCard height="h-80" /> : (
                  <ErrorBoundary>
                    <DonutChart data={donutData} onSegmentClick={handleSegmentClick} />
                  </ErrorBoundary>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                {isLoading ? <SkeletonCard height="h-64" /> : (
                  <ErrorBoundary><TopNList items={topNItems} /></ErrorBoundary>
                )}
              </div>
              <div>
                {isLoading ? <SkeletonCard height="h-64" /> : (
                  <ErrorBoundary><InsightCards insights={insights} /></ErrorBoundary>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;