export function time() {
	const date = new Date();
	let hour = date.getHours();
	hour = (hour < 10 ? '0' : '') + hour;
	let min  = date.getMinutes();
	min = (min < 10 ? '0' : '') + min;
	let sec  = date.getSeconds();
	sec = (sec < 10 ? '0' : '') + sec;
	return hour + ':' + min + ':' + sec;
}