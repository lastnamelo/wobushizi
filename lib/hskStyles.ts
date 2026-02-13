export function getHskColorValue(level: number | null | undefined): string {
  switch (level) {
    case 1:
      return "#c41d0e";
    case 2:
      return "#15803d";
    case 3:
      return "#1d4ed8";
    case 4:
      return "#fa6f19";
    case 5:
      return "#8f7bbf";
    case 6:
      return "#f74f90";
    default:
      return "#6b7280";
  }
}

export function normalizeHskLevel(level: unknown): number | null {
  if (typeof level === "number" && Number.isFinite(level)) return level;
  if (typeof level === "string") {
    const parsed = Number(level);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export function getHskMutedBgValue(level: number | null | undefined): string {
  switch (level) {
    case 1:
      return "#d97777";
    case 2:
      return "#71997f";
    case 3:
      return "#6b96cf";
    case 4:
      return "#c79161";
    case 5:
      return "#8e7fb0";
    case 6:
      return "#d48aa0";
    default:
      return "#9ca3af";
  }
}

export function getHskTextColor(level: number | null | undefined): string {
  switch (level) {
    case 1:
      return "text-red-700";
    case 2:
      return "text-green-700";
    case 3:
      return "text-blue-700";
    case 4:
      return "text-orange-600";
    case 5:
      return "text-violet-500";
    case 6:
      return "text-pink-500";
    default:
      return "text-stone-500";
  }
}

export function getHskSoftBg(level: number | null | undefined): string {
  switch (level) {
    case 1:
      return "bg-red-100";
    case 2:
      return "bg-green-100";
    case 3:
      return "bg-blue-100";
    case 4:
      return "bg-orange-100";
    case 5:
      return "bg-violet-100";
    case 6:
      return "bg-pink-100";
    default:
      return "bg-slate-200";
  }
}
