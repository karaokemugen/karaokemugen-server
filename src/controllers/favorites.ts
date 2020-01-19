import {requireAuth, requireValidUser} from './middlewares/auth';
import { getFavorites, addFavorite, removeFavorite } from '../services/favorites';
import { Router } from 'express';
import logger from '../lib/utils/logger';

export default function favoritesController(router: Router) {
	router.route('/favorites')
		.get(requireAuth, requireValidUser, async (req: any, res) => {
			try {
				const favorites = await getFavorites(req.authToken);
				res.status(200).json(favorites);
			} catch(err) {
				res.status(500).json(err);
			}
		})
		.post(requireAuth, requireValidUser, async (req: any, res) => {
			try {
				logger.debug(`[Favorites] Post favorites by ${req.authToken.username} in progress ${req.body.kid}`);
				await addFavorite(req.authToken, req.body.kid);
				logger.debug(`[Favorites] Post favorites by ${req.authToken.username} finish ${req.body.kid}`);
				res.status(200).json();
			} catch(err) {
				logger.debug(`[Favorites] Post favorites error ${JSON.stringify(err)}`);
				res.status(500).json(err);
			}
		})
		.delete(requireAuth, requireValidUser, async (req: any, res) => {
			try {
				logger.debug(`[Favorites] Delete favorites by ${req.authToken.username} in progress ${req.body.kid}`);
				await removeFavorite(req.authToken, req.body.kid);
				logger.debug(`[Favorites] Delete favorites by ${req.authToken.username} finish ${req.body.kid}`);
				res.status(200).json();
			} catch(err) {
				logger.debug(`[Favorites] Delete favorites error ${JSON.stringify(err)}`);
				res.status(500).json(err);
			}
		});
}