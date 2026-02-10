import { compare, hash } from 'bcryptjs';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { copy } from 'fs-extra';
import i18n from 'i18next';
import { verify } from 'jsonwebtoken';
import { cloneDeep, merge } from 'lodash';
import { isAbsolute, resolve } from 'path';
import randomstring from 'randomstring';
import { v4 as uuidV4 } from 'uuid';

import { createJwtToken } from '../controllers/http/auth.js';
import { updatePlaylistSearchVector } from '../dao/playlist.js';
import { deleteBan, deleteUser, insertBan, insertUser, selectAllUsers, selectBans, updateContributorTrustLevel, updateLastLogin, updateUser, updateUserPassword } from '../dao/user.js';
import { DBUser } from '../lib/types/database/user.js';
import { JWTTokenWithRoles, User } from '../lib/types/user.js';
import { getConfig, resolvedPath } from '../lib/utils/config.js';
import { asciiRegexp, tagTypes } from '../lib/utils/constants.js';
import { ErrorKM } from '../lib/utils/error.js';
import { detectFileType, fileExists, smartMove } from '../lib/utils/files.js';
import logger from '../lib/utils/logger.js';
import { isLooselyEqual } from '../lib/utils/objectHelpers.js';
import { Ban, BanType, UserList, UserOptions, UserParams } from '../types/user.js';
import { adminToken } from '../utils/constants.js';
import { sendMail } from '../utils/mailer.js';
import sentry from '../utils/sentry.js';
import { getState } from '../utils/state.js';
import { refreshAnimeList } from './animeList.js';
import { getInbox } from './inbox.js';
import { getKara } from './kara.js';
import { delPubUser, pubUser } from './userPubSub.js';

const service = 'User';

const passwordResetRequests = new Map();

export function getUserLanguage(user: User): string {
	// Fallback to english if no user language recognized
	return user?.language && getState().acceptedLanguages?.includes(user.language) ? user.language : 'en';
}

export async function resetPasswordRequest(username: string) {
	try {
		if (!username) throw new ErrorKM('NO_USER_PROVIDED', 400);
		username = username.toLowerCase();
		const user = await findUserByName(username, { contact: true });
		if (!user) throw new ErrorKM('USER_UNKNOWN', 404, false);
		if (!user.email) throw new ErrorKM('USER_NO_MAIL', 500, false);
		const requestCode = uuidV4();
		passwordResetRequests.set(username, {
			code: requestCode,
			date: +(new Date().getTime() / 1000).toFixed(0)
		});
		const conf = getConfig();

		await sendMail(
			i18n.t('MAIL.RESET_PASSWORD_REQUEST.SUBJECT', { lng: getUserLanguage(user) }),
			i18n.t('MAIL.RESET_PASSWORD_REQUEST.BODY', {
				username,
				host: getConfig().Frontend.Host,
				url: `${conf.Frontend.Secure ? 'https://' : 'http://'}${conf.Frontend.Host}/user/${user.login}/resetPasswordRequest/${requestCode}`,
				lng: getUserLanguage(user)
			}),
			username,
			user.email
		);
	} catch (err) {
		sentry.addErrorInfo('args', JSON.stringify(arguments, null, 2));
		sentry.error(err);
		throw err instanceof ErrorKM ? err : new ErrorKM('USER_RESET_PASSWORD_ERROR');
	}
}

export async function resetPassword(username: string, requestCode: string, newPassword: string) {
	try {
		const request = passwordResetRequests.get(username);
		if (!request) throw new ErrorKM('NO_REQUEST', 400);
		if (request.code !== requestCode) throw new ErrorKM('WRONG_CODE', 400, false);
		const user = await findUserByName(username, {contact: true});
		if (!user) throw new ErrorKM('USER_UNKNOWN', 404, false);
		if (!user.email) throw new ErrorKM('USER_NO_MAIL', 500, false);
		await changePassword(username, newPassword);
		passwordResetRequests.delete(username);

		await sendMail(
			i18n.t('MAIL.RESET_PASSWORD_DONE.SUBJECT', { lng: getUserLanguage(user) }),
			i18n.t('MAIL.RESET_PASSWORD_DONE.BODY', {
				username,
				host: getConfig().Frontend.Host,
				lng: getUserLanguage(user)
			}),
			username,
			user.email
		);
	} catch (err) {
		arguments[2] = undefined;
		sentry.addErrorInfo('args', JSON.stringify(arguments, null, 2));
		sentry.error(err);
		throw err;
	}
}

export async function initUsers() {
	setInterval(cleanupPasswordResetRequests, 60 * 1000);
	if (!await findUserByName('admin')) {
		await createUser({
			login: 'admin',
			password: randomstring.generate(8)
		}, {
			admin: true
		});
	}
}

