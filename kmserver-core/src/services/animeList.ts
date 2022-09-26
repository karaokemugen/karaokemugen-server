import Anilist from 'anilist-node';
import Kitsu from 'kitsu';
import malScraper from 'mal-scraper';

import { selectUser, updateUser } from '../dao/user';
import { KitsuResponseLibraryEntries } from '../lib/types/animeListApi';
import { myanimelistStatusCompleted, myanimelistStatusWatching } from '../lib/utils/constants';
import logger from '../lib/utils/logger';
import sentry from '../utils/sentry';
import { pubUser } from './userPubSub';

const anilist = new Anilist();
const kitsu = new Kitsu();
const service = 'AnimeList';

export async function refreshAnimeList(username: string): Promise<boolean> {
	try {
		username = username.toLowerCase();
		const user = await selectUser('pk_login', username);
		const animeList = user.anime_list_to_fetch;
		if (!animeList || !user.social_networks[animeList]) {
			return false;
		}
		if (isTooSoonToRefresh(user.anime_list_last_modified_at)) {
			return false;
		}
		await updateUser({
			...user,
			anime_list_last_modified_at: new Date(),
		});
		let animeListIds: number[] = null;
		switch (user.anime_list_to_fetch) {
			case 'myanimelist':
				if (user.social_networks?.myanimelist == null) return false;
				animeListIds = await getAnimeListFromMyanimelist(user.social_networks.myanimelist);
				break;
			case 'anilist':
				if (user.social_networks?.anilist == null) return false;
				animeListIds = await getAnimeListFromAnilist(user.social_networks.anilist);
				break;
			case 'kitsu':
				if (user.social_networks?.kitsu == null) return false;
				animeListIds = await getAnimeListFromKitsu(user.social_networks.kitsu);
				break;
			default:
				break;
		}
		await updateUser({
			...user,
			anime_list_last_modified_at: new Date(),
			anime_list_ids: animeListIds,
		});
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
		sentry.error(err);
		throw err;
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
		sentry.error(err);
		throw err;
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
		sentry.error(err);
		throw err;
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
