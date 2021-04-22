import {v4 as uuidV4} from 'uuid';

import { deleteKaraFromPlaylist, updatePlaylistKaraCount, deletePlaylist, insertPlaylist, selectPlaylists, selectPlaylistContents, updatePlaylist, updatePlaylistLastEditTime, getMaxPosInPlaylist, shiftPosInPlaylist, insertKaraIntoPlaylist, updatePlaylistDuration, selectPLCMini, reorderPlaylist, setPos, updatePLC, truncatePlaylist, insertContributor, deleteContributor } from '../dao/playlist';
import { PLImportConstraints } from '../lib/services/playlist';
import { DBPL, DBPLCBase } from '../lib/types/database/playlist';
import { PLCEditParams, PLParams, PLC, PlaylistExport } from '../lib/types/playlist';
import { Token, User } from '../lib/types/user';
import logger from '../lib/utils/logger';
import { findUniqueSlug } from '../lib/utils/slug';
import { check } from '../lib/utils/validators';
import { emitWS } from '../lib/utils/ws';
import { formatKaraList, getAllKaras } from './kara';
import { findUserByName } from './user';
import sentry from '../utils/sentry';

/** Remove playlist entirely */
export async function removePlaylist(plaid: string, token: Token) {
	const pl = (await getPlaylists({
		plaid: plaid
	}))[0];
	if (!pl) throw {code: 404, msg: `Playlist ${plaid} unknown`};
	if (token.role !== 'admin' && pl.username !== token.username) throw {code: 403, msg: 'You can not delete this playlist'};
	try {
		logger.info(`Deleting playlist ${pl.name}`, {service: 'Playlist'});
		await deletePlaylist(plaid);
		emitWS('playlistsUpdated');
	} catch(err) {
		throw {
			code: err.code,
			msg: err.msg
		};
	}
}

/** Edit playlist properties */
export async function editPlaylist(plaid: string, playlist: DBPL, token?: Token) {
	const pls = await getPlaylists({
		plaid: plaid,
	}, token);
	delete playlist.plaid;
	const pl = pls.find(pla => pla.plaid === plaid);
	if (!pl) throw {code: 404, msg: `Playlist ${plaid} unknown`};
	if (token.role !== 'admin' && pl.username !== token.username) throw {code: 403, msg: 'You can not delete this playlist'};
	try {
		logger.debug(`Editing playlist ${plaid}`, {service: 'Playlist', obj: playlist});
		const newPlaylist = {
			...pl,
			...playlist
		};
		newPlaylist.slug = findUniqueSlug(pls.filter(pla => pla.plaid !== pl.plaid).map(pl => pl.slug), newPlaylist.name);
		await updatePlaylist(newPlaylist);
		updatePlaylistLastEditTime(plaid);
		emitWS('playlistInfoUpdated', plaid);
		emitWS('playlistsUpdated');
		return newPlaylist;
	} catch(err) {
		throw {
			message: err,
			data: pl.name
		};
	}
}

/** Create new playlist */
export async function createPlaylist(pl: DBPL, username: string) {
	const pls = await getPlaylists({
		public: false
	});
	if (pls.find(pla => pl.plaid === pla.plaid)) {
		return await editPlaylist(pl.plaid, pl);
	}
	const newPL: DBPL = {
		plaid: pl.plaid || uuidV4(),
		slug: findUniqueSlug(pls.filter(pla => pla.plaid !== pl.plaid).map(pl => pl.slug), pl.name),
		created_at: pl.created_at || new Date(),
		modified_at: pl.modified_at || new Date(),
		// Forcing username provided by function.
		// The person creating the playlist should be the owner.
		username: username,
		name: pl.name,
		// Defaults
		flag_visible: pl.flag_visible === true ? true : false,
		flag_visible_online: pl.flag_visible_online === true ? true : false
	};
	await insertPlaylist(newPL);
	emitWS('playlistsUpdated');
	return newPL;
}

/** Get playlists */
export async function getPlaylists(params?: PLParams, token?: Token): Promise<DBPL[]> {
	// If params.username is set we're returning someone's playlists.
	// No need to hide them if admin or ourselves.
	// No token? We're calling internally
	if (!token || token?.role === 'admin' || token?.username === params.username) params.public = false;
	return await selectPlaylists(params);
}

