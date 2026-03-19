import type {
  CostRecord,
  FilterState,
  MonthlyAggregation,
  DimensionAggregation,
  TopNItem,
} from '../types/index';

/** record의 date(YYYY-MM-DD)에서 월(YYYY-MM)을 추출 */
function toMonth(date: string): string {
  return date.slice(0, 7);
}

/** YYYY-MM 문자열 비교 (사전순 = 시간순) */
function monthInRange(month: string, start: string, end: string): boolean {
  return month >= start && month <= end;
}

/** FilterState 조건에 맞는 레코드만 반환 */
function applyFilter(records: CostRecord[], filter: FilterState): CostRecord[] {
  const { primaryRange, accounts, platforms, categories } = filter;

  return records.filter((r) => {
    const month = toMonth(r.date);

    // 날짜 범위 필터
    if (!monthInRange(month, primaryRange.start, primaryRange.end)) return false;

    // 계정 필터 (빈 배열 = 전체)
    if (accounts.length > 0 && !accounts.includes(r.account)) return false;

    // 플랫폼 필터
    if (platforms.length > 0 && !platforms.includes(r.platform)) return false;

    // 카테고리 필터
    if (categories.length > 0 && !categories.includes(r.category)) return false;

    return true;
  });
}

/**
 * 월별 집계: 필터를 적용한 후 YYYY-MM 기준으로 amount를 합산하고
 * 월 오름차순으로 정렬하여 반환한다.
 */
export function aggregateByMonth(
  records: CostRecord[],
  filter: FilterState
): MonthlyAggregation[] {
  const filtered = applyFilter(records, filter);

  const map = new Map<string, number>();
  for (const r of filtered) {
    const month = toMonth(r.date);
    map.set(month, (map.get(month) ?? 0) + r.amount);
  }

  return Array.from(map.entries())
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => (a.month < b.month ? -1 : a.month > b.month ? 1 : 0));
}

/**
 * 차원별 집계: 필터를 적용한 후 지정된 dimension 값으로 amount를 합산하고
 * share를 계산하여 amount 내림차순으로 정렬하여 반환한다.
 */
export function aggregateByDimension(
  records: CostRecord[],
  filter: FilterState,
  dimension: 'account' | 'platform' | 'category'
): DimensionAggregation[] {
  const filtered = applyFilter(records, filter);

  const map = new Map<string, number>();
  for (const r of filtered) {
    const key = r[dimension];
    map.set(key, (map.get(key) ?? 0) + r.amount);
  }

  const totalAmount = Array.from(map.values()).reduce((sum, v) => sum + v, 0);

  return Array.from(map.entries())
    .map(([dim, amount]) => ({
      dimension: dim,
      amount,
      share: totalAmount > 0 ? amount / totalAmount : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

/**
 * 변화율 계산: (primary - compare) / compare
 * compare가 0이면 primary > 0 → Infinity, primary === 0 → 0 반환
 */
export function calculateChangeRate(primary: number, compare: number): number {
  if (compare === 0) {
    return primary === 0 ? 0 : Infinity;
  }
  return (primary - compare) / compare;
}

/**
 * TOP N 계산: primary와 compare DimensionAggregation 배열을 label(dimension)로 매칭하여
 * changeRate 기준 상위 n개 증가 항목과 상위 n개 감소 항목을 반환한다.
 */
export function calculateTopN(
  primary: DimensionAggregation[],
  compare: DimensionAggregation[],
  n: number = 5
): TopNItem[] {
  const compareMap = new Map<string, number>(
    compare.map((c) => [c.dimension, c.amount])
  );

  const items: TopNItem[] = primary.map((p) => {
    const compareAmount = compareMap.get(p.dimension) ?? 0;
    const absoluteDiff = p.amount - compareAmount;
    const changeRate = calculateChangeRate(p.amount, compareAmount);
    return {
      label: p.dimension,
      primaryAmount: p.amount,
      compareAmount,
      absoluteDiff,
      changeRate,
    };
  });

  // compare에만 있는 항목도 포함 (primary = 0)
  const primaryLabels = new Set(primary.map((p) => p.dimension));
  for (const c of compare) {
    if (!primaryLabels.has(c.dimension)) {
      items.push({
        label: c.dimension,
        primaryAmount: 0,
        compareAmount: c.amount,
        absoluteDiff: -c.amount,
        changeRate: calculateChangeRate(0, c.amount),
      });
    }
  }

  // changeRate 기준 내림차순 정렬
  items.sort((a, b) => b.changeRate - a.changeRate);

  const increases = items.filter((i) => i.changeRate > 0).slice(0, n);
  const decreases = items
    .filter((i) => i.changeRate < 0)
    .sort((a, b) => a.changeRate - b.changeRate)
    .slice(0, n);

  return [...increases, ...decreases];
}
