"use client";

import { FormEvent, useMemo, useState } from "react";
import { offensive } from "@/lib/offensiveb64";

const DATAMUSE_URL = "https://api.datamuse.com/words?";

type SynAnt = "synonym" | "antonym";
type SylMode = "exact" | "less";

interface DatamuseWord {
  word: string;
  score?: number;
  numSyllables?: number;
  // Datamuse can send extra stuff – we ignore it
  [key: string]: unknown;
}

interface SearchState {
  rhyme: string;
  starts: string;
  synAntChoice: SynAnt;
  synAntWord: string;
  syllableMode: SylMode;
  syllables: string; // keep as string for controlled input
}

interface SearchResult {
  perfect: DatamuseWord[];
  imperfect: DatamuseWord[];
}

function buildQuery(perfect: boolean, state: SearchState): string | null {
  const params: string[] = [];
  const rhyme = state.rhyme.trim();
  const starts = state.starts.trim();
  const synWord = state.synAntWord.trim();

  if (rhyme) {
    if (perfect) {
      params.push(`rel_rhy=${encodeURIComponent(rhyme)}`);
    } else {
      params.push(`rel_nry=${encodeURIComponent(rhyme)}`);
    }
  } else if (!perfect) {
    // In your original app, near-rhyme query is skipped if there's no rhyme word
    return null;
  }

  if (starts) {
    params.push(`sp=${encodeURIComponent(starts)}*`);
  }

  if (synWord) {
    if (state.synAntChoice === "synonym") {
      params.push(`rel_syn=${encodeURIComponent(synWord)}`);
    } else {
      params.push(`rel_ant=${encodeURIComponent(synWord)}`);
    }
  }

  if (params.length === 0) return null;

  params.push("max=50");
  return params.join("&");
}

async function fetchWordList(query: string): Promise<DatamuseWord[]> {
  const url = `${DATAMUSE_URL}${query}`;
  const resp = await fetch(url);

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(
      `Datamuse error ${resp.status}${text ? `: ${text}` : ""}`
    );
  }

  const data = (await resp.json()) as DatamuseWord[];
  return data;
}

async function getWordLists(state: SearchState): Promise<SearchResult> {
  const perfectQuery = buildQuery(true, state);
  const imperfectQuery = buildQuery(false, state);

  const [perfect, imperfect] = await Promise.all([
    perfectQuery ? fetchWordList(perfectQuery) : Promise.resolve([]),
    imperfectQuery ? fetchWordList(imperfectQuery) : Promise.resolve([]),
  ]);

  return { perfect, imperfect };
}

function isProfane(word: string): boolean {
  const b64 = typeof btoa === "function" ? btoa(word) : "";
  return offensive.has(b64);
}

function passesSyllableFilter(
  itemSyllables: number | undefined,
  requested: number,
  mode: SylMode
): boolean {
  if (!requested || requested <= 0) return true;
  if (typeof itemSyllables !== "number") return true;

  if (mode === "exact") {
    return itemSyllables === requested;
  }

  // "less than"
  return itemSyllables < requested;
}

