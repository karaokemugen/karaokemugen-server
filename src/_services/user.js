import {createHash} from 'crypto';
// Empty for now

export function hashPassword(password) {
	const hash = createHash('sha256');
	hash.update(password);		
	return hash.digest('hex');
}

export async function findUserByName(username) {
	return username;
}

export async function checkPassword(username,password) {
	const hashedPassword = hashPassword(password);
	const user = await findUserByName(username, {public:false});
	if (user.password === hashedPassword) return true;
	return false;
}
