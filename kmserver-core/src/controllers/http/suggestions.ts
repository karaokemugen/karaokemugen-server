import { Router } from 'express';

import { APIMessage } from '../../lib/services/frontend.js';
import { addSuggestionsFromFile, getSuggestions, getSuggestionsLanguages, removeSuggestion, updateLike } from '../../services/suggestions.js';
import {requireAdmin, requireAuth, requireMaintainer, requireValidUser} from '../middlewares/auth.js';

export default function suggestionsController(router: Router) {
	router.route('/suggestions/import')
		.post(requireAuth, requireValidUser, requireAdmin, async (req: any, res) => {
			try {
				await addSuggestionsFromFile(req.body.fileData, req.body.source);
				res.status(200).json();
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
	
	router.route('/suggestions/:id')
		.post(async (req: any, res) => {
			try {
				await updateLike(req.params.id);
				res.status(200).json();
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		})
		.delete(requireAuth, requireValidUser, requireMaintainer, async (req: any, res) => {
			try {
				await removeSuggestion(req.params.id);
				res.status(200).json();
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
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
				res.status(err.code || 500).json(APIMessage(err.message));
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
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
	router.route('/suggestions/languages')
		.get(async (_req: any, res) => {
			try {
				const suggestions = await getSuggestionsLanguages();
				res.status(200).json(suggestions);
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
}
