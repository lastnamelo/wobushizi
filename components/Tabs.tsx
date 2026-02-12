interface TabOption {
  key: string;
  label: string;
}

interface TabsProps {
  current: string;
  options: TabOption[];
  onChange: (key: string) => void;
}

export function Tabs({ current, options, onChange }: TabsProps) {
  return (
    <div className="mb-4 inline-flex rounded-full border border-line bg-white p-1 shadow-card">
      {options.map((option) => {
        const active = current === option.key;
        return (
          <button
            key={option.key}
            onClick={() => onChange(option.key)}
            className={`rounded-full px-4 py-1.5 text-sm transition ${
              active ? "bg-stone-800 text-white" : "text-stone-600 hover:text-stone-900"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
