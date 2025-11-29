import {DBList} from '../lib/types/database/database.js';
import {DBUser} from '../lib/types/database/user.js';

export interface UserOptions {
    password?: boolean,
    public?: boolean,
	contact?: boolean
}

export interface UserParams {
	filter?: string,
	from?: number,
	size?: number,
	publicOnly?: boolean,
	roles?: Roles,
	username?: string,
	nickname?: string,
}

export interface UserList extends DBList {
	content: DBUser[]
}

export type BanType = 'email' | 'nickname' | 'username';

export interface Ban {
	type: BanType;
	value: string;
	banned_at?: Date;
	reason?: string;
}
