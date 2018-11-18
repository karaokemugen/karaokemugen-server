export function timeToSeconds(time) {
	const a = time.split(':'); // split it at the colons
	a[2] = Math.floor(a[2]); // Seconds can have miliseconds
	// minutes are worth 60 seconds. Hours are worth 60 minutes.
	return (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2]);
}
