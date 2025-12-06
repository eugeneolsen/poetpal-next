import { DatamuseWord } from "@/types";

interface ResultsTableProps {
    filteredPerfect: DatamuseWord[];
    filteredImperfect: DatamuseWord[];
    handleCopy: (word: string) => void;
    copiedWord: string | null;
}

export default function ResultsTable({
    filteredPerfect,
    filteredImperfect,
    handleCopy,
    copiedWord,
}: ResultsTableProps) {
    if (filteredPerfect.length === 0 && filteredImperfect.length === 0) {
        return null;
    }

    return (
        <div className="overflow-x-auto rounded-lg bg-white/80 shadow">
            <table className="min-w-full border-collapse">
                <thead>
                    <tr className="bg-sky-50 text-slate-800">
                        <th className="px-3 py-2 text-left text-lg font-normal">Word</th>
                        <th
                            className="px-3 py-2 text-right text-lg font-normal"
                            title="Score indicates how closely the rhyme matches the target word. The higher the score, the closer the match."
                        >
                            Score
                        </th>
                        <th className="px-3 py-2 text-center text-lg font-normal">
                            Syllables
                        </th>
                        <th className="px-3 py-2 text-center text-lg font-normal">Copy</th>
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
    );
}