export default function Page() {
  const [state, setState] = useState<SearchState>({
    rhyme: "",
    starts: "",
    synAntChoice: "synonym",
    synAntWord: "",
    syllableMode: "exact",
    syllables: "",
  });

  const [results, setResults] = useState<SearchResult>({
    perfect: [],
    imperfect: [],
  });

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedWord, setCopiedWord] = useState<string | null>(null);

  const syllablesNumeric = useMemo(
    () => (state.syllables ? parseInt(state.syllables, 10) || 0 : 0),
    [state.syllables]
  );

  const syllableDisabled = state.rhyme.trim().length === 0;

  const filteredPerfect = useMemo(
    () =>
      results.perfect
        .filter((w) => !isProfane(w.word))
        .filter((w) =>
          passesSyllableFilter(w.numSyllables, syllablesNumeric, state.syllableMode)
        ),
    [results.perfect, syllablesNumeric, state.syllableMode]
  );

  const filteredImperfect = useMemo(
    () =>
      results.imperfect
        .filter((w) => !isProfane(w.word))
        .filter((w) =>
          passesSyllableFilter(w.numSyllables, syllablesNumeric, state.syllableMode)
        ),
    [results.imperfect, syllablesNumeric, state.syllableMode]
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setCopiedWord(null);

    // Nothing entered at all – mirror your original behavior: just do nothing.
    if (
      !state.rhyme.trim() &&
      !state.starts.trim() &&
      !state.synAntWord.trim()
    ) {
      setError("Please enter at least one search term.");
      return;
    }

    try {
      setIsLoading(true);
      const nextResults = await getWordLists(state);
      setResults(nextResults);

      const totalPerfect = nextResults.perfect.length;
      const totalImperfect = nextResults.imperfect.length;

      if (totalPerfect === 0 && totalImperfect === 0) {
        setInfo("No results found. Try adjusting your filters.");
      } else if (totalImperfect > 0) {
        setInfo(
          `Showing ${totalPerfect} perfect rhymes and ${totalImperfect} near rhymes.`
        );
      } else {
        setInfo(`Showing ${totalPerfect} perfect rhymes.`);
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Unexpected error contacting API.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }

  function handleClear() {
    setState({
      rhyme: "",
      starts: "",
      synAntChoice: "synonym",
      synAntWord: "",
      syllableMode: "exact",
      syllables: "",
    });
    setResults({ perfect: [], imperfect: [] });
    setError(null);
    setInfo(null);
    setCopiedWord(null);
  }

  async function handleCopy(word: string) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(word);
        setCopiedWord(word);
        setTimeout(() => setCopiedWord(null), 2000);
      } else {
        // Fallback – best effort
        const ta = document.createElement("textarea");
        ta.value = word;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopiedWord(word);
        setTimeout(() => setCopiedWord(null), 2000);
      }
    } catch {
      setError("Unable to copy to clipboard.");
    }
  }

  const syllableLabel =
    syllablesNumeric === 1 ? "syllable" : "syllables";

  return (
    <main className="flex min-h-screen flex-col items-center pb-8">
      <header className="mt-6 text-center">
        <h1 className="text-4xl md:text-5xl text-slate-800 tracking-wide">
          Poet&apos;s Pal&trade;
        </h1>
        <h2 className="mt-1 text-base md:text-lg italic text-slate-600">
          Powered by AI
        </h2>
      </header>

      <section className="mt-6 w-full max-w-xl px-4">
        <form
          onSubmit={handleSubmit}
          className="w-full space-y-4 rounded-lg bg-transparent"
        >
          <div className="flex flex-col gap-6">
            <div className="flex items-baseline gap-6">
              <label className="w-40 text-left text-4xl whitespace-nowrap">
                Rhymes with
              </label>
              <input
                type="text"
                className="w-88 rounded-lg border border-slate-300 bg-[#f8ffff] hover:bg-[#dde7ea] px-4 py-2 text-4xl font-sans focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
                value={state.rhyme}
                onChange={(e) =>
                  setState((s) => ({ ...s, rhyme: e.target.value }))
                }
              />
            </div>

            <div className="flex items-baseline gap-6">
              <label className="w-40 text-left text-4xl whitespace-nowrap">
                Starts with
              </label>
              <input
                type="text"
                className="w-88 rounded-lg border border-slate-300 bg-[#f8ffff] hover:bg-[#dde7ea] px-4 py-2 text-4xl font-sans focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
                value={state.starts}
                onChange={(e) =>
                  setState((s) => ({ ...s, starts: e.target.value }))
                }
              />
            </div>

            <div className="flex items-baseline gap-6">
              <label className="w-40 text-left text-4xl whitespace-nowrap">
                <select
                  className="mr-2 rounded-lg border border-slate-300 bg-white px-2 py-1 text-2xl align-baseline"
                  value={state.synAntChoice}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      synAntChoice: e.target.value as SynAnt,
                    }))
                  }
                >
                  <option value="synonym">Synonyms</option>
                  <option value="antonym">Antonyms</option>
                </select>
                of
              </label>
              <input
                type="text"
                className="w-88 rounded-lg border border-slate-300 bg-[#f8ffff] hover:bg-[#dde7ea] px-4 py-2 text-4xl font-sans focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
                value={state.synAntWord}
                onChange={(e) =>
                  setState((s) => ({ ...s, synAntWord: e.target.value }))
                }
              />
            </div>

            <div className="flex items-baseline gap-6">
              <label
                className={`w-40 text-left text-2xl whitespace-nowrap ${syllableDisabled ? "text-slate-400" : "text-slate-800"
                  }`}
              >
                <span className="mr-2 text-xl align-middle">and</span>
                <select
                  className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-2xl align-baseline"
                  disabled={syllableDisabled}
                  value={state.syllableMode}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      syllableMode: e.target.value as SylMode,
                    }))
                  }
                >
                  <option value="exact">exactly</option>
                  <option value="less">less than</option>
                </select>
              </label>
              <div
                className={`flex items-center gap-4 ${syllableDisabled ? "text-slate-400" : ""
                  }`}
              >
                <input
                  type="number"
                  min={state.syllableMode === "exact" ? 1 : 2}
                  max={20}
                  disabled={syllableDisabled}
                  className="w-32 rounded-lg border border-slate-300 bg-[#f8ffff] hover:bg-[#dde7ea] px-2 py-2 text-3xl font-sans focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:bg-slate-100"
                  value={state.syllables}
                  onChange={(e) =>
                    setState((s) => ({ ...s, syllables: e.target.value }))
                  }
                />
                <span className="text-4xl">{syllableLabel}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="rounded bg-sky-500 px-6 py-2 text-3xl text-white shadow hover:bg-sky-600 disabled:opacity-60"
            >
              {isLoading ? "Searching..." : "Submit"}
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="rounded border border-slate-300 bg-white hover:bg-[#dde7ea] px-6 py-2 text-3xl text-slate-700 shadow"
            >
              Clear
            </button>
          </div>
        </form>
      </section>

      <section className="mt-16 w-full max-w-xl px-4 pb-16">
        {error && (
          <div className="mb-2 text-center text-lg text-red-700">
            {error}
          </div>
        )}
        {info && !error && (
          <div className="mb-2 text-left text-base text-slate-700">
            {info}
          </div>
        )}

        {(filteredPerfect.length > 0 || filteredImperfect.length > 0) && (
          <div className="overflow-x-auto rounded-lg bg-white/80 shadow">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-sky-50 text-slate-800">
                  <th className="px-3 py-2 text-left text-lg font-normal">
                    Word
                  </th>
                  <th
                    className="px-3 py-2 text-right text-lg font-normal"
                    title="Score indicates how closely the rhyme matches the target word. The higher the score, the closer the match."
                  >
                    Score
                  </th>
                  <th className="px-3 py-2 text-center text-lg font-normal">
                    Syllables
                  </th>
                  <th className="px-3 py-2 text-center text-lg font-normal">
                    Copy
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPerfect.map((item) => (
                  <tr
                    key={`p-${item.word}-${item.score ?? ""}`}
                    className="border-t border-slate-100 odd:bg-sky-50/40"
                  >
                    <td className="px-3 py-1 text-left text-xl font-serif">
                      {item.word}
                    </td>
                    <td className="px-3 py-1 text-right text-lg font-serif">
                      {item.score ?? ""}
                    </td>
                    <td className="px-3 py-1 text-center text-lg font-serif">
                      {item.numSyllables ?? ""}
                    </td>
                    <td className="px-3 py-1 text-center">
                      <button
                        type="button"
                        onClick={() => handleCopy(item.word)}
                        aria-label={`Copy ${item.word}`}
                        className="text-xl"
                      >
                        {copiedWord === item.word ? "✅" : "📋"}
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredImperfect.map((item) => (
                  <tr
                    key={`i-${item.word}-${item.score ?? ""}`}
                    className="border-t border-slate-100 odd:bg-sky-50/40"
                  >
                    <td className="px-3 py-1 text-left text-xl font-serif">
                      <em>{item.word}</em>
                    </td>
                    <td className="px-3 py-1 text-right text-lg font-serif">
                      {item.score ?? ""}
                    </td>
                    <td className="px-3 py-1 text-center text-lg font-serif">
                      {item.numSyllables ?? ""}
                    </td>
                    <td className="px-3 py-1 text-center">
                      <button
                        type="button"
                        onClick={() => handleCopy(item.word)}
                        aria-label={`Copy ${item.word}`}
                        className="text-xl"
                      >
                        {copiedWord === item.word ? "✅" : "📋"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <footer className="mt-4 text-center text-s font-sans text-slate-700">
          &copy; 2025 Eugene C. Olsen
        </footer>
      </section>
    </main>
  );
}
