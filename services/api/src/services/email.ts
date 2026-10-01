import { Resend } from 'resend';
import { logger } from '../utils/logger';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface IEmailProvider {
  sendEmail(options: EmailOptions): Promise<boolean>;
}

export class ConsoleEmailProvider implements IEmailProvider {
  async sendEmail(options: EmailOptions): Promise<boolean> {
    logger.info(`[EMAIL SIMULATED] To: ${options.to} | Subject: ${options.subject}`);
    logger.debug(`[EMAIL BODY]:\n${options.text || options.html}`);
    return true;
  }
}

export class ResendEmailProvider implements IEmailProvider {
  private resend: Resend;
  private defaultFrom: string;

  constructor(apiKey: string, defaultFrom?: string) {
    this.resend = new Resend(apiKey);
    this.defaultFrom = defaultFrom || process.env.EMAIL_FROM || 'Kraxyy Apply <noreply@kraxyy.com>';
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    const fromAddress = options.from || this.defaultFrom;
    try {
      const { data, error } = await this.resend.emails.send({
        from: fromAddress,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      });

      if (error) {
        logger.error(`[RESEND ERROR] Failed to send email to ${options.to}: ${error.message} (name: ${error.name})`);
        return false;
      }

      logger.info(`[RESEND SENT] Successfully dispatched email to ${options.to} (id: ${data?.id})`);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(`[RESEND EXCEPTION] Unexpected failure dispatching email to ${options.to}: ${msg}`);
      return false;
    }
  }
}

export class EmailService {
  private customProvider?: IEmailProvider;

