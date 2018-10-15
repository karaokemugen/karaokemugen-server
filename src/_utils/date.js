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

export function timeToSeconds(time) {
	const a = time.split(':'); // split it at the colons
	a[2] = Math.floor(a[2]); // Seconds can have miliseconds
	// minutes are worth 60 seconds. Hours are worth 60 minutes.
	return (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2]);
}
