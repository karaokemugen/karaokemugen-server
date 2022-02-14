import { scheduleJob } from 'node-schedule';

import { connectDB } from '../lib/dao/database';
import {getConfig} from '../lib/utils/config';
import { refreshKaraStats } from './kara';
import { upsertInstance } from './stats';

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
}
