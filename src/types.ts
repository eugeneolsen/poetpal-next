export type SynAnt = "synonym" | "antonym";
export type SylMode = "exact" | "less";

export interface DatamuseWord {
    word: string;
    score?: number;
    numSyllables?: number;
    // Datamuse can send extra stuff – we ignore it
    [key: string]: unknown;
}

export interface SearchState {
    rhyme: string;
    starts: string;
    synAntChoice: SynAnt;
    synAntWord: string;
    syllableMode: SylMode;
    syllables: string; // keep as string for controlled input
}

export interface SearchResult {
    perfect: DatamuseWord[];
    imperfect: DatamuseWord[];
}
