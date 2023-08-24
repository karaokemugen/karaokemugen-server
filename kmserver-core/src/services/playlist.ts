import {v4 as uuidV4} from 'uuid';

import { deleteContributor, deleteKaraFromPlaylist, deletePlaylist, getMaxPosInPlaylist, insertContributor, insertKaraIntoPlaylist, insertPlaylist, reorderPlaylist, selectPlaylistContents, selectPlaylists, selectPLCMini, setPos, shiftPosInPlaylist, truncatePlaylist, updatePlaylist, updatePlaylistDuration, updatePlaylistKaraCount, updatePlaylistLastEditTime, updatePLC } from '../dao/playlist.js';
import { formatKaraList } from '../lib/services/kara.js';
import { PLImportConstraints } from '../lib/services/playlist.js';
import { DBPL, DBPLC, PLCInsert } from '../lib/types/database/playlist.js';
import { PlaylistExport, PLCEditParams, PLParams } from '../lib/types/playlist.js';
import { JWTTokenWithRoles, User } from '../lib/types/user.js';
import { ErrorKM } from '../lib/utils/error.js';
import logger from '../lib/utils/logger.js';
import { findUniqueSlug } from '../lib/utils/slug.js';
import { check } from '../lib/utils/validators.js';
import { emitWS } from '../lib/utils/ws.js';
import { adminToken } from '../utils/constants.js';
import sentry from '../utils/sentry.js';
import { getAllKaras } from './kara.js';
import { findUserByName } from './user.js';

const service = 'Playlist';

/** Remove playlist entirely */
export async function removePlaylist(plaid: string, token: JWTTokenWithRoles) {
	try {
		const pl = (await getPlaylists({
			plaid
		}, adminToken))[0];
		token.username = token.username.toLowerCase();
		if (!pl) throw new ErrorKM('UNKNOWN_PLAYLIST', 404, false); 
		if (!token.roles.admin && pl.username !== token.username) throw new ErrorKM('CHECK_YOUR_PRIVILEGES', 403, false);
		
		logger.info(`Deleting playlist ${pl.name}`, { service });
		await deletePlaylist(plaid);
		emitWS('playlistsUpdated');
	} catch (err) {
		logger.error(`Error removing playlist ${plaid} : ${err}`, { service });
		sentry.error(err);
		throw err instanceof ErrorKM ? err : new ErrorKM('PL_DELETE_ERROR');
	}
}

/** Edit playlist properties */
export async function editPlaylist(plaid: string, playlist: DBPL, token?: JWTTokenWithRoles) {
	try {
		const pls = await getPlaylists({}, adminToken);
		token.username = token.username.toLowerCase();
		delete playlist.plaid;
		const pl = pls.find(pla => pla.plaid === plaid);
		if (!pl) throw new ErrorKM('UNKNOWN_PLAYLIST', 404, false); 
		if (!token.roles.admin && pl.username !== token.username) throw new ErrorKM('CHECK_YOUR_PRIVILEGES', 403, false);

		logger.debug(`Editing playlist ${plaid}`, {service, obj: playlist});
		const newPlaylist = {
			...pl,
			...playlist
		};
		newPlaylist.slug = findUniqueSlug(pls.filter(pla => pla.plaid !== pl.plaid).map(pl2 => pl2.slug), newPlaylist.name);
		await updatePlaylist(newPlaylist);
		updatePlaylistLastEditTime(plaid);
		emitWS('playlistInfoUpdated', plaid);
		emitWS('playlistsUpdated');
		return newPlaylist;
	} catch (err) {
		logger.error(`Error editing playlist ${plaid} : ${err}`, { service });
		sentry.error(err);
		throw err instanceof ErrorKM ? err : new ErrorKM('PL_EDIT_ERROR');
	}
}

/** Create new playlist */
export async function createPlaylist(pl: DBPL, token: JWTTokenWithRoles) {
	try {
		const pls = await getPlaylists({}, adminToken);
		token.username = token.username.toLowerCase();
		// If playlist is to be replaced, let's check if we're allowed to
		if (pls.find(pla => 
			pl.plaid === pla.plaid && 
			(token.username === pl.username || pl.contributors.includes(token.username)))) {
			const epl = await editPlaylist(pl.plaid, pl, token);
			emitWS('playlistsUpdated');
			return epl;
		}
		const newPL: DBPL = {
			plaid: pl.plaid || uuidV4(),
			slug: findUniqueSlug(pls.map(pl2 => pl2.slug), pl.name),
			created_at: pl.created_at || new Date(),
			modified_at: pl.modified_at || new Date(),
			// Forcing username provided by function.
			// The person creating the playlist should be the owner.
			username: token.username,
			name: pl.name,
			description: pl.description,
			// Defaults
			flag_visible: pl.flag_visible === true,
			flag_visible_online: pl.flag_visible_online === true
		};
		await insertPlaylist(newPL);
		emitWS('playlistsUpdated');
		return newPL;
	} catch (err) {
		logger.error(`Error creating playlist ${pl.name} : ${err}`, { service });
		sentry.error(err);
		throw err instanceof ErrorKM ? err : new ErrorKM('PL_CREATE_ERROR');
	}
}

