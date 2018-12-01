import {requireAuth, requireValidUser, updateUserLoginTime, requireAdmin} from '../_controllers/passport_manager';
import {getLang} from './lang';
import {getAllKaras, getAllYears} from '../_services/kara';
import {getTags} from '../_services/tag';
import {getAllSeries} from '../_services/series';
import {getSettings} from '../_utils/settings';

export default function KSController(router) {
	router.route('/karas/lastUpdate')
		.get(async (req, res) => {
			try {
				const settings = await getSettings();
				res.send(settings.lastGeneration);
			} catch(err) {
				res.status(500).json(err);
			}
		});

	router.route('/karas')
		.get(getLang, async (req, res) => {
			try {
				const karas = await getAllKaras(req.query.filter,req.lang,req.query.from, req.query.size);
				res.json(karas);
			} catch(err) {
				res.statusCode = 500;
				res.json(err);
			}
		});
	router.route('/karas/:kid([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})')
		.get(getLang, async (req, res) => {
			try {
				const kara = await getAllKaras(req.query.filter,req.lang,req.query.from, req.query.size, 'kid', req.params.kid);
				res.json(kara);
			} catch(err) {
				res.statusCode = 500;
				res.json(err);
			}
		});
	router.route('/karas/recent')
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
	router.route('/karas/years')
		.get(async (req, res) => {
			try {
				const years = await getAllYears();
				res.json(years);
			} catch(err) {
				res.statusCode = 500;
				res.json(err);
			}
		});
	router.route('/karas/years/:year([0-9]+)')
		.get(getLang, async (req, res) => {
			try {
				const karas = await getAllKaras(req.query.filter,req.lang,req.query.from,req.query.size,'year',req.params.year);
				res.json(karas);
			} catch(err) {
				res.statusCode = 500;
				res.json(err);
			}
		});
}