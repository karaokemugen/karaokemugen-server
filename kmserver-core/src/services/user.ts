import {createHash} from 'crypto';
import {hash, compare} from 'bcryptjs';
import { promises as fs } from 'fs';
import merge from 'lodash.merge';
import {updateUser, updateUserPassword, insertUser, selectUser, selectAllUsers, deleteUser, updateLastLogin} from '../dao/user';
import logger from '../lib/utils/logger';
import {getConfig, resolvedPathAvatars, resolvedPathBanners, resolvedPathPreviews} from '../lib/utils/config';
import {asyncExists, asyncMove, detectFileType} from '../lib/utils/files';
import { v4 as uuidV4 } from 'uuid';
import {resolve} from 'path';
import { User, Token } from '../lib/types/user';
import { sendMail } from '../utils/mailer';
import randomstring from 'randomstring';
import sentry from '../utils/sentry';
import {getRole, createJwtToken } from '../controllers/http/auth';
import {UserList, UserOptions, UserParams} from '../types/user';
import { delPubUser, pubUser } from './user_pubsub';
import {asciiRegexp, tagTypes} from '../lib/utils/constants';
import {copy} from 'fs-extra';
import {DBUser} from '../lib/types/database/user';
import {getKara} from './kara';

const passwordResetRequests = new Map();

export async function resetPasswordRequest(username: string) {
	try {
		if (!username) throw('No user provided');
		username = username.toLowerCase();
		const user = await findUserByName(username);
		if (!user) throw new Error('User unknown');
		if (!user.email) throw new Error('User has no configured mail. Ask server admin for a password reset');
		const requestCode = uuidV4();
		passwordResetRequests.set(username, {
			code: requestCode,
			date: +(new Date().getTime() / 1000).toFixed(0)
		});
		const conf = getConfig();
		sendMail('Karaoke Mugen Password Reset',`
		Hello ${username},

		You (or someone) requested a password reset for your account at ${getConfig().API.Host}. If you didn't request this, please ignore this email.

		Please click the following link to get a new, randomized password sent to your mail account :

		${conf.API.Secure ? 'https://' : 'http://'}${conf.API.Host}/api/users/${username}/resetpassword/${requestCode}

		This link will expire in two hours.
		`,
		username,
		user.email);
	} catch(err) {
		if (err.message !== 'User unknown' && err.message !== 'User has no configured mail. Ask server admin for a password reset') {
			sentry.addErrorInfo('args', JSON.stringify(arguments, null, 2));
			sentry.error(err);
		}
		throw err;
	}
}

export async function resetPassword(username: string, requestCode: string) {
	try {
		const request = passwordResetRequests.get(username);
		if (!request) throw new Error('No request');
		if (request.code !== requestCode) throw new Error('Wrong code');
		const user = await findUserByName(username);
		if (!user) throw new Error('User unknown');
		const newPassword = randomstring.generate(12);
		await changePassword(username, newPassword);
		passwordResetRequests.delete(username);
		sendMail('Karaoke Mugen Password has been reset',`
		Hello ${username},

		You (or someone) requested a password reset for your account at ${getConfig().API.Host}.

		Your password has been reset to the following :
		${newPassword}

		Please login using a Karaoke Mugen Application and change it to something else.

		`,
		username,
		user.email);
	} catch(err) {
		if (err.message !== 'No request' && err.message !== 'User unknown') {
			sentry.addErrorInfo('args', JSON.stringify(arguments, null, 2));
			sentry.error(err);
		}
		throw err;
	}
}

export async function initUsers() {
	setInterval(cleanupPasswordResetRequests, 60 * 1000);
}

function cleanupPasswordResetRequests() {
	const now = +(new Date().getTime() / 1000).toFixed(0);
	passwordResetRequests.forEach((user: string, request: any) => {
		if ((request.date + (60 * 60 * 2)) < now ) passwordResetRequests.delete(user);
	});
}

