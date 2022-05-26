import { Router } from 'express';

import { getSuggestions, getSuggestionsLanguages, removeSuggestion, updateLike } from '../../services/suggestions';
import {requireAdmin, requireAuth, requireValidUser} from '../middlewares/auth';

export default function suggestionsController(router: Router) {
	router.route('/suggestions/:id')
		.post(async (req: any, res) => {
			try {
				await updateLike(req.params.id);
				res.status(200).json();
			} catch (err) {
				res.status(500).json(err);
			}
		})
		.delete(requireAuth, requireValidUser, requireAdmin, async (req: any, res) => {
			try {
				await removeSuggestion(req.params.id);
				res.status(200).json();
			} catch (err) {
				res.status(500).json(err);
			}
		});
	router.route('/suggestions/random')
		.get(async (req: any, res) => {
			try {
				const suggestions = await getSuggestions({
					random: req.query.size,
					languages: req.query.languages
				});
				res.status(200).json(suggestions);
			} catch (err) {
				res.status(500).json(err);
			}
		});
	router.route('/suggestions')
		.get(async (req: any, res) => {
			try {
				const suggestions = await getSuggestions({
					filter: req.query.filter,
					from: req.query.from,
					size: req.query.size,
					order: req.query.order,
					languages: req.query.languages
				});
				res.status(200).json(suggestions);
			} catch (err) {
				res.status(500).json(err);
			}
		});
	router.route('/suggestions/languages')
		.get(async (_req: any, res) => {
			try {
				const suggestions = await getSuggestionsLanguages();
				res.status(200).json(suggestions);
			} catch (err) {
				res.status(500).json(err);
			}
		});
}
