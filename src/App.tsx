import { useMemo, useEffect, useCallback } from "react";
import { useDashboardStore } from "./store/dashboardStore";
import { aggregateByMonth, aggregateByDimension, calculateTopN } from "./lib/aggregator";
import { parseCSVString } from "./lib/csvParser";
import ThemeToggle from "./components/ThemeToggle";
import FilterPanel from "./components/FilterPanel";
import TrendChart from "./components/TrendChart";
import BarChartSection from "./components/BarChartSection";
import DonutChart from "./components/DonutChart";
import TopNList from "./components/TopNList";
import MemoByCategory from "./components/MemoByCategory";
import ErrorBoundary from "./components/ErrorBoundary";
import SkeletonCard from "./components/SkeletonCard";
import type { DonutSegment } from "./types";

const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSrfUf90ETlX0xLhimPW9yyutyK0GPOZ_DtZUK4IQVzRB6KpFZfGWUMXgU0l6MoQ_FEEghNC1PAr3ux/pub?gid=2097962772&single=true&output=csv";
const CHART_COLORS = ["#3b82f6","#f97316","#10b981","#8b5cf6","#f59e0b","#ef4444","#06b6d4","#84cc16","#ec4899","#6366f1"];

function msUntilNextSixAM() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(6, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

function App() {
  const records = useDashboardStore((s) => s.records);
  const filterState = useDashboardStore((s) => s.filterState);
  const isLoading = useDashboardStore((s) => s.isLoading);
  const setFilterState = useDashboardStore((s) => s.setFilterState);
  const setRecords = useDashboardStore((s) => s.setRecords);
  const setLoading = useDashboardStore((s) => s.setLoading);

  const loadSheet = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(SHEET_CSV_URL);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const text = await res.text();
      const result = parseCSVString(text);
      if (!result.missingColumns || result.missingColumns.length === 0) {
        setRecords(result.records);
      }
    } catch (e) {
      console.error("시트 로드 실패:", e);
    } finally {
      setLoading(false);
    }
  }, [setRecords, setLoading]);

  useEffect(() => { loadSheet(); }, [loadSheet]);
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    const timeoutId = setTimeout(() => {
      loadSheet();
      intervalId = setInterval(loadSheet, 24 * 60 * 60 * 1000);
    }, msUntilNextSixAM());
    return () => { clearTimeout(timeoutId); clearInterval(intervalId); };
  }, [loadSheet]);

  const { primarySeries, compareSeries, topNItems, donutData, compareDonutData, colorMap } = useMemo(() => {
    const primarySeries = aggregateByMonth(records, filterState);
    const compareSeries = filterState.compareRange
      ? aggregateByMonth(records, { ...filterState, primaryRange: filterState.compareRange })
      : undefined;
    const primaryDimAgg = aggregateByDimension(records, filterState, "category");
    const compareDimAgg = filterState.compareRange
      ? aggregateByDimension(records, { ...filterState, primaryRange: filterState.compareRange }, "category")
      : [];
    const topNItems = filterState.compareRange ? calculateTopN(primaryDimAgg, compareDimAgg) : [];
    const donutData: DonutSegment[] = primaryDimAgg.map((d) => ({ label: d.dimension, amount: d.amount, share: d.share }));
    const compareDonutData: DonutSegment[] = compareDimAgg.map((d) => ({ label: d.dimension, amount: d.amount, share: d.share }));
    const allLabels = [...new Set([...primaryDimAgg.map(d => d.dimension), ...compareDimAgg.map(d => d.dimension)])];
    const colorMap: Record<string, string> = {};
    allLabels.forEach((label, i) => { colorMap[label] = CHART_COLORS[i % CHART_COLORS.length]; });
    return { primarySeries, compareSeries, topNItems, donutData, compareDonutData, colorMap };
  }, [records, filterState]);

  const filteredRecords = useMemo(() => {
    const { primaryRange, accounts, platforms, categories } = filterState;
    return records.filter((r) => {
      if (r.date < primaryRange.start + "-01") return false;
      if (r.date > primaryRange.end + "-31") return false;
      if (accounts !== null && accounts.length > 0 && !accounts.includes(r.account)) return false;
      if (platforms !== null && platforms.length > 0 && !platforms.includes(r.platform)) return false;
      if (categories !== null && categories.length > 0 && !categories.includes(r.category)) return false;
      return true;
    });
  }, [records, filterState]);

  function handleSegmentClick(_dimension: string, value: string) {
    const current = filterState.categories ?? [];
    if (!current.includes(value)) setFilterState({ categories: [...current, value] });
  }

  const hasCompare = !!filterState.compareRange;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400 dark:text-gray-500">매일 오전 6시 자동 갱신</p>
          <div className="flex items-center gap-2">
            <button onClick={loadSheet} className="px-3 py-1.5 text-xs rounded bg-blue-500 hover:bg-blue-600 text-white transition-colors">지금 새로고침</button>
            <ThemeToggle />
          </div>
        </div>
        {isLoading && records.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500 dark:text-gray-400">구글 시트에서 데이터를 불러오는 중...</p>
          </div>
        )}
        {records.length > 0 && (
          <div className="space-y-6">
            <FilterPanel />
            <div>
              {isLoading ? <SkeletonCard height="h-72" /> : (
                <ErrorBoundary><TrendChart primarySeries={primarySeries} compareSeries={compareSeries} /></ErrorBoundary>
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
                    {hasCompare ? (
                      <div className="grid grid-cols-2 gap-3">
                        <DonutChart data={donutData} title="기준기간" colorMap={colorMap} onSegmentClick={handleSegmentClick} />
                        <DonutChart data={compareDonutData} title="비교기간" colorMap={colorMap} onSegmentClick={handleSegmentClick} />
                      </div>
                    ) : (
                      <DonutChart data={donutData} colorMap={colorMap} onSegmentClick={handleSegmentClick} />
                    )}
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
                  <ErrorBoundary><MemoByCategory records={filteredRecords} /></ErrorBoundary>
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