  private getProvider(): IEmailProvider {
    if (this.customProvider) {
      return this.customProvider;
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const emailProvider = process.env.EMAIL_PROVIDER?.toLowerCase();

    if (resendApiKey && resendApiKey.trim() !== '' && emailProvider !== 'console') {
      const from = process.env.EMAIL_FROM || 'Kraxyy Apply <noreply@kraxyy.com>';
      return new ResendEmailProvider(resendApiKey, from);
    }

    return new ConsoleEmailProvider();
  }

  /**
   * Set custom provider for testing or runtime configuration
   */
  setProvider(provider: IEmailProvider): void {
    this.customProvider = provider;
  }

  async sendVerificationEmail(email: string, token: string): Promise<boolean> {
    const appUrl = (process.env.APP_URL || process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
    const link = `${appUrl}/verify-email?token=${encodeURIComponent(token)}`;

    return this.getProvider().sendEmail({
      to: email,
      subject: 'Verify your Kraxyy Apply account',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify your Kraxyy Apply account</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #F4EFE4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E2315;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F4EFE4; padding: 40px 16px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" style="max-width: 540px; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #D6CAAC; box-shadow: 0 10px 30px -4px rgba(82, 91, 49, 0.1); overflow: hidden; padding: 36px 32px;">
                  <tr>
                    <td align="center" style="padding-bottom: 24px;">
                      <span style="font-size: 24px; font-weight: 800; letter-spacing: -0.03em; color: #525B31;">Kraxyy Apply</span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <h1 style="font-size: 20px; font-weight: 700; color: #1E2315; margin: 0 0 16px 0; text-align: center;">Welcome to Kraxyy Apply</h1>
                      <p style="font-size: 14px; line-height: 1.6; color: #626B52; margin: 0 0 24px 0; text-align: center;">
                        Please verify your email address to activate your account and start your automated job search.
                      </p>
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                        <tr>
                          <td align="center">
                            <a href="${link}" style="display: inline-block; background-color: #525B31; color: #FFFFFF; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 8px;">
                              Verify Email Address
                            </a>
                          </td>
                        </tr>
                      </table>
                      <p style="font-size: 12px; line-height: 1.5; color: #8E987E; margin: 24px 0 0 0; text-align: center;">
                        If the button above does not work, copy and paste this link into your browser:<br>
                        <a href="${link}" style="color: #525B31; word-break: break-all;">${link}</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `Verify your Kraxyy Apply account:\n\n${link}`
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
    const appUrl = (process.env.APP_URL || process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
    const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;

    return this.getProvider().sendEmail({
      to: email,
      subject: 'Reset your password',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset your password</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #F4EFE4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E2315;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F4EFE4; padding: 40px 16px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" style="max-width: 540px; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #D6CAAC; box-shadow: 0 10px 30px -4px rgba(82, 91, 49, 0.1); overflow: hidden; padding: 36px 32px;">
                  <tr>
                    <td align="center" style="padding-bottom: 24px;">
                      <div style="display: inline-block;">
                        <span style="font-size: 24px; font-weight: 800; letter-spacing: -0.03em; color: #525B31;">Kraxyy</span>
                        <span style="font-size: 24px; font-weight: 800; letter-spacing: -0.03em; color: #B18B40; margin-left: 4px;">Apply</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <h1 style="font-size: 20px; font-weight: 700; color: #1E2315; margin: 0 0 16px 0; text-align: center;">Reset Your Password</h1>
                      <p style="font-size: 14px; line-height: 1.6; color: #626B52; margin: 0 0 20px 0; text-align: center;">
                        We received a request to reset the password for your Kraxyy Apply account. Click the button below to choose a new password.
                      </p>
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                        <tr>
                          <td align="center">
                            <a href="${resetUrl}" style="display: inline-block; background-color: #525B31; color: #FFFFFF; font-size: 14px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; letter-spacing: 0.01em;">
                              Reset Password
                            </a>
                          </td>
                        </tr>
                      </table>
                      <div style="background-color: #FAF7F1; border: 1px solid #EAE2D2; border-radius: 8px; padding: 14px 16px; margin: 24px 0 16px 0;">
                        <p style="font-size: 12px; line-height: 1.5; color: #626B52; margin: 0;">
                          <strong>Expiration Notice:</strong> This password reset link will expire in <strong>15 minutes</strong> and can only be used once for your security.
                        </p>
                      </div>
                      <p style="font-size: 12px; line-height: 1.5; color: #8E987E; margin: 16px 0 0 0; text-align: center;">
                        If the button above does not work, copy and paste this URL into your browser:<br>
                        <a href="${resetUrl}" style="color: #525B31; word-break: break-all; text-decoration: underline;">${resetUrl}</a>
                      </p>
                      <hr style="border: none; border-top: 1px solid #EAE2D2; margin: 28px 0 16px 0;" />
                      <p style="font-size: 11px; line-height: 1.5; color: #8E987E; margin: 0; text-align: center;">
                        <strong>Security Notice:</strong> If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged and your account stays secure.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `Reset your password - Kraxyy Apply\n\nWe received a request to reset your password. Use the link below to set a new password:\n\n${resetUrl}\n\nThis link will expire in 15 minutes and can only be used once.\n\nIf you did not request a password reset, please ignore this email. Your password will not change.`
    });
  }

  async sendContactNotification(request: {
    name: string;
    email: string;
    category: string;
    message: string;
    source: string;
  }): Promise<boolean> {
    const adminEmail = process.env.ADMIN_EMAIL || 'team@kraxyy.com';
    return this.getProvider().sendEmail({
      to: adminEmail,
      subject: `[Kraxyy Connect] New message from ${request.name} (${request.category})`,
      html: `
        <div style="font-family: sans-serif; background-color: #FAF7F1; padding: 24px; border: 1px solid #D6CAAC; border-radius: 8px;">
          <h2 style="color: #525B31; margin-top: 0;">New Contact Submission</h2>
          <p><strong>Name:</strong> ${request.name}</p>
          <p><strong>Email:</strong> ${request.email}</p>
          <p><strong>Category:</strong> ${request.category}</p>
          <p><strong>Source:</strong> ${request.source}</p>
          <hr style="border: none; border-top: 1px solid #EAE2D2; margin: 16px 0;" />
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap; background: #FFFFFF; padding: 12px; border-radius: 6px; border: 1px solid #EAE2D2;">${request.message}</p>
        </div>
      `,
      text: `New contact submission from ${request.name} (${request.email}) [${request.category} via ${request.source}]:\n\n${request.message}`
    });
  }
}

export const emailService = new EmailService();
