import { Router } from 'express';
import z from 'zod';

import { APIMessage } from '../../lib/services/frontend.js';
import { check } from '../../lib/utils/validators.js';
import { addServer, getServers } from '../../services/server.js';

export default function uplinkController(router: Router) {
	router.route('/uplink/heartbeat')
		.post(async (req: any, res) => {
			try {
				check(req.body, z.object({
					sid: z.uuidv4(),
					domain: z.string(),
				}));
				const ret = await addServer(req.body);
				res.status(200).json(ret);
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
	router.route('/uplink/servers')
		.get(async (_req: any, res) => {
			try {
				const servers = await getServers(true);
				res.status(200).json(servers);
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
}
