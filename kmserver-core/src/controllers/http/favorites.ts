import { Router } from 'express';

import { APIMessage } from '../../lib/services/frontend.js';
import { addFavorite, compareFavorites, getFavorites, removeFavorite } from '../../services/favorites.js';
import {requireAuth, requireValidUser, updateLoginTime} from '../middlewares/auth.js';

export default function favoritesController(router: Router) {
	router.route('/favorites/:kid([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})')
		.post(requireAuth, requireValidUser, updateLoginTime, async (req: any, res) => {
			try {
				await addFavorite(req.authToken, req.params.kid, req.body?.faovrited_at);
				res.status(200).json();
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		})
		.delete(requireAuth, requireValidUser, updateLoginTime, async (req: any, res) => {
			try {
				await removeFavorite(req.authToken, req.params.kid);
				res.status(200).json();
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
	router.route('/favorites/compare')
		.post(async (req: any, res) => {
			try {
				const favorites = await compareFavorites(req.body.username1, req.body.username2);
				res.status(200).json(favorites);
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
	router.route('/favorites')
		.get(requireAuth, requireValidUser, updateLoginTime, async (req: any, res) => {
			try {
				const favorites = await getFavorites(req.authToken.username.toLowerCase());
				res.status(200).json(favorites);
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
}
