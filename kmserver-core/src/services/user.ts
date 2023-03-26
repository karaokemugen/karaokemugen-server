import { compare, hash } from 'bcryptjs';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { copy } from 'fs-extra';
import { verify } from 'jsonwebtoken';
import { cloneDeep, merge } from 'lodash';
import { isAbsolute, resolve } from 'path';
import randomstring from 'randomstring';
import { v4 as uuidV4 } from 'uuid';

import { createJwtToken } from '../controllers/http/auth';
import { deleteUser, insertUser, selectAllUsers, selectUser, updateLastLogin, updateUser, updateUserPassword } from '../dao/user';
import { DBUser } from '../lib/types/database/user';
import { JWTTokenWithRoles, User } from '../lib/types/user';
import { getConfig, resolvedPath } from '../lib/utils/config';
import { asciiRegexp, tagTypes } from '../lib/utils/constants';
import { detectFileType, fileExists, smartMove } from '../lib/utils/files';
import logger from '../lib/utils/logger';
import { isLooselyEqual } from '../lib/utils/objectHelpers';
import { UserList, UserOptions, UserParams } from '../types/user';
import { adminToken } from '../utils/constants';
import { sendMail } from '../utils/mailer';
import sentry, { NoSentryError } from '../utils/sentry';
import { refreshAnimeList } from './animeList';
import { getKara } from './kara';
import { delPubUser, pubUser } from './userPubSub';

const service = 'User';

const passwordResetRequests = new Map();

export async function resetPasswordRequest(username: string) {
	try {
		if (!username) throw new NoSentryError('No user provided');
		username = username.toLowerCase();
		const user = await findUserByName(username, { contact: true });
		if (!user) throw new NoSentryError('User unknown');
		if (!user.email) throw new NoSentryError('User has no configured mail. Ask server admin for a password reset');
		const requestCode = uuidV4();
		passwordResetRequests.set(username, {
			code: requestCode,
			date: +(new Date().getTime() / 1000).toFixed(0)
		});
		const conf = getConfig();
		sendMail(
			'Karaoke Mugen Password Reset',
			`
		Hello ${username},

		You (or someone) requested a password reset for your account at ${getConfig().API.Host}. If you didn't request this, please ignore this email.

		Please click the following link to get a new, randomized password sent to your mail account :

		${conf.API.Secure ? 'https://' : 'http://'}${conf.API.Host}/api/users/${username}/resetpassword/${requestCode}

		This link will expire in two hours.
		`,
			username,
			user.email
		);
	} catch (err) {
		sentry.addErrorInfo('args', JSON.stringify(arguments, null, 2));
		sentry.error(err);
		throw err;
	}
}

export async function resetPassword(username: string, requestCode: string) {
	try {
		const request = passwordResetRequests.get(username);
		if (!request) throw new NoSentryError('No request');
		if (request.code !== requestCode) throw new NoSentryError('Wrong code');
		const user = await findUserByName(username, {contact: true});
		if (!user) throw new NoSentryError('User unknown');
		if (!user.email) throw new NoSentryError('User has no configured mail. Ask server admin for a password reset');
		const newPassword = randomstring.generate(12);
		await changePassword(username, newPassword);
		passwordResetRequests.delete(username);
		sendMail(
			'Karaoke Mugen Password has been reset',
			`
		Hello ${username},

		You (or someone) requested a password reset for your account at ${getConfig().API.Host}.

		Your password has been reset to the following :
		${newPassword}

		Please login using a Karaoke Mugen Application and change it to something else.

		`,
			username,
			user.email
		);
	} catch (err) {
		sentry.addErrorInfo('args', JSON.stringify(arguments, null, 2));
		sentry.error(err);
		throw err;
	}
}

export async function initUsers() {
	setInterval(cleanupPasswordResetRequests, 60 * 1000);
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
		if (!username) throw ('No user provided');
		username = username.toLowerCase();
		const user = await selectUser('pk_login', username);
		if (!user) return user;
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
		throw err;
	}
}