/** Get playlists */
export async function getPlaylists(params: PLParams, token: JWTTokenWithRoles): Promise<DBPL[]> {
	try {
		const pls = await selectPlaylists(params);
		// Let's filter lists depending on if we're allowed to see those lists or not
		if (token) token.username = token.username.toLowerCase();
		return pls.filter(pl => 
			pl.flag_visible_online || 
			token?.roles.admin ||
			pl.username === token?.username || 
			pl.contributors.includes(token?.username));
	} catch (err) {
		logger.error(`Error getting playlists : ${err}`, { service });
		sentry.error(err);
		throw err instanceof ErrorKM ? err : new ErrorKM('PL_GET_ERROR');
	}
}

export async function addContributorToPlaylist(plaid: string, username: string, token: JWTTokenWithRoles) {
	try {
		const pl = (await getPlaylists({
			plaid
		}, adminToken))[0];
		token.username = token.username.toLowerCase();
		if (!pl) throw new ErrorKM('UNKNOWN_PLAYLIST', 404, false); 
		if (!token.roles.admin && pl.username !== token.username) throw new ErrorKM('CHECK_YOUR_PRIVILEGES', 403, false);
		if (pl.username === username) throw new ErrorKM('PL_ADD_CONTRIBUTOR_NO_SELF_ERROR', 409, false);
		await insertContributor(plaid, username);
	} catch (err) {
		logger.error(`Error adding contributor to playlist ${plaid} : ${err}`, { service });
		sentry.error(err);
		throw err instanceof ErrorKM ? err : new ErrorKM('PL_ADD_CONTRIBUTOR_ERROR');
	}
}

export async function removeContributorToPlaylist(plaid: string, username: string, token: JWTTokenWithRoles) {
	try {
		const pl = (await getPlaylists({
			plaid
		}, adminToken))[0];
		token.username = token.username.toLowerCase();
		if (!pl) throw new ErrorKM('UNKNOWN_PLAYLIST', 404, false); 
		// A user should be able to remove themselves from the playlist
		if (!token.roles.admin && pl.username !== token.username && !pl.contributors.includes(token.username)) throw new ErrorKM('CHECK_YOUR_PRIVILEGES', 403, false);
		await deleteContributor(plaid, username);
	} catch (err) {
		logger.error(`Error removing contributors from playlist ${plaid} : ${err}`, { service });
		sentry.error(err);
		throw err instanceof ErrorKM ? err : new ErrorKM('PL_REMOVE_CONTRIBUTOR_ERROR');
	}
}

/** Get playlist contents */
export async function getPlaylistContents(plaid: string, token: JWTTokenWithRoles, filter?: string, lang?: string, from = 0, size = 99999999999) {
	try {
		if (token) token.username = token.username.toLowerCase();
		const plInfo = (await getPlaylists({plaid}, adminToken))[0];
		if (!plInfo) throw new ErrorKM('UNKNOWN_PLAYLIST', 404, false);
		if ((!token && !plInfo.flag_visible_online) && token && !token.roles.admin && plInfo.username !== token.username && !plInfo.contributors.includes(token.username)) throw new ErrorKM('CHECK_YOUR_PRIVILEGES', 403, false);
		const pl = await selectPlaylistContents({
			plaid,
			username: token?.username.toLowerCase() || null,
			filter,
			lang,
			from,
			size
		});
		const count = pl.length > 0 ? pl[0].count : 0;
		return formatKaraList(pl, from, count);
	} catch (err) {
		logger.error(`Error getting contents from playlist ${plaid} : ${err}`, { service });
		sentry.error(err);
		throw err instanceof ErrorKM ? err : new ErrorKM('PL_GET_CONTENTS_ERROR');
	}
}

