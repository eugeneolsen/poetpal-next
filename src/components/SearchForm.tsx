import { Dispatch, SetStateAction, FormEvent } from "react";
import { SearchState, SynAnt, SylMode } from "@/types";

interface SearchFormProps {
    state: SearchState;
    setState: Dispatch<SetStateAction<SearchState>>;
    handleSubmit: (e: FormEvent) => void;
    handleClear: () => void;
    isLoading: boolean;
    syllableDisabled: boolean;
    syllableLabel: string;
}

export default function SearchForm({
    state,
    setState,
    handleSubmit,
    handleClear,
    isLoading,
    syllableDisabled,
    syllableLabel,
}: SearchFormProps) {
    return (
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
    );
}