export async function removeUser(username: string) {
	try {
		if (!username) throw ('No user provided');
		username = username.toLowerCase();
		delPubUser(username);
		return await deleteUser(username);
	} catch (err) {
		sentry.addErrorInfo('args', JSON.stringify(arguments, null, 2));
		sentry.error(err);
		throw err;
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

export async function getAllUsers(opts: UserParams = { public: false }) {
	try {
		const users = (await selectAllUsers(opts.filter, opts.from, opts.size, true)).filter(u => u.flag_public && opts.public);
		if (opts.public) {
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
		throw err;
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
		if (!asciiRegexp.test(user.login)) throw { code: 'USER_ASCII_CHARACTERS_ONLY' };
		if (!user.password) throw { code: 'USER_EMPTY_PASSWORD' };
		if (!user.login) throw { code: 'USER_EMPTY_LOGIN' };
		user.login = user.login.toLowerCase();
		verifyNameBans(user);
		// Check if login or nickname already exists.
		if (await selectUser('pk_login', user.login) || await selectUser('nickname', user.login)) {
			logger.error(`User/nickname ${user.login} already exists, cannot create it`, { service });
			throw { code: 'USER_ALREADY_EXISTS', data: { username: user.login } };
		}
		if (user.password.length < 8) throw { code: 'PASSWORD_TOO_SHORT', data: user.password.length };
		user.password = await hashPasswordbcrypt(user.password);
		try {
			await insertUser(user);
			delete user.password;
			pubUser(user.login);
		} catch (err) {
			logger.error(`Unable to create user ${user.login}`, { service, obj: err });
			throw ({ code: 'USER_CREATION_ERROR', data: err });
		}
	} catch (err) {
		if (err.code !== 'USER_ALREADY_EXISTS') {
			const args: any = arguments;
			delete args.user.password;
			sentry.addErrorInfo('args', JSON.stringify(args, null, 2));
			sentry.error(new Error(err.err));
		}
		throw err;
	}
}

function verifyNameBans(user: User) {
	const conf = getConfig();
	if (conf.Users?.NameBan) for (const ban of conf.Users.NameBan) {
		const regexp = new RegExp(ban, 'g');
		if (user.login.match(regexp) || user.nickname.match(regexp)) throw 'Login or nickname contains banned strings';
	}
}

async function replaceAvatar(oldImageFile: string, avatar: Express.Multer.File) {
	try {
		const fileType = await detectFileType(avatar.path);
		if (fileType !== 'jpg' &&
			fileType !== 'gif' &&
			fileType !== 'png') {
			throw 'Wrong avatar file type';
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
		throw err;
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
			throw { code: 'INVALID_FILE', data: 'Please input valid banners (jpg, png)' };
		}
	}
	if (!await fileExists(file)) {
		throw new Error('The requested preview is not available nor generated.');
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
						throw { code: 'BANNER_BANNED', data: 'This banner cannot be used' };
					}
				}
			}
		}
		await copy(file, target);
		return name;
	}
}

export async function changePassword(username: string, password: string) {
	try {
		password = await hashPasswordbcrypt(password);
		return await updateUserPassword(username, password);
	} catch (err) {
		sentry.error(err);
		throw err;
	}
}

export async function addRoleToUser(username: string, role: string) {
	const user = await selectUser('pk_login', username);
	user.roles[role] = true;
	await editUser(username, user, null, adminToken);
}

export async function removeRoleFromUser(username: string, role: string) {
	const user = await selectUser('pk_login', username);
	user.roles[role] = false;
	await editUser(username, user, null, adminToken);
}

export async function editUser(username: string, user: User, avatar: Express.Multer.File, token: JWTTokenWithRoles, banner?: Express.Multer.File) {
	try {
		if (!username) throw 'No user provided';
		username = username.toLowerCase();
		if (token.username.toLowerCase() !== username && token.roles && !token.roles.admin) throw 'Only admins can edit another user';
		const currentUser = await findUserByName(username, { password: true });
		if (!currentUser) throw 'User unknown';
		const mergedUser = merge(cloneDeep(currentUser), cloneDeep(user));
		verifyNameBans(user);
		delete mergedUser.password;
		if (user.roles && !isLooselyEqual(user.roles, currentUser.roles) && token.roles && !token.roles.admin) throw 'Only admins can change a user\'s roles';
		// Check if login already exists.
		if (user.nickname && currentUser.nickname !== user.nickname && await selectUser('nickname', user.nickname)) throw 'Nickname already exists';
		if (user.password) {
			if (user.password.length < 8) throw { code: 'PASSWORD_TOO_SHORT', data: user.password.length };
			const password = await hashPasswordbcrypt(user.password);
			await updateUserPassword(username, password);
		}
		if (banner) {
			if (mergedUser.roles.donator || mergedUser.roles.admin) {
				mergedUser.banner = await replaceBanner(banner.path);
			} else {
				throw { code: 'BANNER_BANNED', data: 'This function is reserved to donators' };
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
			(user.social_networks[animeListToFetch] !== currentUser.social_networks[animeListToFetch])
		) {
			refreshAnimeList(username).catch();
		}
		return {
			user: updatedUser,
			token: createJwtToken(updatedUser.login, updatedUser.roles, new Date(updatedUser.password_last_modified_at))
		};
	} catch (err) {
		logger.error(`Failed to update ${username}'s profile`, { service, obj: err });
		if (err !== 'Nickname already exists') {
			sentry.addErrorInfo('args', JSON.stringify(arguments, null, 2));
			sentry.error(new Error(err));
		}
		throw err;
	}
}

export async function updateUserLastLogin(username: string) {
	try {
		await updateLastLogin(username);
	} catch (err) {
		logger.error(`Unable to update login time for ${username}`, { service, obj: err });
	}
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
