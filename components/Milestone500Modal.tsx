"use client";

interface Milestone500ModalProps {
  open: boolean;
  onClose: () => void;
}

export function Milestone500Modal({ open, onClose }: Milestone500ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35 px-4">
      <div className="w-full max-w-md rounded-2xl border border-line bg-white p-5 shadow-card">
        <h2 className="text-lg font-semibold text-stone-900">You&apos;ve logged 500 characters!</h2>
        <p className="mt-3 text-sm leading-6 text-stone-700">
          You now recognize roughly 70-75% of the characters that appear in everyday modern Chinese text.
        </p>
        <p className="mt-2 text-sm leading-6 text-stone-700">
          That&apos;s about what a native first grader reads--and about where many first-year college
          students land.
        </p>
        <p className="mt-3 text-base font-medium text-stone-900">不错！</p>
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-stone-900 px-4 py-2 text-sm text-white hover:bg-stone-800"
          >
            Nice
          </button>
        </div>
      </div>
    </div>
  );
}
