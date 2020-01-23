import {requireAuth, requireValidUser} from './middlewares/auth';
import { getFavorites, addFavorite, removeFavorite } from '../services/favorites';
import { Router } from 'express';

export default function favoritesController(router: Router) {
	router.route('/favorites/:kid([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})')
		.post(requireAuth, requireValidUser, async (req: any, res) => {
			try {
				await addFavorite(req.authToken, req.params.kid);
				res.status(200).json();
			} catch(err) {
				res.status(500).json(err);
			}
		})
		.delete(requireAuth, requireValidUser, async (req: any, res) => {
			try {
				await removeFavorite(req.authToken, req.params.kid);
				res.status(200).json();
			} catch(err) {
				res.status(500).json(err);
			}
		});
	router.route('/favorites')
		.get(requireAuth, requireValidUser, async (req: any, res) => {
			try {
				const favorites = await getFavorites(req.authToken);
				res.status(200).json(favorites);
			} catch(err) {
				res.status(500).json(err);
			}
		})
		//KM <3.1 route
		.post(requireAuth, requireValidUser, async (req: any, res) => {
			try {
				await addFavorite(req.authToken, req.body.kid);
				res.status(200).json();
			} catch(err) {
				res.status(500).json(err);
			}
		})
		//KM <3.1 route
		.delete(requireAuth, requireValidUser, async (req: any, res) => {
			try {
				await removeFavorite(req.authToken, req.body.kid);
				res.status(200).json();
			} catch(err) {
				res.status(500).json(err);
			}
		});
}