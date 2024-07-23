import { Router } from 'express';

import { APIMessage } from '../../lib/services/frontend.js';
import { getInbox, getKaraInbox, markKaraInboxAsDownloaded, removeKaraFromInbox } from '../../services/inbox.js';
import {requireAuth, requireMaintainer, requireValidUser, updateLoginTime} from '../middlewares/auth.js';
import { assignIssue } from '../../lib/utils/gitlab.js';

export default function inboxController(router: Router) {
	router.route('/inbox/:inid([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})')
		.get(requireAuth, requireValidUser, requireMaintainer, updateLoginTime, async (req: any, res) => {
			try {
				const ret = await getKaraInbox(req.params.inid);
				res.status(200).json(ret);
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		})
		.delete(requireAuth, requireValidUser, requireMaintainer, updateLoginTime, async (req: any, res) => {
			try {
				await removeKaraFromInbox(req.params.inid);
				res.status(200).json();
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
	router.route('/inbox/:inid([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/downloaded')
		.post(requireAuth, requireValidUser, requireMaintainer, updateLoginTime, async (req: any, res) => {
			try {
				await markKaraInboxAsDownloaded(req.params.inid, req.authToken.username);
				res.status(200).json();
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
	router.route('/inbox/:inid([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/assignToUser')
		.post(requireAuth, requireValidUser, requireMaintainer, updateLoginTime, async (req: any, res) => {
			try {
				await assignIssue(req.body.issue, req.body.repoName, req.body.gitlabUsername)
				res.status(200).json();
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
	router.route('/inbox')
		.get(requireAuth, requireValidUser, requireMaintainer, updateLoginTime, async (_req: any, res) => {
			try {
				const inbox = await getInbox();
				res.status(200).json(inbox);
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
}
