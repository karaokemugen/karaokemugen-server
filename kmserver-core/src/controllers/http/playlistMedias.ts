import { Router } from 'express';
import z from 'zod';

import { APIMessage } from '../../lib/services/frontend.js';
import { playlistMediaTypes } from '../../lib/utils/constants.js';
import { check } from '../../lib/utils/validators.js';
import { getPlaylistMedias } from '../../services/playlistMedias.js';

export default function PMController(router: Router) {
	router.route('/playlistMedias/:type')
		.get(async (req, res) => {
			try {
				check(req.params, z.object({
					type: z.enum(playlistMediaTypes),
				}) )
				const playlistMedias = await getPlaylistMedias(req.params.type);
				res.json(playlistMedias);
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
}