/** Add song to playlist */
export async function addKaraToPlaylist(kids: string[], plaid: string, token: JWTTokenWithRoles, pos?: number) {
	try {
		token.username = token.username.toLowerCase();
		const [pls, karas] = await Promise.all([
			getPlaylists({plaid}, token),
			getAllKaras({
				q: `k:${kids.join(',')}`,
				ignoreCollections: true
			}, token)
		]);
		const pl = pls[0];
		if (!pl) throw new ErrorKM('UNKNOWN_PLAYLIST', 404, false);
		const user: User = await findUserByName(token.username);

		if (karas.content.length !== kids.length) throw new ErrorKM('UNKNOWN_SONG', 404, false);

		logger.debug(`Adding ${kids.length} karaokes to playlist ${pl.name || 'unknown'} by ${token.username}...`, { service });

		if (token.username !== pl.username && !pl.contributors.includes(token.username)) {
			throw new ErrorKM('CHECK_YOUR_PRIVILEGES', 403, false); 
		}
		// Everything's daijokay, user is allowed to add a song.
		const date_add = new Date();
		const karaList: PLCInsert[] = karas.content.map(k => {
			return {
				kid: k.kid,
				username: token.username,
				nickname: user.nickname,
				plaid,
				added_at: date_add
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
		karaList.forEach((_, i) => karaList[i].pos = pos + +i);
		
		// Adding song to playlist at long last!
		await insertKaraIntoPlaylist(karaList);

		await Promise.all([
			updatePlaylistLastEditTime(plaid),
			updatePlaylistDuration(plaid),
			updatePlaylistKaraCount(plaid)
		]);
		emitWS('playlistContentsUpdated', plaid);
		emitWS('playlistInfoUpdated', plaid);
	} catch (err) {
		logger.error(`Error adding songs ${kids.join(', ')} to playlist ${plaid} : ${err}`, { service });
		sentry.error(err);
		throw err instanceof ErrorKM ? err : new ErrorKM('PL_ADD_SONG_ERROR');
	}
}

/** Remove song from a playlist */
export async function removeKaraFromPlaylist(plc_ids: number[], token: JWTTokenWithRoles) {
	// If we get a single song, it's a user deleting it (most probably)
	try {
		token.username = token.username.toLowerCase();
		const playlistsNeedingUpdate: Set<string> = new Set();
		const plcsNeedingDelete: any[] = [];
		for (const plc_id of plc_ids) {
			if (typeof plc_id !== 'number') throw new ErrorKM('INVALID_DATA', 400, false);
			const plcData = await selectPLCMini(plc_id);
			if (!plcData) throw new ErrorKM('UNKNOWN_SONG', 404, false);
			const playlist = (await selectPlaylists({plaid: plcData.plaid}))[0];
			if (!token.roles.admin && playlist.username !== token.username.toLowerCase() && !playlist.contributors.includes(token.username)) throw new ErrorKM('CHECK_YOUR_PRIVILEGES', 403, false);
			playlistsNeedingUpdate.add(plcData.plaid);
			plcsNeedingDelete.push({
				id: plc_id,
				playlist_id: plcData.plaid,
				kid: plcData.kid
			});
		}
		logger.debug(`Deleting songs ${plcsNeedingDelete.map(p => p.id).toString()}`, { service });
		await deleteKaraFromPlaylist(plcsNeedingDelete.map((p:any) => p.id));
		const KIDsNeedingUpdate: Set<string> = new Set();
		for (const plc of plcsNeedingDelete) {
			KIDsNeedingUpdate.add(plc.kid);
		}
		emitWS('KIDUpdated', [...KIDsNeedingUpdate].map(kid => {
			return {
				kid,
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
	} catch (err) {
		logger.error(`Error removing songs from playlist : ${err}`, { service });
		sentry.error(err);
		throw err instanceof ErrorKM ? err : new ErrorKM('PL_DELETE_SONG_ERROR');
	}
}

/** Edit PLC's properties in a playlist */
export async function editPLC(plc_ids: number[], params: PLCEditParams, token: JWTTokenWithRoles) {
	try {
		token.username = token.username.toLowerCase();
		const plcData: DBPLC[] = [];
		for (const plc_id of plc_ids) {
			plcData.push(await selectPLCMini(plc_id));
		}
		if (plcData.includes(undefined)) throw new ErrorKM('UNKNOWN_SONG', 404, false);
		const PLMap: Map<string, DBPL> = new Map();

		// Validations donne
		for (const plc of plcData) {
			if (!PLMap.has(plc.plaid)) {
				const pl = (await getPlaylists({plaid: plc.plaid}, token))[0];
				if (!token.roles.admin && token.username !== pl.username && !pl.contributors.includes(token.username)) {
					throw new ErrorKM('CHECK_YOUR_PRIVILEGES', 403, false);
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
	} catch (err) {
		logger.error(`Error editing songs in playlist : ${err}`, { service });
		sentry.error(err);
		throw err instanceof ErrorKM ? err : new ErrorKM('PL_EDIT_SONG_ERROR');
	}
}

/** Export playlist as JSON */
export async function exportPlaylist(plaid: string, token: JWTTokenWithRoles) {
	try {
		if (token) token.username = token.username.toLowerCase();
		const pl = (await getPlaylists({plaid}, adminToken))[0];
		if (!pl) throw new ErrorKM('UNKNOWN_PLAYLIST', 404, false);
		// Auth is optional for exporting playlists
		if ((!token && !pl.flag_visible_online) && token && token.roles.admin && token.username !== pl.username && !pl.contributors.includes(token.username)) {
			throw new ErrorKM('CHECK_YOUR_PRIVILEGES', 403, false);
		}
		logger.debug(`Exporting playlist ${plaid}`, { service });
		const plContents = await getPlaylistContents(plaid, token);
		const playlist: PlaylistExport = {};
		// We only need a few things
		const plExport = pl;
		playlist.Header = {
			version: 4,
			description: 'Karaoke Mugen Playlist File',
		};
		playlist.PlaylistInformation = plExport;
		playlist.PlaylistContents = plContents.content as any;
		return playlist;
	} catch (err) {
		logger.error(`Error exporting playlist ${plaid} : ${err}`, { service });
		sentry.error(err);
		throw err instanceof ErrorKM ? err : new ErrorKM('PL_EXPORT_ERROR');
	}
}

export async function emptyPlaylist(plaid: string, token: JWTTokenWithRoles) {
	token.username = token.username.toLowerCase();
	const pl = (await getPlaylists({ plaid }, adminToken))[0];
	if (!pl) throw {code: 404, msg: 'Playlist unknown'};
	if (!token.roles.admin && token.username !== pl.username && !pl.contributors.includes(token.username)) {
		throw new ErrorKM('CHECK_YOUR_PRIVILEGES', 403, false);
	}
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
	} catch (err) {
		throw {
			message: err,
			data: pl.name
		};
	}
}

/** Import playlist from JSON */
export async function importPlaylist(playlist: PlaylistExport, token: JWTTokenWithRoles) {
	// If all tests pass, then add playlist, then add karas
	// Playlist can end up empty if no karaokes are found in database
	try {
		token.username = token.username.toLowerCase();
		logger.debug('Importing playlist', {service, obj: playlist});
		const validationErrors = check(playlist, PLImportConstraints);
		if (validationErrors) {
			logger.error(`Invalid data in playlist : ${JSON.stringify(validationErrors)}`);
			throw new ErrorKM('INVALID_DATA', 400, false);
		}
		const playingKara: Partial<PLCInsert> = {
			plaid: null
		};
		let flag_playingDetected = false;
		const users = new Map();
		for (const index in playlist.PlaylistContents) {
			if (Object.prototype.hasOwnProperty.call(playlist.PlaylistContents, index)) {
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
					if (flag_playingDetected) {
						logger.error('Imported playlist contains more than one playing marker', { service });
						throw new ErrorKM('INVALID_DATA', 400, false);
					} 
					flag_playingDetected = true;
					playingKara.kid = kara.kid;
					playingKara.username = kara.username;
				}
			}
		}
		if (playlist.PlaylistContents?.length === 0) {
			logger.error('Imported playlist has no items', { service });
			throw new ErrorKM('INVALID_DATA', 400, false);
		}
		// Validations done. First creating playlist.
		// This should attempt to create a playlist or edit an existing one
		const pl = await createPlaylist(playlist.PlaylistInformation, token);
		await insertKaraIntoPlaylist(playlist.PlaylistContents);
		await Promise.all([
			updatePlaylistKaraCount(pl.plaid),
			updatePlaylistDuration(pl.plaid)
		]);
		emitWS('playlistsUpdated');
		return {
			plaid: pl.plaid,
		};
	} catch (err) {
		logger.error(`Error importing playlist : ${err}`, { service });
		sentry.error(err);
		throw err instanceof ErrorKM ? err : new ErrorKM('PL_IMPORT_ERROR');
	}
}
