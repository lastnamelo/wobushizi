interface ProgressBarProps {
  knownCount: number;
  target?: number;
}

export function ProgressBar({ knownCount, target = 2500 }: ProgressBarProps) {
  const ratio = Math.min(knownCount / target, 1);

  return (
    <div className="mx-auto mt-5 w-full max-w-md">
      <p className="mb-2 text-center text-sm text-stone-600">Known {knownCount} / {target}</p>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-200">
        <div
          className="h-full rounded-full bg-stone-500 transition-all"
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </div>
  );
}
