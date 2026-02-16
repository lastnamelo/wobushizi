"use client";

interface Milestone1000ModalProps {
  open: boolean;
  onClose: () => void;
}

export function Milestone1000Modal({ open, onClose }: Milestone1000ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[91] flex items-center justify-center bg-black/35 px-4">
      <div className="w-full max-w-md rounded-2xl border border-line bg-white p-5 shadow-card">
        <h2 className="text-lg font-semibold text-stone-900">一千字！</h2>
        <p className="mt-3 text-sm leading-6 text-stone-700">
          You can now recognize roughly 85-90% of the characters used in modern general text.
        </p>
        <p className="mt-2 text-sm leading-6 text-stone-700">
          That&apos;s solid intermediate territory - often around where two years of college Chinese can
          land.
        </p>
        <p className="mt-2 text-sm leading-6 text-stone-700">
          If you&apos;ve reached this milestone, you&apos;ve put real time into this app. That makes me so
          happy.
        </p>
        <p className="mt-2 text-sm leading-6 text-stone-700">
          If this tracker has helped you or you&apos;ve had fun using it, please consider{" "}
          <a
            href="https://buymeacoffee.com/lastnamelo"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            buying me a coffee
          </a>{" "}
          to help keep the project alive.
        </p>
        <p className="mt-3 text-sm font-medium leading-6 text-stone-900">Well done - and keep logging!</p>
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

