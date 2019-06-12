import nodemailer, { Transporter } from 'nodemailer';
import {getConfig} from '../lib/utils/config';
import logger from '../lib/utils/logger';
import { MailOptions } from 'nodemailer/lib/smtp-transport';

let transporter: Transporter;
let mailOptions: MailOptions;

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
		from: conf.From,
		to: conf.To
	};

}

export function sendMail(subject: string, message: string) {
	transporter.sendMail({...mailOptions,
		subject: subject,
		text: message
	}, (error: Error, info: any) => {
		if (error) {
			logger.debug(`[Mailer] Error sending mail : ${error}`);
			throw error;
		} else {
			logger.debug(`[Mailer] Sent mail : ${JSON.stringify(info, null, 2)}`);
		}
	});
}

