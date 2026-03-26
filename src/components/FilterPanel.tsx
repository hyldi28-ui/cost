import { useMemo, useState, useRef, useEffect } from 'react';
import { useDashboardStore } from '../store/dashboardStore';
import { aggregateByMonth } from '../lib/aggregator';

const MONTH_REGEX = /^\d{4}-\d{2}$/;

function formatKRW(value: number): string {
  return value.toLocaleString('ko-KR') + '원';
}

function formatRate(rate: number): string {
  const sign = rate > 0 ? '+' : '';
  return `${sign}${(rate * 100).toFixed(1)}%`;
}

function rateColor(rate: number): string {
  if (rate > 0) return 'text-blue-500 dark:text-blue-400';
  if (rate < 0) return 'text-orange-500 dark:text-orange-400';
  return 'text-gray-500 dark:text-gray-400';
}

interface MonthInputProps {
  value: string;
  onChange: (val: string) => void;
}

function MonthInput({ value, onChange }: MonthInputProps) {
  const [text, setText] = useState(value);
  const [error, setError] = useState(false);
  useEffect(() => { setText(value); }, [value]);

  function handleTextChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setText(v);
    if (MONTH_REGEX.test(v)) { setError(false); onChange(v); } else { setError(true); }
  }

  function handlePickerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setText(v); setError(false); onChange(v);
  }

  return (
    <div className="flex items-center gap-1">
      <input type="text" value={text} onChange={handleTextChange} placeholder="YYYY-MM" maxLength={7}
        className={`w-24 border rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 ${error ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
      />
      <input type="month" value={MONTH_REGEX.test(text) ? text : ''} onChange={handlePickerChange}
        className="border border-gray-300 dark:border-gray-600 rounded px-1 py-1 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 w-8 cursor-pointer"
        title="달력에서 선택" style={{ colorScheme: 'auto' }}
      />
    </div>
  );
}

export default function FilterPanel() {
  const { records, filterState, setFilterState, resetFilter } = useDashboardStore();
  const { primaryRange, compareRange, accounts, platforms, categories } = filterState;

  const options = useMemo(() => ({
    accounts: [...new Set(records.map((r) => r.account))].sort(),
    platforms: [...new Set(records.map((r) => r.platform))].sort(),
    categories: [...new Set(records.map((r) => r.category))].sort(),
  }), [records]);

  const { totalPrimary, totalCompare } = useMemo(() => {
    const primaryAgg = aggregateByMonth(records, filterState);
    const compareAgg = filterState.compareRange
      ? aggregateByMonth(records, { ...filterState, primaryRange: filterState.compareRange })
      : null;
    return {
      totalPrimary: primaryAgg.reduce((sum, a) => sum + a.amount, 0),
      totalCompare: compareAgg ? compareAgg.reduce((sum, a) => sum + a.amount, 0) : undefined,
    };
  }, [records, filterState]);

  const hasCompare = totalCompare !== undefined;
  const absDiff = hasCompare && totalCompare !== undefined ? totalPrimary - totalCompare : null;
  const diffRate = absDiff !== null && totalCompare !== 0 ? absDiff / totalCompare! : null;

  const compareEnabled = compareRange !== null;
  function toggleCompare() {
    setFilterState({ compareRange: compareEnabled ? null : { start: '2026-01', end: '2026-02' } });
  }

  const accountText = accounts === null ? '전체' : accounts.length === 0 ? null : accounts.join(', ');
  const platformText = platforms === null ? '전체' : platforms.length === 0 ? null : platforms.join(', ');
  const categoryText = categories === null ? '전체' : categories.length === 0 ? null : categories.join(', ');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 flex flex-col lg:flex-row gap-5">
      {/* 좌측: 컨트롤 영역 */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        {/* Primary Range */}
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Primary Range</p>
          <div className="flex gap-2 items-center flex-wrap">
            <MonthInput value={primaryRange.start} onChange={(v) => setFilterState({ primaryRange: { ...primaryRange, start: v } })} />
            <span className="text-gray-400 text-sm">~</span>
            <MonthInput value={primaryRange.end} onChange={(v) => setFilterState({ primaryRange: { ...primaryRange, end: v } })} />
          </div>
        </div>

        {/* Compare Range */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <input type="checkbox" checked={compareEnabled} onChange={toggleCompare} className="w-4 h-4 accent-blue-500 cursor-pointer" />
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Compare Range</p>
          </div>
          {compareEnabled && compareRange && (
            <div className="flex gap-2 items-center flex-wrap">
              <MonthInput value={compareRange.start} onChange={(v) => setFilterState({ compareRange: { ...compareRange, start: v } })} />
              <span className="text-gray-400 text-sm">~</span>
              <MonthInput value={compareRange.end} onChange={(v) => setFilterState({ compareRange: { ...compareRange, end: v } })} />
            </div>
          )}
        </div>

        {/* 구분선 */}
        <div className="border-t border-gray-100 dark:border-gray-700" />

        {/* 필터 드롭다운 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <DropdownMultiSelect label="Account" options={options.accounts} selected={accounts} onChange={(v) => setFilterState({ accounts: v })} />
          <DropdownMultiSelect label="Platform" options={options.platforms} selected={platforms} onChange={(v) => setFilterState({ platforms: v })} />
          <DropdownMultiSelect label="Category" options={options.categories} selected={categories} onChange={(v) => setFilterState({ categories: v })} />
        </div>

        {/* 하단: 초기화 + 필터 요약 */}
        <div className="flex items-start gap-4 flex-wrap">
          <button onClick={resetFilter}
            className="px-3 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex-shrink-0">
            필터 초기화
          </button>
          {(accountText || platformText || categoryText) && (
            <div className="text-xs text-gray-400 dark:text-gray-500 space-y-0.5 leading-relaxed">
              {accountText && <p>어카운트 : {accountText}</p>}
              {platformText && <p>플랫폼 : {platformText}</p>}
              {categoryText && <p>카테고리 : {categoryText}</p>}
            </div>
          )}
        </div>
      </div>

      {/* 구분선 (세로) */}
      <div className="hidden lg:block w-px bg-gray-100 dark:bg-gray-700 self-stretch" />
      <div className="block lg:hidden border-t border-gray-100 dark:border-gray-700" />

      {/* 우측: KPI 카드 영역 */}
      <div className="flex flex-row lg:flex-col gap-3 lg:w-52 lg:flex-shrink-0 flex-wrap">
        {/* 기준기간 총비용 */}
        <div className="flex-1 lg:flex-none bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
          <p className="text-xs font-medium text-blue-500 dark:text-blue-400 mb-1">
            {hasCompare ? '기준기간 총비용' : '총 비용'}
          </p>
          <p className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
            {formatKRW(totalPrimary)}
          </p>
        </div>

        {/* 비교기간 총비용 */}
        {hasCompare && totalCompare !== undefined && (
          <div className="flex-1 lg:flex-none bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">비교기간 총비용</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
              {formatKRW(totalCompare)}
            </p>
            {absDiff !== null && diffRate !== null && (
              <p className={`text-xs mt-1 ${rateColor(absDiff)}`}>
                {absDiff > 0 ? '+' : ''}{formatKRW(absDiff)} ({formatRate(diffRate)})
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface DropdownMultiSelectProps {
  label: string;
  options: string[];
  selected: string[] | null;
  onChange: (selected: string[] | null) => void;
}

function DropdownMultiSelect({ label, options, selected, onChange }: DropdownMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const isAllSelected = selected === null;
  const isNoneSelected = Array.isArray(selected) && selected.length === 0;

  function toggleAll() {
    if (isAllSelected) { onChange([]); } else { onChange(null); }
  }

  function toggleOption(opt: string) {
    if (isAllSelected) {
      onChange(options.filter((o) => o !== opt));
    } else if (isNoneSelected) {
      onChange([opt]);
    } else {
      const arr = selected as string[];
      if (arr.includes(opt)) {
        const next = arr.filter((s) => s !== opt);
        onChange(next.length === 0 ? [] : next);
      } else {
        const next = [...arr, opt];
        onChange(next.length === options.length ? null : next);
      }
    }
  }

  const isChecked = (opt: string) => isAllSelected || (Array.isArray(selected) && selected.includes(opt));
  const displayText = isAllSelected ? '전체' : isNoneSelected ? '선택 없음' : `${(selected as string[]).length}개 선택`;

  return (
    <div ref={ref} className="relative flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">{label}</label>
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:border-blue-400 transition-colors">
        <span className="truncate">{displayText}</span>
        <svg className={`w-4 h-4 ml-1 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-1 w-full min-w-[160px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-56 overflow-y-auto">
          <label className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700">
            <input type="checkbox" checked={isAllSelected} onChange={toggleAll} className="w-4 h-4 accent-blue-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">전체</span>
          </label>
          {options.map((opt) => (
            <label key={opt} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
              <input type="checkbox" checked={isChecked(opt)} onChange={() => toggleOption(opt)} className="w-4 h-4 accent-blue-500" />
              <span className="text-sm text-gray-700 dark:text-gray-200 truncate">{opt}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