export function hashPassword(password: string) {
	const hash = createHash('sha256');
	hash.update(password);
	return hash.digest('hex');
}

export async function findUserByName(username: string, opts: UserOptions = {}) {
	try {
		if (!username) throw('No user provided');
		username = username.toLowerCase();
		const user = await selectUser('pk_login', username);
		if (!user) return user;
		user.password_last_modified_at = new Date(user.password_last_modified_at);
		if (opts.public) {
			// This is not the user requesting his own data, but the public, we check if his flag_public is set.
			if (!user.flag_public) return {
				login: user.login,
				avatar_file: user.avatar_file,
				type: user.type,
				nickname: user.nickname
			};
			// If the user has a public profile, but it's not his own profile, we remove the email bit.
			delete user.email;
		}
		if (opts.public || !opts.password) {
			delete user.password_last_modified_at;
			delete user.password;
		}
		return user;
	} catch(err) {
		sentry.addErrorInfo('args', JSON.stringify(arguments, null, 2));
		sentry.error(err);
		logger.error('Error when retrieving an user', {obj: err, service: 'User'});
		throw err;
	}
}

export async function removeUser(username: string) {
	try {
		if (!username) throw('No user provided');
		username = username.toLowerCase();
		delPubUser(username);
		return await deleteUser(username);
	} catch(err) {
		sentry.addErrorInfo('args', JSON.stringify(arguments, null, 2));
		sentry.error(err);
		throw err;
	}
}

export function formatUserList(users: DBUser[], from: number): UserList {
	return {
		infos: {
			count: users[0]?.count || 0,
			from,
			to: from + users.length
		},
		content: users
	};
}

export async function getAllUsers(opts: UserParams = {public: false}) {
	try {
		const users = (await selectAllUsers(opts.filter, opts.from, opts.size, true)).filter(u => u.flag_public && opts.public);
		if (opts.public) {
			for (const index in users) {
				delete users[index].password;
				delete users[index].email;
				delete users[index].password_last_modified_at;
				delete users[index].language;
				delete users[index].location;
			}
		}
		return formatUserList(users, opts.from);
	} catch(err) {
		sentry.addErrorInfo('args', JSON.stringify(arguments, null, 2));
		sentry.error(err);
		throw err;
	}
}

/** Hash passwords with bcrypt */
export function hashPasswordbcrypt(password: string): Promise<string> {
	return hash(password, 10);
}


export async function checkPassword(user: User,password: string) {
	// First we test if password needs to be updated to new hash
	const hashedPasswordSHA = hashPassword(password);
	const hashedPasswordbcrypt = await hashPasswordbcrypt(password);

	if (user.password === hashedPasswordSHA) {
		// Needs update to bcrypt hashed password
		await updateUserPassword(user.login, hashedPasswordbcrypt);
		user.password = hashedPasswordbcrypt;
	}

	return await compare(password, user.password);
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
		opts.admin ? user.type = 2 : user.type = 1;
		if (!asciiRegexp.test(user.login)) throw { code: 'USER_ASCII_CHARACTERS_ONLY'};
		if (!user.password) throw { code: 'USER_EMPTY_PASSWORD'};
		if (!user.login) throw { code: 'USER_EMPTY_LOGIN'};
		user.login = user.login.toLowerCase();
		// Check if login or nickname already exists.
		if (await selectUser('pk_login', user.login) || await selectUser('nickname', user.login)) {
			logger.error(`User/nickname ${user.login} already exists, cannot create it`, {service: 'User'});
			throw { code: 'USER_ALREADY_EXISTS', data: {username: user.login}};
		}
		if (user.password.length < 8) throw {code: 'PASSWORD_TOO_SHORT', data: user.password.length};
		user.password = await hashPasswordbcrypt(user.password);
		try {
			await insertUser(user);
			delete user.password;
			pubUser(user.login);
		} catch (err) {
			logger.error(`Unable to create user ${user.login}`, {service: 'User', obj: err});
			throw ({ code: 'USER_CREATION_ERROR', data: err});
		}
	} catch(err) {
		if (err.code !== 'USER_ALREADY_EXISTS') {
			const args: any = arguments;
			delete args.user.password;
			sentry.addErrorInfo('args', JSON.stringify(args, null, 2));
			sentry.error(new Error(err.err));
		}
		throw err;
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
		const avatarPath = resolve(resolvedPathAvatars());
		const newAvatarPath = resolve(avatarPath, newAvatarFile);
		const oldAvatarPath = resolve(avatarPath, oldImageFile);
		if (await asyncExists(oldAvatarPath) &&
			oldImageFile !== 'blank.png') await fs.unlink(oldAvatarPath);
		await asyncMove(avatar.path, newAvatarPath);
		return newAvatarFile;
	} catch (err) {
		logger.error(`Unable to replace avatar ${oldImageFile} with ${avatar.path}`, {service: 'User', obj: err});
		sentry.addErrorInfo('args', JSON.stringify(arguments, null, 2));
		sentry.error(err);
		throw err;
	}
}

