export const MAIL_PROVIDER = Symbol('MAIL_PROVIDER');

export interface SendMailParams {
  to: string;
  subject: string;
  html: string;
}

/** Contract every email transport (SES, SMTP, console...) must fulfil. Must throw when delivery fails. */
export interface IMailProvider {
  send(params: SendMailParams): Promise<void>;
}
