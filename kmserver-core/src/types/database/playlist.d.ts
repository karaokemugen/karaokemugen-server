import { DBPLBase } from '../../lib/types/database/playlist.js';

export interface DBPL extends DBPLBase {
    favorited?: number;
	flag_favorites?: boolean;
}
