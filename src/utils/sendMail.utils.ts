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
        auth: {
            user: String(envConfig.emailUser),
            pass: String(envConfig.emailPass),
        } as EmailAuth,
    });

    const mailOptions = {
        from: String(envConfig.emailUser),
        to,
        subject,
        ...(text && { text }),
        ...(html && { html }),
        ...(attachments && { attachments }),
    };

    transporter
        .sendMail(mailOptions)
        .then(() => {
            loggerUtils.logger.info('Email sent successfully.');
        })
        .catch((err: Error) => {
            loggerUtils.logger.error('Error while sending mail', err);
        });
};

export default {
    sendEmail,
};
