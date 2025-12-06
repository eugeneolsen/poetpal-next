import { SearchState, SearchResult, DatamuseWord } from "@/types";

const DATAMUSE_URL = "https://api.datamuse.com/words?";

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

export async function getWordLists(state: SearchState): Promise<SearchResult> {
    const perfectQuery = buildQuery(true, state);
    const imperfectQuery = buildQuery(false, state);

    const [perfect, imperfect] = await Promise.all([
        perfectQuery ? fetchWordList(perfectQuery) : Promise.resolve([]),
        imperfectQuery ? fetchWordList(imperfectQuery) : Promise.resolve([]),
    ]);

    return { perfect, imperfect };
}
