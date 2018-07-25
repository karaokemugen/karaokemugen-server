import {requireAuth, requireValidUser, updateUserLoginTime, requireAdmin} from '../_controllers/passport_manager';
import {getLang} from './lang';
import logger from 'winston';
import {getAllKaras} from '../_services/kara';

export default function KSController(router) {
	router.route('/karas/songs')
		.get(getLang, async (req, res) => {
			// Sends command to shutdown the app.
			try {
				const karas = await getAllKaras(req.query.filter,req.lang,req.query.from, req.query.size);
				res.json(karas);
			} catch(err) {
				console.log(err);
				logger.error(err);
				res.statusCode = 500;
				res.json(err);
			}
		});
	router.route('/karas/songs/recent')
		.get(getLang, async (req, res) => {
			// Sends command to shutdown the app.
			try {
				const karas = await getRecentKaras(req.query.filter,req.lang);
				res.json(karas);
			} catch(err) {
				logger.error(err);
				res.statusCode = 500;
				res.json(err);
			}
		});
	router.route('/karas/languages')
		.get(getLang, async (req, res) => {
			// Sends command to shutdown the app.
			try {
				const langs = await getAllKaraLanguages(req.query.filter,req.lang);
				res.json(langs);
			} catch(err) {
				logger.error(err);
				res.statusCode = 500;
				res.json(err);
			}
		});
	router.route('/karas/languages/:lang')
		.get(getLang, async (req, res) => {
			// Sends command to shutdown the app.
			try {
				const karas = await getAllKaras(req.params.lang,req.query.filter,req.lang);
				res.json(karas);
			} catch(err) {
				logger.error(err);
				res.statusCode = 500;
				res.json(err);
			}
		});
	router.route('/karas/series')
		.get(getLang, async (req, res) => {
			// Sends command to shutdown the app.
			try {
				const series = await getAllSeries(req.query.filter,req.lang);
				res.json(series);
			} catch(err) {
				logger.error(err);
				res.statusCode = 500;
				res.json(err);
			}
		});
	router.route('/karas/series/:sid')
		.get(getLang, async (req, res) => {
			// Sends command to shutdown the app.
			try {
				const karas = await getAllKarasBySerie(req.params.sid,req.query.filter,req.lang);
				res.json(karas);
			} catch(err) {
				logger.error(err);
				res.statusCode = 500;
				res.json(err);
			}
		});
	router.route('/karas/downloads')
		.get(async (req, res) => {
			// Sends command to shutdown the app.
			try {
				const links = await getAllDownloads(req.query.kids);
				res.json(links);
			} catch(err) {
				logger.error(err);
				res.statusCode = 500;
				res.json(err);
			}
		});
}