async function replaceBanner(preview: string) {
	if (preview === 'default.jpg') return preview;
	const file = resolve(resolvedPathPreviews(), preview);
	if (!await asyncExists(file)) {
		throw new Error('The requested preview is not available nor generated.');
	} else {
		const target = resolve(resolvedPathBanners(), preview);
		// The banner is already in place (use by somebody else), no need to copy again.
		if (await asyncExists(target)) return preview;
		else {
			await copy(file, target);
			const kid = preview.split('.')[0];
			const bans = getConfig().Users.BannerBan;
			const kara = await getKara({
				q: `k:${kid}`,
			});
			for (const key of Object.keys(tagTypes)) {
				for (const tag of kara[key]) {
					if (bans.includes(tag.tid)) {
						throw {code: 'BANNER_BANNED', data: 'This banner cannot be used'};
					}
				}
			}
			return preview;
		}
	}
}

export async function changePassword(username: string, password: string) {
	try {
		password = await hashPasswordbcrypt(password);
		return await updateUserPassword(username, password);
	} catch(err) {
		sentry.error(err);
		throw err;
	}
}

export async function editUser(username: string, user: User, avatar: Express.Multer.File, token: Token) {
	try {
		if (!username) throw 'No user provided';
		username = username.toLowerCase();
		if (token.username.toLowerCase() !== username && token.role !== 'admin') throw 'Only admins can edit another user';
		const currentUser = await findUserByName(username, {password: true});
		if (!currentUser) throw 'User unknown';
		const mergedUser = merge(currentUser, user);
		delete mergedUser.password;
		if (user.type && user.type !== currentUser.type && token.role !== 'admin') throw 'Only admins can change a user\'s type';
		// Check if login already exists.
		if (user.nickname && currentUser.nickname !== user.nickname && await selectUser('nickname', user.nickname)) throw 'Nickname already exists';
		if (user.password) {
			if (user.password.length < 8) throw {code: 'PASSWORD_TOO_SHORT', data: user.password.length};
			const password = await hashPasswordbcrypt(user.password);
			await updateUserPassword(username, password);
		}
		if (user.banner) {
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
		logger.debug(`${username} (${user.nickname}) profile updated`, {service: 'User'});
		pubUser(username);
		return {
			user: updatedUser,
			token: createJwtToken(updatedUser.login, getRole(updatedUser), new Date(updatedUser.password_last_modified_at))
		};
	} catch (err) {
		logger.error(`Failed to update ${username}'s profile`, {service: 'User', obj: err});
		if (err !== 'Nickname already exists') {
			sentry.addErrorInfo('args', JSON.stringify(arguments, null, 2));
			sentry.error(new Error(err));
		}
		throw {
			message: err,
			data: user.nickname
		};
	}
}

export async function updateUserLastLogin(username: string) {
	try {
		await updateLastLogin(username);
	} catch(err) {
		logger.error(`[Users] Unable to update login time for ${username} : ${err}`);
	}
}