export async function addContributorToPlaylist(plaid: string, username: string, token: Token) {
	const pl = (await getPlaylists({
		plaid: plaid
	}))[0];
	if (!pl) throw {code: 404, msg: `Playlist ${plaid} unknown`};
	if (token.role !== 'admin' && pl.username !== token.username) throw {code: 403, msg: 'You can not add a contributor to this playlist'};
	if (pl.username === username) throw {code: 409, msg: 'You can not add yourself as a contributor of your own playlist!'};
	await insertContributor(plaid, username);
}

export async function removeContributorToPlaylist(plaid: string, username: string, token: Token) {
	const pl = (await getPlaylists({
		plaid: plaid
	}))[0];
	if (!pl) throw {code: 404, msg: `Playlist ${plaid} unknown`};
	if (token.role !== 'admin' && pl.username !== token.username) throw {code: 403, msg: 'You can not remove a contributor from this playlist'};
	await deleteContributor(plaid, username);
}

/** Get playlist contents */
export async function getPlaylistContents(plaid: string, token: Token, filter?: string, lang?: string, from = 0, size = 99999999999) {
	const plInfo = (await getPlaylists({plaid: plaid}, token))[0];
	if (!plInfo) throw {code: 404, msg: `Playlist ${plaid} unknown`};
	try {
		const pl = await selectPlaylistContents({
			plaid: plaid,
			username: token?.username.toLowerCase() || null,
			filter: filter,
			lang: lang,
			from: from,
			size: size
		});
		const count = pl.length > 0 ? pl[0].count : 0;
		return formatKaraList(pl, from, count);
	} catch(err) {
		throw {
			message: err
		};
	}
}

/** Add song to playlist */
export async function addKaraToPlaylist(kids: string[], plaid: string, token: Token, pos?: number) {
	let errorCode = 'PLAYLIST_MODE_ADD_SONG_ERROR';
	const [pls, karas] = await Promise.all([
		getPlaylists({plaid: plaid}, token),
		getAllKaras({
			token: token,
			q: `k:${kids.join(',')}`
		})
	]);
	const pl = pls[0];
	try {
		if (!pl) throw {code: 404, msg: `Playlist ${plaid} unknown`};
		const user: User = await findUserByName(token.username);

		if (karas.content.length !== kids.length) throw {code: 404, msg: 'One of the karaokes does not exist'};
		logger.debug(`Adding ${kids.length} karaokes to playlist ${pl.name || 'unknown'} by ${token.username}...`, {service: 'Playlist'});

		if (token.username !== pl.username && !pl.contributors.includes(token.username)) {
			throw {code: 403};
		}
		// Everything's daijokay, user is allowed to add a song.
		const date_add = new Date();
		let karaList: PLC[] = karas.content.map(k => {
			return {
				kid: k.kid,
				username: token.username,
				nickname: user.nickname,
				plaid: plaid,
				created_at: date_add
			};
		});

		const playlistMaxPos = await getMaxPosInPlaylist(plaid);

		// Find out position of currently playing karaoke
		// If no flag_playing is found, we'll add songs at the end of playlist.
		// -1 means the admin right-clicked and the song is to be added after the current playing song
		if (pos) {
			await shiftPosInPlaylist(plaid, pos, karaList.length);
		} else {
			pos = playlistMaxPos + 1;
		}
		for (const i in karaList) {
			karaList[i].pos = pos + +i;
		}

		// Adding song to playlist at long last!
		await insertKaraIntoPlaylist(karaList);

		await Promise.all([
			updatePlaylistLastEditTime(plaid),
			updatePlaylistDuration(plaid),
			updatePlaylistKaraCount(plaid)
		]);
		emitWS('playlistContentsUpdated', plaid);
		emitWS('playlistInfoUpdated', plaid);
	} catch(err) {
		logger.error('Unable to add karaokes', {service: 'Playlist', obj: err});
		let plname : string;
		pl ? plname = pl.name : plname = 'Unknown';
		throw {
			code: err?.code,
			message: errorCode,
			data: {
				details: err.msg,
				kara: karas,
				playlist: plname || 'unknown',
				user: token?.username
			}
		};
	}
}

