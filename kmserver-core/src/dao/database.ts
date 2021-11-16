import {getConfig} from '../lib/utils/config';
import { upsertInstance } from './stats';
import { connectDB } from '../lib/dao/database';
import { scheduleJob } from 'node-schedule';
import { refreshKaraStats } from './kara';

export async function initDB(log: boolean) {
	await connectDB(() => {}, {superuser: false, db: getConfig().System.Database.database, log});
	// Inserting instance data for server
	await upsertInstance({
		version: 'Server',
		instance_id: getConfig().App.InstanceID,
		config: {}
	});
	// Execute this every day at midnight.
	scheduleJob('* * 0 * * *', refreshKaraStats);
}


