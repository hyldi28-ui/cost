/** 원시 비용 레코드 (CSV 1행 = 1 CostRecord) */
export interface CostRecord {
  date: string;        // "YYYY-MM-DD"
  account: string;     // 계정 (예: "(판)광고선전비")
  platform: string;    // 플랫폼 (예: "네이버")
  category: string;    // 구분 (예: "라이브")
  amount: number;      // 금액 (양수)
  memo: string;        // 적요
}

/** CSV 파싱 결과 */
export interface ParseResult {
  records: CostRecord[];
  errorCount: number;
  errors: ParseError[];
  missingColumns?: string[];
}

export interface ParseError {
  row: number;
  reason: 'invalid_date' | 'invalid_amount' | 'missing_column';
  raw: string;
}

/** 필터 상태 (중앙 스토어의 핵심) */
export interface FilterState {
  primaryRange: DateRange;
  compareRange: DateRange | null;
  accounts: string[] | null;    // null = 전체 선택, [] = 전체 해제
  platforms: string[] | null;
  categories: string[] | null;
}

export interface DateRange {
  start: string; // "YYYY-MM"
  end: string;   // "YYYY-MM"
}

/** 월별 집계 결과 */
export interface MonthlyAggregation {
  month: string;   // "YYYY-MM"
  amount: number;
}

export interface MonthlyPoint {
  month: string;
  amount: number;
}

/** 차원별 집계 결과 */
export interface DimensionAggregation {
  dimension: string;  // account / platform / category 값
  amount: number;
  share: number;      // 전체 대비 비율 (0~1)
}

export interface DimensionPoint {
  label: string;
  amount: number;
  share: number;
}

export interface DonutSegment {
  label: string;
  amount: number;
  share: number;
}

/** TOP N 비교 항목 */
export interface TopNItem {
  label: string;
  primaryAmount: number;
  compareAmount: number;
  absoluteDiff: number;
  changeRate: number;  // (primary - compare) / compare
}

/** 인사이트 */
export interface Insight {
  month: string;
  item: string;
  changeRate: number;
  direction: 'increase' | 'decrease';
  message: string;  // "[월] [항목명] 비용이 전월 대비 [변화율]% [증가/감소]했습니다"
}

/** Zustand 스토어 */
export interface DashboardStore {
  records: CostRecord[];
  filterState: FilterState;
  theme: 'light' | 'dark';
  isLoading: boolean;

  setRecords: (records: CostRecord[]) => void;
  setFilterState: (patch: Partial<FilterState>) => void;
  resetFilter: () => void;
  toggleTheme: () => void;
  setLoading: (v: boolean) => void;
}
