import {getConfig} from '../lib/utils/config';
import { upsertInstance } from './stats';
import { connectDB } from '../lib/dao/database';

export async function initDB() {
	await connectDB({superuser: false, db: getConfig().Database.prod.database}, () => {});
	// Inserting instance data for server
	await upsertInstance({
		version: 'Server',
		instance_id: getConfig().App.InstanceID,
		config: {}
	});
}


