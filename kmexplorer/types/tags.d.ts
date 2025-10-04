import type { DBKaraTag } from '%/lib/types/database/kara';

export interface ShortTag {
	name: string,
	slug: string,
	type: string,
	tag: DBKaraTag
}
