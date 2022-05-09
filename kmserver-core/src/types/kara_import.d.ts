import { DBKara } from "../lib/types/database/kara"

export interface EditElement {
	kid: string
	modifiedLyrics: boolean
	modifiedMedia: boolean,
	oldKara?: DBKara
}
