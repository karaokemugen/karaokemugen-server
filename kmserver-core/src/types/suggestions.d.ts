export type SuggestionOrderParam =
	| 'likes'
	| 'az'
	| 'language';

export interface Suggestion {
	id?: number,
	song: string,
	language: string,
	source: string,
	likes?: number,
	created_at?: Date,
	count?: number
}

export interface SuggestionParams {
	filter?: string;
	from?: number;
	size?: number;
	random?: number;
	order?: SuggestionOrderParam;
	languages?: string[]
}

export interface SuggestionIssue {
	title: string;
	serie?:string;
	singer: string;
	version?:string;
	link:string;
	lyricsLink?: string;
	comment?: string;
	username: string;
}