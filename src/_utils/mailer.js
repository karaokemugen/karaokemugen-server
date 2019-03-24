import nodemailer from 'nodemailer';
import {getConfig} from './config';
import logger from 'winston';

let transporter;
let mailOptions;

export function initMailer() {
	const conf = getConfig().Mail;
	transporter = nodemailer.createTransport({
		host: conf.Host,
		port: conf.Port,
		secure: conf.Secure,
		auth: {
			user: conf.Auth.User,
			pass: conf.Auth.Password,
		}
	});

	mailOptions = {
		from: `"${conf.From}" <${conf.FromMail}>`,
		to: `"${conf.To}" <${conf.ToMail}>`
	};

}

export function sendMail(subject, message) {
	transporter.sendMail({...mailOptions,
		subject: subject,
		text: message
	}, (error, info) => {
		if (error) {
			logger.debug(`[Mailer] Error sending mail : ${error}`);
			throw error;
		}
		logger.debug(`[Mailer] Sent mail : ${JSON.Stringify(info, null, 2)}`);
	});
}

