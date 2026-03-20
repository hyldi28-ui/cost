import { useMemo, useState, useRef, useEffect } from 'react';
import { useDashboardStore } from '../store/dashboardStore';

// YYYY-MM 형식 검증
const MONTH_REGEX = /^\d{4}-\d{2}$/;

interface MonthInputProps {
  value: string;
  onChange: (val: string) => void;
}

function MonthInput({ value, onChange }: MonthInputProps) {
  const [text, setText] = useState(value);
  const [error, setError] = useState(false);

  // 외부 value 변경 시 동기화
  useEffect(() => { setText(value); }, [value]);

  function handleTextChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setText(v);
    if (MONTH_REGEX.test(v)) {
      setError(false);
      onChange(v);
    } else {
      setError(true);
    }
  }

  function handlePickerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value; // already YYYY-MM
    setText(v);
    setError(false);
    onChange(v);
  }

  return (
    <div className="flex items-center gap-1">
      <input
        type="text"
        value={text}
        onChange={handleTextChange}
        placeholder="YYYY-MM"
        maxLength={7}
        className={`w-24 border rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 ${
          error ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'
        }`}
      />
      <input
        type="month"
        value={MONTH_REGEX.test(text) ? text : ''}
        onChange={handlePickerChange}
        className="border border-gray-300 dark:border-gray-600 rounded px-1 py-1 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 w-8 cursor-pointer"
        title="달력에서 선택"
        style={{ colorScheme: 'auto' }}
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

  const compareEnabled = compareRange !== null;

  function toggleCompare() {
    setFilterState({ compareRange: compareEnabled ? null : { start: '2020-01', end: '2099-12' } });
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex flex-col gap-4">
      {/* Primary Range */}
      <div>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Primary Range</p>
        <div className="flex gap-2 items-center flex-wrap">
          <MonthInput value={primaryRange.start} onChange={(v) => setFilterState({ primaryRange: { ...primaryRange, start: v } })} />
          <span className="text-gray-500 dark:text-gray-400 text-sm">~</span>
          <MonthInput value={primaryRange.end} onChange={(v) => setFilterState({ primaryRange: { ...primaryRange, end: v } })} />
        </div>
      </div>

      {/* Compare Range */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={compareEnabled} onChange={toggleCompare} className="w-4 h-4 accent-blue-500" />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Compare Range 활성화</span>
        </label>
        {compareEnabled && compareRange && (
          <div className="flex gap-2 items-center mt-2 flex-wrap">
            <MonthInput value={compareRange.start} onChange={(v) => setFilterState({ compareRange: { ...compareRange, start: v } })} />
            <span className="text-gray-500 dark:text-gray-400 text-sm">~</span>
            <MonthInput value={compareRange.end} onChange={(v) => setFilterState({ compareRange: { ...compareRange, end: v } })} />
          </div>
        )}
      </div>

      {/* Dropdown MultiSelects */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <DropdownMultiSelect
          label="Account"
          options={options.accounts}
          selected={accounts}
          onChange={(v) => setFilterState({ accounts: v })}
        />
        <DropdownMultiSelect
          label="Platform"
          options={options.platforms}
          selected={platforms}
          onChange={(v) => setFilterState({ platforms: v })}
        />
        <DropdownMultiSelect
          label="Category"
          options={options.categories}
          selected={categories}
          onChange={(v) => setFilterState({ categories: v })}
        />
      </div>

      <div>
        <button onClick={resetFilter}
          className="px-4 py-1.5 text-sm rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
          필터 초기화
        </button>
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

  // 외부 클릭 시 닫기
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // null = 전체 선택, [] = 전체 해제, string[] = 일부 선택
  const isAllSelected = selected === null;
  const isNoneSelected = Array.isArray(selected) && selected.length === 0;

  function toggleAll() {
    if (isAllSelected) {
      onChange([]); // 전체 선택 → 전체 해제
    } else {
      onChange(null); // 전체 해제 or 일부 선택 → 전체 선택
    }
  }

  function toggleOption(opt: string) {
    if (isAllSelected) {
      // 전체 선택 상태에서 하나 해제 → 나머지만 선택
      onChange(options.filter((o) => o !== opt));
    } else if (isNoneSelected) {
      // 전체 해제 상태에서 하나 선택
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
      <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">{label}</label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:border-blue-400 transition-colors"
      >
        <span className="truncate">{displayText}</span>
        <svg className={`w-4 h-4 ml-1 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 w-full min-w-[160px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-56 overflow-y-auto">
          {/* 전체 선택 */}
          <label className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={toggleAll}
              className="w-4 h-4 accent-blue-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">전체</span>
          </label>
          {options.map((opt) => (
            <label key={opt} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
              <input
                type="checkbox"
                checked={isChecked(opt)}
                onChange={() => toggleOption(opt)}
                className="w-4 h-4 accent-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-200 truncate">{opt}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
