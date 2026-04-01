"use client";

type DailyPoint = {
  day: string; // YYYY-MM-DD
  count: number;
};

interface DailyProgressChartProps {
  points: DailyPoint[];
}

function formatDayLabel(day: string): string {
  const d = new Date(`${day}T00:00:00`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function DailyProgressChart({ points }: DailyProgressChartProps) {
  const width = 760;
  const height = 260;
  const margin = { top: 18, right: 16, bottom: 40, left: 48 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const maxY = Math.max(1, ...points.map((p) => p.count));
  const yTickCount = 4;
  const yTicks = Array.from({ length: yTickCount + 1 }, (_, i) =>
    Math.round((maxY / yTickCount) * i)
  );

  function xFor(index: number): number {
    if (points.length <= 1) return margin.left + innerWidth / 2;
    return margin.left + (index / (points.length - 1)) * innerWidth;
  }

  function yFor(value: number): number {
    return margin.top + innerHeight - (value / maxY) * innerHeight;
  }

  const polylinePoints = points
    .map((p, i) => `${xFor(i)},${yFor(p.count)}`)
    .join(" ");

  const xLabelStep = Math.max(1, Math.ceil(points.length / 6));

  return (
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[260px] w-full">
        <line
          x1={margin.left}
          y1={margin.top + innerHeight}
          x2={margin.left + innerWidth}
          y2={margin.top + innerHeight}
          stroke="#cfc6bc"
          strokeWidth="1"
        />
        <line
          x1={margin.left}
          y1={margin.top}
          x2={margin.left}
          y2={margin.top + innerHeight}
          stroke="#cfc6bc"
          strokeWidth="1"
        />

        {yTicks.map((tick) => {
          const y = yFor(tick);
          return (
            <g key={`y-${tick}`}>
              <line x1={margin.left} y1={y} x2={margin.left + innerWidth} y2={y} stroke="#efe8df" strokeWidth="1" />
              <text x={margin.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#6d5b4e">
                {tick}
              </text>
            </g>
          );
        })}

        <polyline fill="none" stroke="#7d7369" strokeWidth="2.8" points={polylinePoints} />

        {points.map((point, i) => {
          const x = xFor(i);
          const showLabel = i % xLabelStep === 0 || i === points.length - 1;
          return (
            <g key={`${point.day}-${i}`}>
              {showLabel ? (
                <text x={x} y={margin.top + innerHeight + 16} textAnchor="middle" fontSize="10" fill="#6d5b4e">
                  {formatDayLabel(point.day)}
                </text>
              ) : null}
            </g>
          );
        })}

      </svg>
  );
}
