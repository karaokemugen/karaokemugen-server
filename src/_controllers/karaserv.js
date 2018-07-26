import {requireAuth, requireValidUser, updateUserLoginTime, requireAdmin} from '../_controllers/passport_manager';
import {getLang} from './lang';
import logger from 'winston';
import {getAllKaras} from '../_services/kara';
import {getTags} from '../_services/tag';
import {getAllSeries} from '../_services/series';

export default function KSController(router) {
	router.route('/karas/songs')
		.get(getLang, async (req, res) => {
			try {
				const karas = await getAllKaras(req.query.filter,req.lang,req.query.from, req.query.size);
				res.json(karas);
			} catch(err) {
				console.log(err);
				res.statusCode = 500;
				res.json(err);
			}
		});
	router.route('/karas/songs/recent')
		.get(getLang, async (req, res) => {
			try {
				const karas = await getAllKaras(req.query.filter,req.lang,req.query.from, req.query.size,'recent');
				res.json(karas);
			} catch(err) {
				res.statusCode = 500;
				res.json(err);
			}
		});
	router.route('/karas/tags/:tagtype([0-9]+)')
		.get(getLang, async (req, res) => {
			try {
				const tags = await getTags(req.lang,req.params.tagtype);
				res.json(tags);
			} catch(err) {
				res.statusCode = 500;
				res.json(err);
			}
		});
	router.route('/karas/tag/:tag([0-9]+)')
		.get(getLang, async (req, res) => {
			try {
				const karas = await getAllKaras(req.query.filter,req.lang,req.query.from,req.query.size,'tag',req.params.tag);
				res.json(karas);
			} catch(err) {
				res.statusCode = 500;
				res.json(err);
			}
		});
	router.route('/karas/series')
		.get(getLang, async (req, res) => {
			try {
				const series = await getAllSeries(req.query.filter,req.lang);
				res.json(series);
			} catch(err) {
				res.statusCode = 500;
				res.json(err);
			}
		});
	router.route('/karas/series/:sid([0-9]+)')
		.get(getLang, async (req, res) => {
			try {
				const karas = await getAllKaras(req.query.filter,req.lang,req.query.from,req.query.size,'serie',req.params.sid);
				res.json(karas);
			} catch(err) {
				res.statusCode = 500;
				res.json(err);
			}
		});
}