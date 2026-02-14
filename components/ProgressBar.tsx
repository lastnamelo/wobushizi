interface ProgressBarProps {
  knownCount: number;
  target?: number;
}

export function ProgressBar({ knownCount, target = 2500 }: ProgressBarProps) {
  const ratio = Math.min(knownCount / target, 1);

  return (
    <div className="mx-auto mt-2 w-full max-w-md">
      <div className="h-2.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: "#ddd6cc" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${ratio * 100}%`, backgroundColor: "#8c8378" }}
        />
      </div>
      <p className="mt-1 text-center text-sm text-stone-600">{knownCount} / {target}</p>
    </div>
  );
}
