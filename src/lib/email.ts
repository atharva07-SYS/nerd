import nodemailer from "nodemailer";

// Configure SMTP transport if credentials provided in .env
const hasSmtpConfig = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

const transporter = hasSmtpConfig
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

const fromEmail = process.env.SMTP_FROM || "The Draw Archive <noreply@thedraw.archive>";

/**
 * Send Welcome / Signup Authentication Email
 */
export async function sendWelcomeEmail(toEmail: string, name: string) {
  const subject = "⚡ Welcome to The Draw — Archival Pass Authenticated";
  const htmlContent = `
    <div style="background-color: #0c0d0e; color: #e6e8eb; font-family: 'Georgia', serif; padding: 30px; border: 1px solid #282c34; border-radius: 8px;">
      <h1 style="color: #ffffff; border-bottom: 1px solid #232730; padding-bottom: 10px;">THE DRAW — RESEARCH ARCHIVE</h1>
      <p style="font-size: 16px; color: #d1d5db;">Greetings, <strong>${name}</strong>!</p>
      <p style="font-size: 14px; color: #9ca3af; line-height: 1.6;">
        Your scholar access pass (<code>${toEmail}</code>) has been successfully authenticated. You now have access to your personal independent draw deck of 43 master topics.
      </p>
      <div style="margin: 25px 0;">
        <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/draw" style="background-color: #dc2626; color: #ffffff; padding: 12px 24px; font-family: monospace; font-size: 12px; font-weight: bold; text-decoration: none; border-radius: 4px; display: inline-block;">
          ENTER YOUR DRAW DECK &rarr;
        </a>
      </div>
      <p style="font-size: 12px; color: #6b7280; font-family: monospace;">
        The Draw Archival Engine &bull; Shared Master Index &bull; Per-User Randomization
      </p>
    </div>
  `;

  console.log(`\n======================================================`);
  console.log(`📧 [EMAIL AUTHENTICATION SENT] Welcome Mail to: ${toEmail}`);
  console.log(`Subject: ${subject}`);
  console.log(`======================================================\n`);

  if (transporter) {
    try {
      await transporter.sendMail({
        from: fromEmail,
        to: toEmail,
        subject,
        html: htmlContent,
      });
    } catch (err) {
      console.error("Error sending welcome email via SMTP:", err);
    }
  }
}

/**
 * Send Password Reset Token Email
 */
export async function sendPasswordResetEmail(toEmail: string, resetUrl: string) {
  const subject = "🔑 The Draw — Reset Your Scholar Access Password";
  const htmlContent = `
    <div style="background-color: #0c0d0e; color: #e6e8eb; font-family: 'Georgia', serif; padding: 30px; border: 1px solid #282c34; border-radius: 8px;">
      <h1 style="color: #ffffff; border-bottom: 1px solid #232730; padding-bottom: 10px;">PASSWORD RESET REQUEST</h1>
      <p style="font-size: 14px; color: #d1d5db; line-height: 1.6;">
        We received a password reset request for your scholar account (<code>${toEmail}</code>). Click the button below to set a new password. This single-use link expires in 1 hour.
      </p>
      <div style="margin: 25px 0;">
        <a href="${resetUrl}" style="background-color: #d97706; color: #0c0d0e; padding: 14px 28px; font-family: monospace; font-size: 13px; font-weight: bold; text-decoration: none; border-radius: 4px; display: inline-block;">
          RESET YOUR PASSWORD NOW &rarr;
        </a>
      </div>
      <p style="font-size: 12px; color: #9ca3af; font-family: monospace;">
        Link URL: <a href="${resetUrl}" style="color: #fbbf24;">${resetUrl}</a>
      </p>
      <p style="font-size: 12px; color: #6b7280; font-family: monospace; border-top: 1px solid #232730; pt: 15px;">
        If you did not request a password reset, you can safely ignore this message.
      </p>
    </div>
  `;

  console.log(`\n======================================================`);
  console.log(`🔑 [PASSWORD RESET EMAIL SENT] To: ${toEmail}`);
  console.log(`Reset URL: ${resetUrl}`);
  console.log(`======================================================\n`);

  if (transporter) {
    try {
      await transporter.sendMail({
        from: fromEmail,
        to: toEmail,
        subject,
        html: htmlContent,
      });
    } catch (err) {
      console.error("Error sending password reset email via SMTP:", err);
    }
  }
}