function cleanupPasswordResetRequests() {
	const now = +(new Date().getTime() / 1000).toFixed(0);
	passwordResetRequests.forEach((user: string, request: any) => {
		if ((request.date + (60 * 60 * 2)) < now) passwordResetRequests.delete(user);
	});
}

export function hashPassword(password: string) {
	const newHash = createHash('sha256');
	newHash.update(password);
	return newHash.digest('hex');
}

export async function findUserByName(username: string, opts: UserOptions = {}) {
	try {
		if (!username) throw new ErrorKM('NO_USER_PROVIDED', 400, false);
		username = username.toLowerCase();
		const user = (await selectAllUsers({ username }))[0];
		if (!user) return null;
		user.password_last_modified_at = new Date(user.password_last_modified_at);
		if (opts.public) {
			// This is not the user requesting his own data, but the public, we check if his flag_public is set.
			if (!user.flag_public) return {
				login: user.login,
				avatar_file: user.avatar_file,
				roles: user.roles,
				nickname: user.nickname
			};
		}
		// If the user has a public profile, but it's not his own profile, we remove the email bit.
		if (!opts.contact) delete user.email;
		if (opts.public || !opts.password) {
			delete user.password_last_modified_at;
			delete user.password;
		}
		return user;
	} catch (err) {
		sentry.addErrorInfo('args', JSON.stringify(arguments, null, 2));
		sentry.error(err);
		logger.error('Error when retrieving an user', { obj: err, service });
		throw err instanceof ErrorKM ? err : new ErrorKM('GET_USER_ERROR');
	}
}

export async function removeUser(username: string) {
	try {
		if (!username) throw new ErrorKM('NO_USER_PROVIDED', 400);
		username = username.toLowerCase();
		// Check if user is the last admin. If so do not delete.
		const users = await getAllUsers();
		const adminUsers = users.content.filter(u => u.roles.admin);
		if (adminUsers.length === 1 && adminUsers[0].login === username) throw new ErrorKM('LAST_ADMIN_USER_CANNOT_BE_DELETED', 400);
		delPubUser(username);
		return await deleteUser(username);
	} catch (err) {
		sentry.addErrorInfo('args', JSON.stringify(arguments, null, 2));
		sentry.error(err);
		throw err instanceof ErrorKM ? err : new ErrorKM('REMOVE_USER_ERROR');
	}
}

export function formatUserList(users: DBUser[], from: number): UserList {
	return {
		infos: {
			count: users[0]?.count || 0,
			from: from || 0,
			to: (from || 0) + users.length
		},
		content: users
	};
}

export async function getAllUsers(opts: UserParams = { publicOnly: false }) {
	try {
		const users = await selectAllUsers(opts);
		if (opts.publicOnly) {
			users.forEach((_, i) => {
				delete users[i].password;
				delete users[i].email;
				delete users[i].password_last_modified_at;
				delete users[i].language;
				delete users[i].location;
			});
		}
		return formatUserList(users, opts.from);
	} catch (err) {
		sentry.addErrorInfo('args', JSON.stringify(arguments, null, 2));
		sentry.error(err);
		throw new ErrorKM('GET_USERS_ERROR');
	}
}

/** Hash passwords with bcrypt */
export function hashPasswordbcrypt(password: string): Promise<string> {
	return hash(password, 10);
}

export async function checkPassword(user: User, password: string) {
	// First we test if password needs to be updated to new hash
	const hashedPasswordSHA = hashPassword(password);
	const hashedPasswordbcrypt = await hashPasswordbcrypt(password);

	if (user.password === hashedPasswordSHA) {
		// Needs update to bcrypt hashed password
		await updateUserPassword(user.login, hashedPasswordbcrypt);
		user.password = hashedPasswordbcrypt;
	}

	return compare(password, user.password);
}

async function checkForBans(user: User): Promise<boolean> {
	const banned = await selectBans();
	const bannedNicknames = banned.filter(b => b.type === 'nickname').map(b => b.value);
	const bannedEMails = banned.filter(b => b.type === 'email').map(b => b.value);
	const bannedUsernames = banned.filter(b => b.type === 'username').map(b => b.value);
	if (bannedUsernames.includes(user.login)) return true;
	if (bannedEMails.includes(user.email)) return true;
	if (bannedNicknames.includes(user.nickname)) return true;
	return false;
}

export async function addBan(ban: Ban) {
	await insertBan(ban);
}

export async function removeBan(ban: Ban) {
	await deleteBan(ban);
}

export async function getBans(type?: BanType) {
	return selectBans(type);
}

