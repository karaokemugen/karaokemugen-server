import { DBPLBase } from '../../lib/types/database/playlist.js';

export interface DBPL extends DBPLBase {
    description?: string;
    slug?: string;
    contributors?: string[];
    flag_visible: boolean;
}
