import { DBKara } from '../lib/types/database/kara.js';

export interface EditElement {
	kid: string
	modifiedLyrics: boolean
	modifiedMedia: boolean,
	oldKara?: DBKara,
	inid?: string,
	fix?: boolean,
}
