import { requireAuth, requireValidUser } from '../utils/passport_manager';
import { getFavorites, addFavorite, removeFavorite } from '../services/favorites';

export default function favoritesController(router) {
	router.route('/favorites')
		.get(requireAuth, requireValidUser, async (req, res) => {
			try {
				const favorites = await getFavorites(req.authToken);
				res.status(200).json(favorites);
			} catch(err) {
				res.status(500).json(err);
			}
		})
		.post(requireAuth, requireValidUser, async (req, res) => {
			try {
				await addFavorite(req.authToken, req.body.kid);
				res.status(200).json();
			} catch(err) {
				res.status(500).json(err);
			}
		})
		.delete(requireAuth, requireValidUser, async (req, res) => {
			try {
				await removeFavorite(req.authToken, req.body.kid);
				res.status(200).json();
			} catch(err) {
				res.status(500).json(err);
			}
		});
}