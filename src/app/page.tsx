"use client";

import { FormEvent, useMemo, useState } from "react";
import { offensive } from "@/lib/offensiveb64";
import { SearchState, SearchResult, SylMode } from "@/types";
import { getWordLists } from "@/lib/datamuse";
import SearchForm from "@/components/SearchForm";
import ResultsTable from "@/components/ResultsTable";

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



  const filteredPerfect = useMemo(
    () =>
      results.perfect
        .filter((w) => !isProfane(w.word))
        .filter((w) =>
          passesSyllableFilter(
            w.numSyllables,
            syllablesNumeric,
            state.syllableMode
          )
        ),
    [results.perfect, syllablesNumeric, state.syllableMode]
  );

  const filteredImperfect = useMemo(
    () =>
      results.imperfect
        .filter((w) => !isProfane(w.word))
        .filter((w) =>
          passesSyllableFilter(
            w.numSyllables,
            syllablesNumeric,
            state.syllableMode
          )
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
        <SearchForm
          state={state}
          setState={setState}
          handleSubmit={handleSubmit}
          handleClear={handleClear}
          isLoading={isLoading}
        />
      </section>

      <section className="mt-16 w-full max-w-xl px-4 pb-16">
        {error && (
          <div className="mb-2 text-center text-lg text-red-700">{error}</div>
        )}
        {info && !error && (
          <div className="mb-2 text-left text-base text-slate-700">{info}</div>
        )}

        <ResultsTable
          filteredPerfect={filteredPerfect}
          filteredImperfect={filteredImperfect}
          handleCopy={handleCopy}
          copiedWord={copiedWord}
        />

        <footer className="mt-4 text-center text-s font-sans text-slate-700">
          &copy; 2025 Eugene C. Olsen
        </footer>
      </section>
    </main>
  );
}
