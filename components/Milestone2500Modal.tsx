"use client";

interface Milestone2500ModalProps {
  open: boolean;
  onClose: () => void;
}

export function Milestone2500Modal({ open, onClose }: Milestone2500ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[92] flex items-center justify-center bg-black/35 px-4">
      <div className="w-full max-w-md rounded-2xl border border-line bg-white p-5 shadow-card">
        <h2 className="text-lg font-semibold text-stone-900">你识字了!!</h2>
        <p className="mt-3 text-sm leading-6 text-stone-700">
          With ~2,500 of the most common characters, you can recognize roughly 98-99% of characters used in
          modern Chinese text.
        </p>
        <p className="mt-2 text-sm font-medium leading-6 text-stone-900">Functionally literate.</p>
        <p className="mt-2 text-sm leading-6 text-stone-700">
          And you&apos;re not done. The full database contains 9,000+ characters - rare forms, classical
          vocabulary, and technical terms still waiting to be logged.
        </p>
        <p className="mt-2 text-sm leading-6 text-stone-700">Regardless, this is your moment. You earned this!</p>
        <p className="mt-2 text-sm leading-6 text-stone-700">
          If this tracker played even a small role in your journey, you can{" "}
          <a
            href="https://buymeacoffee.com/lastnamelo"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            support this project
          </a>{" "}
          to help keep it available for the next learner.
        </p>
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-stone-900 px-4 py-2 text-sm text-white hover:bg-stone-800"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

