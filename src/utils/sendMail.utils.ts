import { createTransport, SentMessageInfo } from 'nodemailer';
import loggerUtils from './logger.utils';
import { envConfig } from '../config';

interface EmailAuth {
    user: string;
    pass: string;
}

const sendEmail = async ({
    to,
    subject,
    text,
    html,
    attachments,
}: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    attachments?: { filename: string; path: string }[];
}) => {
    const transporter: SentMessageInfo = createTransport({
        host: String(envConfig.emailHost),
        port: Number(envConfig.emailPort),
        service: 'ethereal',
        auth: {
            user: String(envConfig.emailUser),
            pass: String(envConfig.emailPass),
        } as EmailAuth,
        tls: { rejectUnauthorized: false },
    });

    const mailOptions = {
        from: String(envConfig.emailUser),
        to,
        subject,
        text,
        html,
        attachments,
    };

    transporter
        .sendMail(mailOptions)
        .then((info: string) => {
            loggerUtils.logger.info(info);
        })
        .catch((err: Error) => {
            loggerUtils.logger.error('Error while sending mail', err);
        });
};

export default {
    sendEmail,
};