export async function createUser(user: User, opts: any = {}) {
	try {
		user.nickname = user.nickname || user.login;
		user.avatar_file = user.avatar_file || 'blank.png';
		user.bio = user.bio || null;
		user.url = user.url || null;
		user.email = user.email || null;
		user.location = user.location || null;
		user.language = user.language || null;
		user.roles = {
			user: true,
			admin: opts.admin
		};
		if (!asciiRegexp.test(user.login) || user.login.includes('@')) throw new ErrorKM('USER_ASCII_CHARACTERS_ONLY', 400, false);
		if (!user.password) throw new ErrorKM('USER_EMPTY_PASSWORD', 400, false);
		if (!user.login) throw new ErrorKM('USER_EMPTY_LOGIN', 400, false);
		user.login = user.login.toLowerCase();
		// Check if login or nickname already exists.
		if ((await selectAllUsers({ username: user.login }))[0] || (await selectAllUsers({ nickname: user.login }))[0]) {
			logger.error(`User/nickname ${user.login} already exists, cannot create it`, { service });
			throw new ErrorKM('USER_ALREADY_EXISTS', 409, false);
		}
		if (user.password.length < 8) throw new ErrorKM('PASSWORD_TOO_SHORT', 400, false);
		user.password = await hashPasswordbcrypt(user.password);
		if (await checkForBans(user)) throw new ErrorKM('CREATE_USER_ERROR', 403, false);
		// Make user admin if they're the very first user being created
		const users = await getAllUsers();
		if (users.content.length === 0) user.roles.admin = true;
		await insertUser(user);
		delete user.password;
		pubUser(user.login);
	} catch (err) {
		const args: any = arguments;
		delete args[0].password;
		sentry.addErrorInfo('args', JSON.stringify(args, null, 2));
		sentry.error(new Error(err.err));
		throw err instanceof ErrorKM ? err : new ErrorKM('CREATE_USER_ERROR');
	}
}

async function replaceAvatar(oldImageFile: string, avatar: Express.Multer.File) {
	try {
		const fileType = await detectFileType(avatar.path);
		if (fileType !== 'jpg' &&
			fileType !== 'gif' &&
			fileType !== 'png') {
			throw new ErrorKM('WRONG_AVATAR_FILE_TYPE', 400, false);
		}
		// Construct the name of the new avatar file with its ID and filetype.
		const newAvatarFile = `${uuidV4()}.${fileType}`;
		const avatarPath = resolve(resolvedPath('Avatars'));
		const newAvatarPath = resolve(avatarPath, newAvatarFile);
		const oldAvatarPath = resolve(avatarPath, oldImageFile);
		if (await fileExists(oldAvatarPath) &&
			oldImageFile !== 'blank.png') await fs.unlink(oldAvatarPath);
		await smartMove(avatar.path, newAvatarPath);
		return newAvatarFile;
	} catch (err) {
		logger.error(`Unable to replace avatar ${oldImageFile} with ${avatar.path}`, { service, obj: err });
		sentry.addErrorInfo('args', JSON.stringify(arguments, null, 2));
		sentry.error(err);
		throw err instanceof ErrorKM ? err : new ErrorKM('AVATAR_ERROR');
	}
}

async function replaceBanner(preview: string) {
	if (preview === 'default.jpg') return preview;
	const customBanner = isAbsolute(preview);
	const file = customBanner ? preview : resolve(resolvedPath('Previews'), preview);
	let fileType: any;
	if (customBanner) {
		fileType = await detectFileType(file);
		if (fileType !== 'jpg' &&
			fileType !== 'png') {
			throw new ErrorKM('WRONG_BANNER_FILE_TYPE', 400, false);
		}
	}
	if (!await fileExists(file)) {
		throw new ErrorKM('BANNER_NOT_GENERATED_YET');
	} else {
		const name = customBanner ? `${uuidV4()}.${fileType}` : preview;
		const target = resolve(resolvedPath('Banners'), name);
		// The banner is already in place (use by somebody else), no need to copy again.
		if (await fileExists(target)) return preview;

		if (!customBanner) {
			const kid = preview.split('.')[0];
			const bans = getConfig().Users.BannerBan;
			const kara = await getKara({
				q: `k:${kid}`,
			});
			for (const key of Object.keys(tagTypes)) {
				for (const tag of kara[key]) {
					if (bans.includes(tag.tid)) {
						throw new ErrorKM('BANNER_BANNED', 403, false);
					}
				}
			}
		}
		await copy(file, target);
		return name;
	}
}

export async function changePassword(username: string, password: string) {
	password = await hashPasswordbcrypt(password);
	return updateUserPassword(username, password);
}

export async function setUserContributorTrustLevel(username: string, level: number) {
	await updateContributorTrustLevel(username, level);
}

export async function addRoleToUser(username: string, role: string) {
	const user = (await selectAllUsers({ username }))[0];
	user.roles[role] = true;
	await editUser(username, user, null, adminToken);
}

export async function removeRoleFromUser(username: string, role: string) {
	const user = (await selectAllUsers({ username }))[0];
	user.roles[role] = false;
	await editUser(username, user, null, adminToken);
}

