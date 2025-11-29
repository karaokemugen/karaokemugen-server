import { scheduleJob } from 'node-schedule';

import { connectDB } from '../lib/dao/database.js';
import { refreshSortables } from '../lib/dao/kara.js';
import {getConfig} from '../lib/utils/config.js';
import { clearInactiveInboxEntries } from '../services/inbox.js';
import { getState } from '../utils/state.js';
import { refreshKaraStats } from './kara.js';
import { updatePlaylistSearchVector } from './playlist.js';
import { upsertInstance } from './stats.js';
import { deleteInactiveUsers } from './user.js';

export async function initDB(log: boolean) {
	await connectDB(() => {}, {superuser: false, db: getConfig().System.Database.database, log});
	// Inserting instance data for server
	await upsertInstance({
		version: 'Server',
		instance_id: getConfig().App.InstanceID,
		config: {}
	});
	// Execute this every day at midnight.
	scheduleJob('0 0 5 * * *', refreshKaraStats);
	scheduleJob('0 0 0 * * *', deleteInactiveUsers);
	scheduleJob('0 0 0 * * *', clearInactiveInboxEntries);
	clearInactiveInboxEntries();
	deleteInactiveUsers();
	updatePlaylistSearchVector();
	// This is to make sure the table exists at startup
	if (!getState().opt.generateDB) refreshSortables();

}
