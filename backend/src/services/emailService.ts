import nodemailer, { Transporter } from 'nodemailer';
import { CreditStatus } from '../types';

class EmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  /**
   * Send email verification
   */
  async sendVerificationEmail(
    email: string,
    firstName: string,
    verificationToken: string
  ): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@linkedinagent.com',
      to: email,
      subject: 'Verify Your Email - LinkedIn Agent',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #0066cc;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Welcome to LinkedIn Agent, ${firstName}!</h2>
            <p>Thank you for signing up. Please verify your email address to get started.</p>
            <a href="${verificationUrl}" class="button">Verify Email</a>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #0066cc;">${verificationUrl}</p>
            <p>This link will expire in 24 hours.</p>
            <div class="footer">
              <p>If you didn't create this account, please ignore this email.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await this.transporter.sendMail(mailOptions);
  }

  /**
   * Send credit warning email
   */
  async sendCreditWarning(
    email: string,
    firstName: string,
    credits: CreditStatus,
    level: 'low' | 'critical'
  ): Promise<void> {
    const subject =
      level === 'critical'
        ? 'Critical: Almost Out of Credits'
        : 'Low Credit Warning';

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@linkedinagent.com',
      to: email,
      subject: `${subject} - LinkedIn Agent`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .warning {
              background-color: ${level === 'critical' ? '#dc3545' : '#ffc107'};
              color: white;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
            }
            .stats {
              background-color: #f8f9fa;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #0066cc;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Credit Warning</h2>
            <div class="warning">
              <h3>Hi ${firstName},</h3>
              <p>You're running ${level === 'critical' ? 'critically' : ''} low on credits!</p>
            </div>
            <div class="stats">
              <p><strong>Remaining Credits:</strong> ${credits.remaining} / ${credits.dailyLimit}</p>
              <p><strong>Usage:</strong> ${credits.percentUsed.toFixed(1)}%</p>
              <p><strong>Next Refresh:</strong> ${new Date(credits.nextRefresh).toLocaleString()}</p>
            </div>
            <p>Consider upgrading your plan for more daily credits!</p>
            <a href="${process.env.FRONTEND_URL}/upgrade" class="button">Upgrade Plan</a>
          </div>
        </body>
        </html>
      `
    };

    await this.transporter.sendMail(mailOptions);
  }

  /**
   * Send welcome email after verification
   */
  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@linkedinagent.com',
      to: email,
      subject: 'Welcome to LinkedIn Agent!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .feature { margin: 15px 0; }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #0066cc;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Welcome aboard, ${firstName}!</h2>
            <p>Your email has been verified and you're all set to start using LinkedIn Agent.</p>
            <h3>What you can do:</h3>
            <div class="feature">📊 <strong>Profile Scanning:</strong> 1 credit per scan</div>
            <div class="feature">💼 <strong>CRM Sync:</strong> 2 credits per sync</div>
            <div class="feature">💬 <strong>Bulk Messaging:</strong> 3 credits per message</div>
            <div class="feature">🤝 <strong>Connection Requests:</strong> 5 credits per request</div>
            <p>You start with 50 daily credits on the Free plan. Credits refresh every 24 hours!</p>
            <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Get Started</a>
          </div>
        </body>
        </html>
      `
    };

    await this.transporter.sendMail(mailOptions);
  }
}

export default new EmailService();