export async function editUser(username: string, user: User, avatar: Express.Multer.File, token: JWTTokenWithRoles, banner?: Express.Multer.File) {
	try {
		if (!username) throw new ErrorKM('NO_USER_PROVIDED', 400, false);
		username = username.toLowerCase();
		if (token.username.toLowerCase() !== username && token.roles && !token.roles.admin) throw new ErrorKM('CHECK_YOUR_PRIVILEGES', 403, false);
		const currentUser = await findUserByName(username, { password: true });
		if (!currentUser) throw new ErrorKM('USER_UNKNOWN', 404, false);
		const mergedUser = merge(cloneDeep(currentUser), cloneDeep(user));
		delete mergedUser.password;
		if (user.roles && !isLooselyEqual(user.roles, currentUser.roles) && token.roles && !token.roles.admin) throw new ErrorKM('CHECK_YOUR_PRIVILEGES', 403, false);
		if (await checkForBans(mergedUser)) throw new ErrorKM('EDIT_USER_ERROR', 403, false);
		// Check if login already exists.
		if (user.nickname && currentUser.nickname !== user.nickname && (await selectAllUsers({nickname: user.nickname}))[0]) throw new ErrorKM('NICKNAME_ALREADY_USED', 409, false);
		if (user.password) {
			if (user.password.length < 8) throw new ErrorKM('PASSWORD_TOO_SHORT', 400, false);
			const password = await hashPasswordbcrypt(user.password);
			await updateUserPassword(username, password);
		}
		if (banner) {
			if (mergedUser.roles.donator || mergedUser.roles.admin) {
				mergedUser.banner = await replaceBanner(banner.path);
			} else {
				throw new ErrorKM('CHECK_YOUR_PRIVILEGES', 403, false);
			}
		} else if (user.banner) {
			mergedUser.banner = await replaceBanner(user.banner);
		} else {
			mergedUser.banner = currentUser.banner;
		}
		if (avatar) {
			// If a new avatar was sent, it is contained in the avatar object
			// Let's move it to the avatar user directory and update avatar info in
			// database
			mergedUser.avatar_file = await replaceAvatar(currentUser.avatar_file, avatar);
		} else {
			mergedUser.avatar_file = currentUser.avatar_file;
		}
		const updatedUser = await updateUser(mergedUser);
		delete updatedUser.password;
		logger.debug(`${username} (${user.nickname}) profile updated`, { service });
		pubUser(username);

		const animeListToFetch = user.anime_list_to_fetch;
		if ((animeListToFetch !== currentUser.anime_list_to_fetch) ||
			(
				user.social_networks &&
				Object.keys(user.social_networks).length > 0 &&
				user.social_networks[animeListToFetch] !== currentUser.social_networks[animeListToFetch]
			)
		) {
			refreshAnimeList(username).catch();
		}
		if (user.nickname !== currentUser.nickname) {
			updatePlaylistSearchVector(username);
		}
		return {
			user: updatedUser,
			token: createJwtToken(updatedUser.login, updatedUser.roles, new Date(updatedUser.password_last_modified_at))
		};
	} catch (err) {
		logger.error(`Failed to update ${username}'s profile`, { service, obj: err });
		sentry.addErrorInfo('args', JSON.stringify(arguments, null, 2));
		sentry.error(err);
		throw err instanceof ErrorKM ? err : new ErrorKM('EDIT_USER_ERROR');
	}
}

export async function updateUserLastLogin(username: string) {
	await updateLastLogin(username);
}

export async function canSubmitInbox(username: string) {
	const user = (await getAllUsers({publicOnly: false, filter: username})).content.filter(u => u.login === username)[0];
	if (!user) throw new ErrorKM('USER_UNKNOWN', 404, false);
	const trustLevels = getConfig().Frontend.Import.ContributorTrustLevels;
	// Trust levels can be unset, so we test that.
	if (!trustLevels) return true;
	// If level doesn't exist anymore, let's say they can send as many songs as they want.
	const songsAllowed = trustLevels[user.contributor_trust_level];
	if (isNaN(songsAllowed)) return true;
	const inboxesFromUser = await getInbox(true, username);
	const pendingInboxes = inboxesFromUser.filter(i => i.status === 'changes_requested' || i.status === 'in_review' || i.status === 'sent');
	if (pendingInboxes.length > songsAllowed) throw new ErrorKM('USER_INBOX_QUOTA_REACHED', 429, false);
	return true;
}

export function decodeJwtToken(token: string): JWTTokenWithRoles | false {
	try {
		const conf = getConfig();
		const jwt = verify(token, conf.App.JwtSecret) as unknown;
		return jwt as JWTTokenWithRoles;
	} catch (err) {
		return false;
	}
}
