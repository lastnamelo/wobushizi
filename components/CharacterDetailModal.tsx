"use client";

import { FormEvent, useEffect, useState } from "react";
import { lookupHanziEntry } from "@/lib/hanzidb";
import { getHskMutedBgValue, normalizeHskLevel } from "@/lib/hskStyles";
import { addCharacterWordLocal, fetchCharacterWordsLocal, removeCharacterWordLocal } from "@/lib/localStore";
import { CharacterStatus } from "@/lib/types";

interface CharacterDetailModalProps {
  character: string | null;
  status?: CharacterStatus | "none";
  quickAddSuggestions?: string[];
  onSetStatus?: (status: CharacterStatus) => void | Promise<void>;
  onPrev?: () => void;
  onNext?: () => void;
  canPrev?: boolean;
  canNext?: boolean;
  onClose: () => void;
}

export function CharacterDetailModal({
  character,
  status,
  quickAddSuggestions = [],
  onSetStatus,
  onPrev,
  onNext,
  canPrev = false,
  canNext = false,
  onClose
}: CharacterDetailModalProps) {
  const [face, setFace] = useState<0 | 1 | 2>(0);
  const [words, setWords] = useState<Array<{ id: string; word: string; note?: string | null }>>([]);
  const [wordInput, setWordInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [quickAddBusyWord, setQuickAddBusyWord] = useState<string | null>(null);
  const [quickAddNotes, setQuickAddNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && canPrev) onPrev?.();
      if (event.key === "ArrowRight" && canNext) onNext?.();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canNext, canPrev, onClose, onNext, onPrev]);

  useEffect(() => {
    if (!character) return;
    setFace(0);
    setWordInput("");
    setNoteInput("");
    setMessage(null);
    setQuickAddBusyWord(null);
    setQuickAddNotes({});
    setBusy(true);
    fetchCharacterWordsLocal(character)
      .then((rows) => {
        setWords(rows.map((row) => ({ id: row.id, word: row.word, note: row.note ?? null })));
      })
      .catch((err: Error) => {
        setMessage(err.message);
      })
      .finally(() => setBusy(false));
  }, [character]);

  if (!character) return null;

  const meta = lookupHanziEntry(character);
  const displayChar = meta?.character ? String(meta.character) : character;
  const trad = String(meta?.traditional_character ?? "").trim();
  const altRaw = String(meta?.alternate_characters ?? "").trim();
  const altList = altRaw
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => s !== trad);
  const pinyinPrimary = String(meta?.pinyin ?? "").trim();
  const pinyinAlt = String(meta?.pinyin_alternates ?? "")
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
  const pinyinDisplay = [pinyinPrimary, ...pinyinAlt].filter(Boolean).join(" / ") || "-";
  const level = normalizeHskLevel(meta?.hsk_level);
  const isKnown = status === "known";
  const showStatusToggle = Boolean(onSetStatus);
  const wordsAtCap = words.length >= 3;
  const savedWordSet = new Set(words.map((entry) => entry.word.trim()));
  const visibleQuickAddSuggestions = quickAddSuggestions.filter(
    (word) => !savedWordSet.has(word.trim())
  );

  function cycleFace() {
    setFace((prev) => (prev === 2 ? 0 : ((prev + 1) as 0 | 1 | 2)));
  }

  function shouldIgnoreCycleClick(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    if (target.closest("button, input, textarea, select, a, label")) return true;
    return false;
  }

  async function handleAddWord(e: FormEvent) {
    e.preventDefault();
    if (!character || !wordInput.trim() || wordsAtCap || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      await addCharacterWordLocal(character, wordInput, noteInput, "manual");
      const rows = await fetchCharacterWordsLocal(character);
      setWords(rows.map((row) => ({ id: row.id, word: row.word, note: row.note ?? null })));
      setWordInput("");
      setNoteInput("");
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveWord(id: string) {
    if (!character) return;
    setBusy(true);
    setMessage(null);
    try {
      await removeCharacterWordLocal(id);
      const rows = await fetchCharacterWordsLocal(character);
      setWords(rows.map((row) => ({ id: row.id, word: row.word, note: row.note ?? null })));
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleQuickAddWord(word: string) {
    if (!character || !word.trim() || busy || wordsAtCap) return;
    const note = quickAddNotes[word]?.trim() ?? "";
    setQuickAddBusyWord(word);
    setMessage(null);
    try {
      await addCharacterWordLocal(character, word, note, "quick_add");
      const rows = await fetchCharacterWordsLocal(character);
      setWords(rows.map((row) => ({ id: row.id, word: row.word, note: row.note ?? null })));
      setQuickAddNotes((prev) => ({ ...prev, [word]: "" }));
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setQuickAddBusyWord(null);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/35 p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-md rounded-2xl border border-line bg-white p-5 text-center shadow-card"
        onClick={(e) => {
          e.stopPropagation();
          if (shouldIgnoreCycleClick(e.target)) return;
          cycleFace();
        }}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-2 text-sm text-[#806252] hover:text-stone-800"
          aria-label="Close"
        >
          x
        </button>
        <div className="mb-4 flex items-center justify-center gap-2 text-sm text-stone-700">
          <button
            type="button"
            onClick={() => setFace(0)}
            className={face === 0 ? "px-1 font-semibold text-stone-900" : "px-1 text-stone-700 hover:text-stone-900"}
          >
            Character
          </button>
          <span className="text-[10px] text-stone-400">•</span>
          <button
            type="button"
            onClick={() => setFace(1)}
            className={face === 1 ? "px-1 font-semibold text-stone-900" : "px-1 text-stone-700 hover:text-stone-900"}
          >
            Words
          </button>
          <span className="text-[10px] text-stone-400">•</span>
          <button
            type="button"
            onClick={() => setFace(2)}
            className={face === 2 ? "px-1 font-semibold text-stone-900" : "px-1 text-stone-700 hover:text-stone-900"}
          >
            Reveal
          </button>
        </div>
        <div className="mt-5 min-h-[240px]">
        {face === 0 ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center text-center">
            <div className="text-6xl text-stone-900">{displayChar}</div>
            <p className="mt-3 text-sm text-stone-600">as in</p>
            {words.length > 0 ? (
              <p className="mt-1 text-sm text-stone-700">{words.map((entry) => entry.word).join(" / ")}</p>
            ) : (
              <p className="mt-1 text-sm italic text-stone-500">no words saved</p>
            )}
          </div>
        ) : null}

        {face === 1 ? (
          <div className="flex min-h-[240px] flex-col justify-start space-y-3 text-center">
            <div className="rounded-xl border border-line bg-stone-50 p-3">
              <form onSubmit={handleAddWord} className="space-y-2">
                <div className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
                  <input
                    value={wordInput}
                    onChange={(e) => setWordInput(e.target.value)}
                    placeholder="Word"
                    className="h-9 border-b border-line bg-transparent px-1 text-center text-sm outline-none focus:border-stone-500"
                    disabled={busy || wordsAtCap}
                  />
                  <input
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder="Definition"
                    className="h-9 border-b border-line bg-transparent px-1 text-center text-sm outline-none focus:border-stone-500"
                    disabled={busy || wordsAtCap}
                  />
                  <button
                    type="submit"
                    className="h-9 w-9 text-lg leading-none text-stone-700 hover:text-stone-900"
                  >
                    +
                  </button>
                </div>
              </form>

              {visibleQuickAddSuggestions.length > 0 ? (
                <div className="space-y-2 pt-2">
                  {visibleQuickAddSuggestions.map((word) => {
                    const normalized = word.trim();
                    const isBusy = quickAddBusyWord === normalized;
                    return (
                      <div key={normalized} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
                        <div className="h-9 truncate border-b border-line px-1 text-center text-sm leading-9 text-stone-800">
                          {normalized}
                        </div>
                        <input
                          value={quickAddNotes[normalized] ?? ""}
                          onChange={(e) =>
                            setQuickAddNotes((prev) => ({ ...prev, [normalized]: e.target.value }))
                          }
                          placeholder="Definition"
                          className="h-9 border-b border-line bg-transparent px-1 text-center text-sm outline-none focus:border-stone-500"
                          disabled={wordsAtCap || Boolean(quickAddBusyWord)}
                        />
                        <button
                          type="button"
                          onClick={() => handleQuickAddWord(normalized)}
                          className="h-9 w-9 text-lg leading-none text-stone-700 hover:text-stone-900"
                        >
                          {isBusy ? "…" : "+"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <p className="text-sm text-stone-500">{words.length}/3 saved</p>

            <div className="rounded-xl border border-line bg-white p-3">
              {words.length === 0 ? (
                <p className="text-sm italic text-stone-500">no words saved</p>
              ) : (
                <ul className="space-y-2">
                  {words.map((entry) => (
                    <li key={entry.id} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
                      <p className="h-9 truncate px-1 text-sm leading-9 text-stone-900">
                        {entry.word}
                      </p>
                      <p className="h-9 truncate px-1 text-sm leading-9 text-stone-600">
                        {entry.note || "-"}
                      </p>
                      <button
                        onClick={() => handleRemoveWord(entry.id)}
                        className="px-2 text-sm text-stone-500 hover:text-stone-800"
                        aria-label="Remove word"
                      >
                        x
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}

        {face === 2 ? (
          <div className="flex min-h-[240px] flex-col justify-center space-y-2 text-sm text-stone-700">
            <div className="mb-3">
              <div className="text-4xl text-stone-900">{displayChar}</div>
              <div className="mt-1 text-sm text-stone-700">{pinyinDisplay}</div>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="font-semibold text-[#806252]">HSK</span>
              <span
                className="inline-block rounded-full px-2 py-0.5 text-sm text-stone-900"
                style={{ backgroundColor: getHskMutedBgValue(level), color: "#111827" }}
              >
                {meta?.hsk_level ?? "-"}
              </span>
              <span className="ml-2 font-semibold text-[#806252]">Freq</span>
              <span>{String(meta?.frequency ?? "-")}</span>
            </div>
            <div>
              <span className="font-semibold text-[#806252]">Definition</span>
              <p className="mt-0.5 leading-6">{String(meta?.definition ?? "-")}</p>
            </div>
            <div>
              <span className="font-semibold text-[#806252]">Traditional / Alt</span>
              <p className="mt-0.5 text-base">
                {[trad, ...altList].filter(Boolean).join(" / ") || "-"}
              </p>
            </div>
          </div>
        ) : null}
        </div>

        {message ? <p className="mt-2 text-sm text-rose-700">{message}</p> : null}

        {showStatusToggle ? (
          <div className="mt-3 flex justify-center">
            <button
              onClick={() => onSetStatus?.(isKnown ? "study" : "known")}
              className={`relative inline-flex h-7 w-12 items-center rounded-full border transition ${
                isKnown ? "border-emerald-600 bg-emerald-600" : "border-stone-300 bg-stone-300"
              }`}
              title={isKnown ? "Switch to study" : "Switch to known"}
              aria-label={isKnown ? "Known (on)" : "Known (off)"}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  isKnown ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        ) : null}

        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onPrev}
            disabled={!canPrev}
            className="px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-100 disabled:opacity-35"
            aria-label="Previous character"
          >
            {"<"}
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-stone-600">next word</span>
            <button
              type="button"
              onClick={onNext}
              disabled={!canNext}
              className="px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-100 disabled:opacity-35"
              aria-label="Next character"
            >
              {">"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