/** Remove song from a playlist */
export async function removeKaraFromPlaylist(plc_ids: number[], token: Token) {
	// If we get a single song, it's a user deleting it (most probably)
	try {
		const playlistsNeedingUpdate: Set<string> = new Set();
		const plcsNeedingDelete: any[] = [];
		for (const plc_id of plc_ids) {
			if (typeof plc_id !== 'number') throw {errno: 400, msg: 'At least one PLC ID is invalid'};
			const plcData = await selectPLCMini(plc_id);
			if (!plcData) throw {errno: 404, msg: 'At least one playlist content is unknown'};
			const playlist = (await selectPlaylists({plaid: plcData.plaid}))[0];
			if (token.role !== 'admin' && playlist.username !== token.username.toLowerCase() && !playlist.contributors.includes(token.username) ) throw {errno: 403, msg: 'You cannot delete this song'};
			playlistsNeedingUpdate.add(plcData.plaid);
			plcsNeedingDelete.push({
				id: plc_id,
				playlist_id: plcData.plaid,
				kid: plcData.kid
			});
		}
		logger.debug(`Deleting songs ${plcsNeedingDelete.map(p => p.id).toString()}`, {service: 'Playlist'});
		await deleteKaraFromPlaylist(plcsNeedingDelete.map((p:any) => p.id));
		const KIDsNeedingUpdate: Set<string> = new Set();
		for (const plc of plcsNeedingDelete) {
			KIDsNeedingUpdate.add(plc.kid);
		}
		emitWS('KIDUpdated', [...KIDsNeedingUpdate].map(kid => {
			return {
				kid: kid,
				plc_id: []
			};
		}));
		for (const plaid of playlistsNeedingUpdate.values()) {
			await Promise.all([
				updatePlaylistDuration(plaid),
				updatePlaylistKaraCount(plaid),
				reorderPlaylist(plaid)
			]);
			updatePlaylistLastEditTime(plaid);

			emitWS('playlistContentsUpdated', plaid);
			emitWS('playlistInfoUpdated', plaid);
		}
	} catch(err) {
		throw {
			code: err?.errno,
			message: err
		};
	}
}

/** Edit PLC's properties in a playlist */
export async function editPLC(plc_ids: number[], params: PLCEditParams, token: Token) {
	const plcData: DBPLCBase[] = [];
	for (const plc_id of plc_ids) {
		plcData.push(await selectPLCMini(plc_id));
	}
	if (plcData.includes(undefined)) throw {code: 404, msg: 'PLC ID unknown'};
	const PLMap: Map<string, DBPL> = new Map();

	// Validations donne
	for (const plc of plcData) {
		if (!PLMap.has(plc.plaid)) {
			const pl = (await getPlaylists({plaid: plc.plaid}, token))[0];
			if (token.username !== pl.username && !pl.contributors.includes(token.username)) {
				throw {code: 403};
			}
			PLMap.set(plc.plaid, pl);
		}
		// Get playlist info in these cases
		if (params.pos) {
			await shiftPosInPlaylist(plc.plaid, params.pos, 1);
			await setPos(plc.plcid, params.pos);
			await reorderPlaylist(plc.plaid);
		}
		await updatePLC({
			...plc,
			...params,
			plcid: plc.plcid
		});
	}
	for (const playlist_id of PLMap.keys()) {
		updatePlaylistLastEditTime(playlist_id);
		emitWS('playlistContentsUpdated', playlist_id);
		emitWS('playlistInfoUpdated', playlist_id);
	}
}

