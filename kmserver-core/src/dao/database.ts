import { scheduleJob } from 'node-schedule';

import { connectDB } from '../lib/dao/database.js';
import {getConfig} from '../lib/utils/config.js';
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
	scheduleJob('0 0 0 * * *', refreshKaraStats);
	scheduleJob('0 0 0 * * *', deleteInactiveUsers);
	refreshKaraStats();
	deleteInactiveUsers();
	updatePlaylistSearchVector();
}
