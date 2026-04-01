"use client";

import { useEffect, useState } from "react";

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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const width = 760;
  const height = isMobile ? 460 : 360;
  const margin = isMobile
    ? { top: 16, right: 12, bottom: 38, left: 34 }
    : { top: 20, right: 18, bottom: 52, left: 50 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const maxY = Math.max(1, ...points.map((p) => p.count));
  const yTickCount = isMobile ? 2 : 3;
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

  const xLabelStep = isMobile
    ? Math.max(1, Math.ceil(points.length / 3))
    : Math.max(1, Math.ceil(points.length / 5));

  return (
    <div className="overflow-hidden rounded-2xl bg-white">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={isMobile ? "h-[420px] w-full" : "h-[340px] w-full md:h-[380px]"}
      >
        <rect x="0" y="0" width={width} height={height} fill="#ffffff" />
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
              <text
                x={margin.left - (isMobile ? 6 : 10)}
                y={y + (isMobile ? 4 : 5)}
                textAnchor="end"
                fontSize={isMobile ? 11 : 13}
                fill="#6d5b4e"
              >
                {tick}
              </text>
            </g>
          );
        })}

        <polyline fill="none" stroke="#7d7369" strokeWidth={isMobile ? 5.2 : 4.6} points={polylinePoints} />

        {points.map((point, i) => {
          const x = xFor(i);
          const showLabel =
            i === 0 ||
            i === points.length - 1 ||
            (isMobile && i === Math.floor((points.length - 1) / 2)) ||
            (!isMobile && i % xLabelStep === 0);
          return (
            <g key={`${point.day}-${i}`}>
              {showLabel ? (
                <text
                  x={x}
                  y={margin.top + innerHeight + (isMobile ? 18 : 24)}
                  textAnchor="middle"
                  fontSize={isMobile ? 11 : 12}
                  fill="#6d5b4e"
                >
                  {formatDayLabel(point.day)}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
