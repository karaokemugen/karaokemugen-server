import { Router } from 'express';
import z from 'zod';

import { APIMessage } from '../../lib/services/frontend.js';
import { check } from '../../lib/utils/validators.js';
import { addFavorite, compareFavorites, getFavorites, removeFavorite } from '../../services/favorites.js';
import {requireAuth, requireValidUser, updateLoginTime} from '../middlewares/auth.js';
import { validateUUID } from '../middlewares/validation.js';

export default function favoritesController(router: Router) {
	router.route('/favorites/compare')
		.post(async (req: any, res) => {
			try {
				check(req.body, z.object({
					username1: z.string(),
					username2: z.string(),
				}));
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
	router.route('/favorites/:kid')
		.post(validateUUID('kid'), requireAuth, requireValidUser, updateLoginTime, async (req: any, res) => {
			try {
				// KID is already validated by Express middleware
				check(req.body, z.object({
					favorited_at: z.iso.datetime({ offset: true }).optional()
				}).optional());
				await addFavorite(req.authToken, req.params.kid, req.body?.favorited_at);
				res.status(200).json();
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		})
		.delete(validateUUID('kid'), requireAuth, requireValidUser, updateLoginTime, async (req: any, res) => {
			try {
				await removeFavorite(req.authToken, req.params.kid);
				res.status(200).json();
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
	
}