/** Export playlist as JSON */
export async function exportPlaylist(plaid: string, token: Token) {
	const pl = (await getPlaylists({plaid: plaid}, token))[0];
	if (!pl) throw {code: 404, msg: `Playlist ${plaid} unknown`};
	try {
		logger.debug(`Exporting playlist ${plaid}`, {service: 'Playlist'});
		const plContents = await getPlaylistContents(plaid, token);
		const playlist: PlaylistExport = {};
		// We only need a few things
		const plExport = {
			name: pl.name,
			created_at: pl.created_at,
			modified_at: pl.modified_at,
			flag_visible: pl.flag_visible,
			username: pl.username,
		};
		const plcFiltered = plContents.content.map((plc: DBPLCBase) => {
			return {
				kid: plc.kid,
				plaid: plc.plaid,
				nickname: plc.nickname,
				created_at: plc.created_at,
				pos: plc.pos,
				username: plc.username,
				flag_playing: plc.flag_playing,
				flag_free: plc.flag_free,
				flag_visible: plc.flag_visible,
				flag_accepted: plc.flag_accepted,
				flag_refused: plc.flag_refused
			};
		});
		playlist.Header = {
			version: 4,
			description: 'Karaoke Mugen Playlist File',
		};
		playlist.PlaylistInformation = plExport;
		playlist.PlaylistContents = plcFiltered;
		return playlist;
	} catch(err) {
		throw {
			message: err,
			data: pl.name
		};
	}
}

export async function emptyPlaylist(plaid: string) {
	const pl = (await getPlaylists({plaid: plaid}))[0];
	if (!pl) throw {code: 404, msg: 'Playlist unknown'};
	try {
		logger.debug(`Emptying playlist ${pl.name}`, {service: 'Playlist'});
		await truncatePlaylist(plaid);
		await Promise.all([
			updatePlaylistKaraCount(plaid),
			updatePlaylistDuration(plaid)
		]);
		updatePlaylistLastEditTime(plaid);
		// If our playlist is the public one, the frontend should reset all buttons on the song library so it shows + for everything all over again.
		emitWS('playlistContentsUpdated', plaid);
	} catch(err) {
		throw {
			message: err,
			data: pl.name
		};
	}
}

/** Import playlist from JSON */
export async function importPlaylist(playlist: PlaylistExport, token: Token) {
	// If all tests pass, then add playlist, then add karas
	// Playlist can end up empty if no karaokes are found in database
	try {
		logger.debug('Importing playlist', {service: 'Playlist', obj: playlist});
		const validationErrors = check(playlist, PLImportConstraints);
		if (validationErrors) throw {code: 400, msg: `Playlist file is invalid : ${JSON.stringify(validationErrors)}`};
		const playingKara: PLC = {
			plaid: null
		};
		let flag_playingDetected = false;
		const users = new Map();
		for (const index in playlist.PlaylistContents) {
			const kara = playlist.PlaylistContents[index];
			kara.username = kara.username.toLowerCase();
			kara.username = kara.username.split('@')[0];
			let user: User = users.get(kara.username);
			if (!user) {
				user = await findUserByName(kara.username);
				if (!user) {
					// If user isn't found locally, replacing it with admin user
					playlist.PlaylistContents[index].username = kara.username = 'admin';
					user = await findUserByName('admin');
					playlist.PlaylistContents[index].nickname = user.nickname;
				}
				users.set(user.login, user);
			}
			if (kara.flag_playing === true) {
				if (flag_playingDetected) throw {code: 400, msg: 'Playlist contains more than one currently playing marker'};
				flag_playingDetected = true;
				playingKara.kid = kara.kid;
				playingKara.username = kara.username;
			}
		}
		// Validations done. First creating playlist.
		let pl = (await getPlaylists({plaid: playlist.PlaylistInformation.plaid}))[0];
		if (!pl) {
			pl = await createPlaylist(playlist.PlaylistInformation, token.username);
		} else {
			await emptyPlaylist(pl.plaid);
		}
		for (const i in playlist.PlaylistContents) {
			playlist.PlaylistContents[i].plaid = pl.plaid;
		}
		if (playlist.PlaylistContents?.length > 0) await insertKaraIntoPlaylist(playlist.PlaylistContents);
		await Promise.all([
			updatePlaylistKaraCount(pl.plaid),
			updatePlaylistDuration(pl.plaid)
		]);
		emitWS('playlistsUpdated');
		return {
			plaid: pl.plaid,
		};
	} catch(err) {
		logger.error('Import failed', {service: 'Playlist', obj: err});
		sentry.addErrorInfo('playlist', JSON.stringify(playlist, null, 2));
		sentry.error(err);
		throw err;
	}
}