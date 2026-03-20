import { useState, useMemo } from "react";
import type { CostRecord } from "../types";

interface Props {
  records: CostRecord[];
}

export default function MemoByCategory({ records }: Props) {
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

  const { grouped, grandTotal } = useMemo(() => {
    const map = new Map<string, { memo: string; amount: number; date: string }[]>();
    for (const r of records) {
      if (!r.memo) continue;
      const cat = r.category || "미분류";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push({ memo: r.memo, amount: r.amount, date: r.date });
    }
    const grouped = Array.from(map.entries()).sort((a, b) => {
      const totalA = a[1].reduce((s, i) => s + i.amount, 0);
      const totalB = b[1].reduce((s, i) => s + i.amount, 0);
      return totalB - totalA;
    });
    const grandTotal = grouped.reduce((s, [, items]) => s + items.reduce((ss, i) => ss + i.amount, 0), 0);
    return { grouped, grandTotal };
  }, [records]);

  function toggle(cat: string) {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  }

  if (grouped.length === 0) return null;

  return (
    <div className="rounded-xl bg-white dark:bg-gray-800 p-4 shadow-sm space-y-2">
      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">카테고리별 적요</h2>
      {grouped.map(([cat, items]) => {
        const isOpen = openCategories.has(cat);
        const total = items.reduce((s, i) => s + i.amount, 0);
        const pct = grandTotal > 0 ? (total / grandTotal) * 100 : 0;
        return (
          <div key={cat} className="border border-gray-100 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => toggle(cat)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{cat}</span>
                <span className="text-xs text-gray-400">({items.length}건)</span>
                <span className="text-xs font-medium text-blue-500">{pct.toFixed(1)}%</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {total.toLocaleString()}원
                </span>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            {isOpen && (
              <div className="divide-y divide-gray-50 dark:divide-gray-700">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between px-4 py-2 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-gray-400 dark:text-gray-500 shrink-0">{item.date.slice(0, 7)}</span>
                      <span className="text-gray-700 dark:text-gray-300 truncate">{item.memo}</span>
                    </div>
                    <span className="text-gray-600 dark:text-gray-400 shrink-0 ml-4">
                      {item.amount.toLocaleString()}원
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
