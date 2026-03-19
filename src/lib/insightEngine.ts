import type { MonthlyAggregation, Insight } from '../types/index';

/**
 * 월별 집계 데이터에서 이상 패턴을 탐지하여 Insight 배열을 반환한다.
 *
 * @param aggregations - 월 오름차순으로 정렬된 MonthlyAggregation 배열
 * @param threshold - MoM 변화율 절대값 기준 (기본값: 0.30 = 30%)
 * @param item - 인사이트 메시지에 사용할 항목명 (기본값: '')
 */
export function detectInsights(
  aggregations: MonthlyAggregation[],
  threshold: number = 0.30,
  item: string = ''
): Insight[] {
  const insights: Insight[] = [];

  for (let i = 1; i < aggregations.length; i++) {
    const prev = aggregations[i - 1];
    const curr = aggregations[i];

    // prev.amount가 0이면 변화율 계산 불가 → 건너뜀
    if (prev.amount === 0) continue;

    const changeRate = (curr.amount - prev.amount) / prev.amount;

    if (Math.abs(changeRate) > threshold) {
      const direction: 'increase' | 'decrease' = changeRate > 0 ? 'increase' : 'decrease';
      const pct = Math.abs(Math.round(changeRate * 100));
      const dirLabel = direction === 'increase' ? '증가' : '감소';
      const message = `${curr.month} ${item} 비용이 전월 대비 ${pct}% ${dirLabel}했습니다`;

      insights.push({
        month: curr.month,
        item,
        changeRate,
        direction,
        message,
      });
    }
  }

  return insights;
}
