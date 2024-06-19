import Anilist from 'anilist-node';
import Kitsu from 'kitsu';
import malScraper from 'mal-scraper';

import { selectUser, updateUser } from '../dao/user.js';
import { KitsuResponseLibraryEntries } from '../lib/types/animeListApi.js';
import { myanimelistStatusCompleted, myanimelistStatusWatching } from '../lib/utils/constants.js';
import logger from '../lib/utils/logger.js';
import sentry from '../utils/sentry.js';
import { pubUser } from './userPubSub.js';

// @ts-expect-error
const anilist = new Anilist();
// @ts-expect-error
const kitsu = new Kitsu();
const service = 'AnimeList';

export async function refreshAnimeList(username: string): Promise<boolean> {
	try {
		username = username.toLowerCase();
		const user = await selectUser('pk_login', username);
		const animeListToFetch = user.anime_list_to_fetch;

		let animeListIds: number[] = null;
		if (user.social_networks != null && user.social_networks[animeListToFetch]) {
			if (isTooSoonToRefresh(user.anime_list_last_modified_at)) {
				return false;
			}
			user.anime_list_last_modified_at = new Date();
			await updateUser(user);
			switch (animeListToFetch) {
				case 'myanimelist':
					animeListIds = await getAnimeListFromMyanimelist(user.social_networks.myanimelist);
					break;
				case 'anilist':
					animeListIds = await getAnimeListFromAnilist(user.social_networks.anilist);
					break;
				case 'kitsu':
					animeListIds = await getAnimeListFromKitsu(user.social_networks.kitsu);
					break;
				default:
					break;
			}
			user.anime_list_last_modified_at = new Date();
			await updateUser(user);
		}
		user.anime_list_ids = animeListIds;
		await updateUser(user);
		pubUser(username);
		return true;
	} catch (err) {
		logger.error(`Unable to refetch animeList for ${username}`, {
			service,
			obj: err,
		});
		sentry.error(err);
		throw err;
	}
}

export async function getAnimeListFromMyanimelist(name: string): Promise<number[]> {
	try {
		let offset = 0;
		const animeIds: number[] = [];
		for (let i = 0; i < 10; i += 1) { // to avoid infinite loop
			const partialEntries = await malScraper.getWatchListFromUser(name, offset, 'anime');
			const length = partialEntries.length;
			if (length <= 0) { // keep requesting only if remaining anime
				break;
			}
			animeIds.push(
				...partialEntries.filter(entry => [myanimelistStatusWatching, myanimelistStatusCompleted].includes(entry.status)).map(entry => +entry.animeId)
			);
			offset += length;
		}
		return animeIds;
	} catch (err) {
		logger.error('Failed to fetch data from MyAnimeList', {
			service,
			obj: err,
		});
		return null;
	}
}

export async function getAnimeListFromAnilist(name: string): Promise<number[]> {
	try {
		const entries = await anilist.lists.anime(name);
		return entries
			.filter(list => ['COMPLETED', 'CURRENT'].includes(list.status))
			.flatMap(entry => entry.entries)
			.map(entry => entry.media.id);
	} catch (err) {
		logger.error('Failed to fetch data from Anilist', { service, obj: err });
		return null;
	}
}

export async function getAnimeListFromKitsu(userId: number): Promise<number[]> {
	try {
		let offset = 0;
		const animeIds: number[] = [];
		for (let i = 0; i < 10; i += 1) { // to avoid infinite loop
			const partialEntries: KitsuResponseLibraryEntries = await kitsu.get('library-entries', {
				params: {
					filter: {
						userId,
						kind: 'anime',
						status: 'completed,current',
					},
					fields: {
						libraryEntries: 'id,anime',
						anime: 'id',
					},
					include: 'anime',
					page: {
						offset,
						limit: 500,
					},
				},
			});
			const length = partialEntries.data.length;
			if (length <= 0) { // keep requesting only if remaining anime
				break;
			}
			animeIds.push(...partialEntries.data.map(e => +e.anime.data.id));
			offset += length;
		}
		return animeIds;
	} catch (err) {
		logger.error('Failed to fetch data from Kitsu', { service, obj: err });
		return null;
	}
}

function isTooSoonToRefresh(anime_list_last_modified_at?: Date): boolean {
	if (anime_list_last_modified_at == null) {
		return false;
	}
	const nowMinus1Minute = new Date();
	nowMinus1Minute.setMinutes(nowMinus1Minute.getMinutes() - 1);
	return nowMinus1Minute < anime_list_last_modified_at;
}
