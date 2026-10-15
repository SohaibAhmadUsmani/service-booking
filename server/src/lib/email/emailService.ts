export type EmailTemplate =
  | "welcome"
  | "verify-email"
  | "password-reset"
  | "password-changed"
  | "account-locked"
  | "account-unlocked";

export interface OutboundEmail {
  to: string;
  template: EmailTemplate;
  subject: string;
  text: string;
}

/**
 * Transport-agnostic email abstraction.
 * Production should swap the console transport for SES / SendGrid / Nodemailer.
 */
export async function sendEmail(message: OutboundEmail): Promise<void> {
  if (process.env.NODE_ENV === "test") return;
  // eslint-disable-next-line no-console
  console.log(`[email:${message.template}] to=${message.to} subject=${message.subject}`);
}
