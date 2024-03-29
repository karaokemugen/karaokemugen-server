import { Router } from 'express';

import { APIMessage } from '../../lib/services/frontend.js';
import { getPlaylistMedias } from '../../services/playlistMedias.js';

export default function PMController(router: Router) {
	router.route('/playlistMedias/:type')
		.get(async (req, res) => {
			try {
				const playlistMedias = await getPlaylistMedias(req.params.type);
				res.json(playlistMedias);
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
}
