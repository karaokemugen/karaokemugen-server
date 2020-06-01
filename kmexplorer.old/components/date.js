import { i18n } from '../i18n'

//FormatDateString From Duration in Seconds
export default function duration(duration) {
	duration = parseInt(duration)
	if(typeof duration !== 'number'){
		throw `The parameter ${duration} is supposed to be a number !`;
	}

	if(Math.floor(duration) !== duration || duration <= 0){
		throw `The parameter ${duration} is supposed to be "entier" and be superior to 0`;
	}

	// calculate (and subtract) whole days
	const days = Math.floor(duration / 86400);

	duration -= days * 86400;

	// calculate (and subtract) whole hours
	const hours = Math.floor(duration / 3600) % 24;
	duration -= hours * 3600;

	// calculate (and subtract) whole minutes
	const minutes = Math.floor(duration / 60) % 60;
	duration -= minutes * 60;

	// what's left is seconds
	const seconds = duration % 60;  // in theory the modulus is not required
	let returnString = '';
	if (days !== 0) returnString = returnString + `${days} ${i18n.t("duration.days")} `;
	if (hours !== 0) returnString = returnString + `${hours} ${i18n.t("duration.hours")} `;
	if (minutes !== 0) returnString = returnString + `${minutes} ${i18n.t("duration.minutes")} `;
	if (seconds !== 0) returnString = returnString + `${seconds} ${i18n.t("duration.seconds")} `;
	return returnString;
}
