import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, Label } from "recharts";
import type { DonutSegment } from "../types";

// 카테고리 이름 기반 고정 색상 맵
const CATEGORY_COLOR_MAP: Record<string, string> = {
  "사은품": "#3b82f6",
  "체험단": "#ef4444",
  "라이브": "#10b981",
  "메타": "#f97316",
  "네이버카드": "#6366f1",
  "기타광고비": "#facc15",
  "외부몰프로모션": "#ec4899",
  "네이버 비즈월렛": "#06b6d4",
  "카페바이럴": "#84cc16",
  "공식몰프로모션": "#8b5cf6",
};

// 알 수 없는 카테고리 fallback 색상
const FALLBACK_COLORS = ["#3b82f6","#f97316","#10b981","#8b5cf6","#f59e0b","#ef4444","#06b6d4","#84cc16","#ec4899","#6366f1"];

function getCategoryColor(label: string, fallbackIndex: number): string {
  return CATEGORY_COLOR_MAP[label] ?? FALLBACK_COLORS[fallbackIndex % FALLBACK_COLORS.length];
}

interface DonutChartProps {
  data: DonutSegment[];
  title?: string;
  colorMap?: Record<string, string>;
  onSegmentClick: (dimension: string, value: string) => void;
}

function formatAmount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return value.toLocaleString();
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: DonutSegment }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const seg = payload[0].payload;
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <p className="mb-1 text-sm font-semibold text-gray-700 dark:text-gray-200">{seg.label}</p>
      <p className="text-sm text-gray-600 dark:text-gray-300">{seg.amount.toLocaleString()}원</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{(seg.share * 100).toFixed(1)}%</p>
    </div>
  );
}

interface CenterLabelProps {
  viewBox?: { cx: number; cy: number };
  total: number;
}

function CenterLabel({ viewBox, total }: CenterLabelProps) {
  const cx = viewBox?.cx ?? 0;
  const cy = viewBox?.cy ?? 0;
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
      <tspan x={cx} dy="-0.6em" fontSize="11" fill="#6b7280">합계</tspan>
      <tspan x={cx} dy="1.4em" fontSize="13" fontWeight="600" fill="#111827">{formatAmount(total)}</tspan>
    </text>
  );
}

const DonutChart: React.FC<DonutChartProps> = ({ data, title, colorMap, onSegmentClick }) => {
  const total = data.reduce((sum, d) => sum + d.amount, 0);

  // 카테고리 이름 기반 색상 결정 (외부 colorMap > 고정 맵 > fallback)
  function getColor(label: string, index: number): string {
    if (colorMap && colorMap[label]) return colorMap[label];
    return getCategoryColor(label, index);
  }

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <p className="text-sm text-gray-400 dark:text-gray-500">표시할 데이터가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      {title && (
        <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2 text-center">{title}</p>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="label"
            innerRadius="60%"
            outerRadius="80%"
            animationDuration={250}
            onClick={(entry) => {
              if (entry && entry.label) onSegmentClick("category", entry.label as string);
            }}
            style={{ cursor: "pointer" }}
          >
            {data.map((seg, index) => (
              <Cell key={`cell-${seg.label}`} fill={getColor(seg.label, index)} />
            ))}
            <Label
              content={(props) => (
                <CenterLabel viewBox={props.viewBox as { cx: number; cy: number }} total={total} />
              )}
              position="center"
            />
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
            formatter={(value) => (
              <span className="text-gray-600 dark:text-gray-300">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DonutChart;