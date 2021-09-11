import {DBList} from '../lib/types/database/database';
import {DBUser} from '../lib/types/database/user';

export interface UserOptions {
    password?: boolean,
    public?: boolean
}

export interface UserParams {
	public: boolean,
	filter?: string,
	from?: number,
	size?: number
}

export interface UserList extends DBList {
	content: DBUser[]
}
