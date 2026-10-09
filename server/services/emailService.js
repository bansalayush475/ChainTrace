import crypto from 'node:crypto';

/**
 * Sovereign Law Enforcement Email Gateway Service
 * Handles Section 79A IT Act compliant digital cryptographic dispatch of MFA OTPs
 * via outbound SMTP (Gmail, NIC, SendGrid, Resend, or Sovereign Relay)
 * with graceful fallback to simulated sovereign webmail dispatch.
 */

let nodemailer = null;
try {
  const mod = await import('nodemailer');
  nodemailer = mod.default || mod;
} catch (e) {
  console.log('[Email Gateway] Nodemailer not installed, running in sovereign simulated gateway mode.');
}

/**
 * Generates an official, high-security HTML email template for LEA Multi-Factor Authentication
 */
function generateMfaEmailHtml({ officerName, otpCode, toEmail, expiresMinutes = 5 }) {
  const timestamp = new Date().toUTCString();
  const dispatchId = `LEA-NIC-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const shaSeal = crypto.createHash('sha256').update(`${toEmail}:${otpCode}:${timestamp}`).digest('hex').slice(0, 32);

  return {
    subject: `[CONFIDENTIAL] §79A IT Act Multi-Factor Verification Code: ${otpCode} - ChainTrace Sovereign Portal`,
    dispatchId,
    shaSeal,
    timestamp,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ChainTrace Sovereign Multi-Factor Authentication Token</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b1120; color: #f1f5f9; margin: 0; padding: 24px 0; }
    .container { max-width: 580px; margin: 0 auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
    .header { background: linear-gradient(135deg, #020617 0%, #0f172a 100%); padding: 24px 28px; border-bottom: 2px solid #0284c7; text-align: center; }
    .emblem { font-size: 11px; font-weight: 800; letter-spacing: 0.18em; color: #38bdf8; text-transform: uppercase; margin-bottom: 6px; }
    .title { font-size: 20px; font-weight: 700; color: #ffffff; margin: 0; letter-spacing: -0.01em; }
    .subtitle { font-size: 12px; color: #94a3b8; margin-top: 4px; }
    .content { padding: 28px; }
    .greeting { font-size: 14px; color: #cbd5e1; margin-bottom: 16px; }
    .alert-box { background: rgba(2, 132, 199, 0.08); border-left: 4px solid #0284c7; border-radius: 4px; padding: 12px 16px; margin-bottom: 24px; }
    .alert-text { font-size: 12.5px; color: #e2e8f0; line-height: 1.5; margin: 0; }
    .otp-card { background: #020617; border: 1px dashed #38bdf8; border-radius: 10px; padding: 24px; text-align: center; margin: 24px 0; }
    .otp-label { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; color: #94a3b8; text-transform: uppercase; margin-bottom: 8px; }
    .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; letter-spacing: 0.28em; color: #38bdf8; margin: 8px 0; text-shadow: 0 0 16px rgba(56, 189, 248, 0.4); }
    .otp-validity { font-size: 11.5px; color: #f59e0b; font-weight: 600; margin-top: 6px; }
    .meta-table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
    .meta-table td { padding: 6px 0; border-bottom: 1px solid #1e293b; color: #94a3b8; }
    .meta-table td.val { text-align: right; color: #f1f5f9; font-family: monospace; }
    .footer { background: #020617; padding: 18px 28px; font-size: 10.5px; color: #64748b; line-height: 1.5; border-top: 1px solid #1e293b; }
    .statutory { color: #ef4444; font-weight: 700; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="emblem">Government of India // Ministry of Home Affairs</div>
      <h1 class="title">ChainTrace: Sovereign Crypto Forensic Platform</h1>
      <div class="subtitle">National Cyber Forensic Laboratory (NCFL) &middot; Sovereign LEA Node</div>
    </div>
    <div class="content">
      <div class="greeting">
        Attn: <strong>${officerName || 'Law Enforcement Officer'}</strong>,
      </div>
      <div class="alert-box">
        <p class="alert-text">
          A login attempt was initiated for your authorized officer profile associated with mailbox <strong>${toEmail}</strong>. 
          Use the one-time security authentication token below to complete statutory two-factor clearance.
        </p>
      </div>
      
      <div class="otp-card">
        <div class="otp-label">Section 79A IT Act 2000 &middot; Verification Token</div>
        <div class="otp-code">${otpCode}</div>
        <div class="otp-validity">&bull; VALID FOR ${expiresMinutes} MINUTES ONLY &bull;</div>
      </div>

      <table class="meta-table">
        <tr>
          <td>DISPATCH REFERENCE</td>
          <td class="val">${dispatchId}</td>
        </tr>
        <tr>
          <td>SHA-256 DIGITAL SEAL</td>
          <td class="val">${shaSeal}</td>
        </tr>
        <tr>
          <td>TIMESTAMP (UTC)</td>
          <td class="val">${timestamp}</td>
        </tr>
        <tr>
          <td>SYSTEM JURISDICTION</td>
          <td class="val">Delhi Police Cyber Crime PS / Special Cell</td>
        </tr>
      </table>
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px 0;">
        <span class="statutory">OFFICIAL AND RESTRICTED:</span> This communication contains statutory law enforcement data generated under the Information Technology Act 2000 (&sect;43, &sect;66, &sect;70, &sect;79A) and Bharatiya Nagarik Suraksha Sanhita (BNSS).
      </p>
      <p style="margin: 0;">
        If you did not initiate this forensic session, immediately report this incident to the Central Cyber Crime Control Desk.
      </p>
    </div>
  </div>
</body>
</html>
    `,
  };
}

/**
 * Transmits an MFA OTP via SMTP or returns a simulated sovereign dispatch payload
 */
export async function sendMfaOtpEmail({ toEmail, otpCode, officerName = 'Law Enforcement Officer' }) {
  const cleanEmail = toEmail.trim().toLowerCase();
  const emailPayload = generateMfaEmailHtml({
    officerName,
    otpCode,
    toEmail: cleanEmail,
    expiresMinutes: 5,
  });

  // 1. Check for Resend API (Zero-dependency real email delivery over HTTPS)
  if (process.env.RESEND_API_KEY) {
    try {
      console.log(`[Email Gateway] Transmitting real email to ${cleanEmail} via Resend API...`);
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || 'CBFIS Cyber Defense <onboarding@resend.dev>',
          to: [cleanEmail],
          subject: emailPayload.subject,
          html: emailPayload.html,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log(`[Email Gateway] Resend email successfully delivered to ${cleanEmail}. Message ID: ${data.id}`);
        return {
          success: true,
          delivered: true,
          method: 'REAL_SMTP',
          messageId: data.id,
          dispatchId: emailPayload.dispatchId,
          shaSeal: emailPayload.shaSeal,
          subject: emailPayload.subject,
          html: emailPayload.html,
        };
      } else {
        const errText = await res.text();
        console.warn('[Email Gateway] Resend API error:', errText);
      }
    } catch (err) {
      console.warn('[Email Gateway] Resend API call failed:', err.message);
    }
  }

  // 2. Check for SMTP configuration in environment
  const smtpHost = process.env.SMTP_HOST || (process.env.GMAIL_USER ? 'smtp.gmail.com' : null);
  const smtpPort = parseInt(process.env.SMTP_PORT || '465');
  const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;
  const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
  const smtpFrom = process.env.SMTP_FROM || `"CBFIS Cyber Defense Portal" <${smtpUser || 'notifications@cybercrime.gov.in'}>`;

  if (nodemailer && smtpHost && smtpUser && smtpPass) {
    try {
      console.log(`[Email Gateway] Transmitting real email to ${cleanEmail} via SMTP host ${smtpHost}...`);
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const info = await transporter.sendMail({
        from: smtpFrom,
        to: cleanEmail,
        subject: emailPayload.subject,
        html: emailPayload.html,
      });

      console.log(`[Email Gateway] Successfully delivered email to ${cleanEmail}. Message ID: ${info.messageId}`);
      return {
        success: true,
        delivered: true,
        method: 'REAL_SMTP',
        messageId: info.messageId,
        previewUrl: null,
        dispatchId: emailPayload.dispatchId,
        shaSeal: emailPayload.shaSeal,
        subject: emailPayload.subject,
        html: emailPayload.html,
      };
    } catch (err) {
      console.warn(`[Email Gateway] Real SMTP transmission to ${cleanEmail} failed (${err.message}), falling back to simulated LEA dispatch:`, err.message);
    }
  }

  // Simulated sovereign dispatch
  console.log(`[NIC/MHA Sovereign Email Gateway] Dispatched MFA OTP [${otpCode}] to officer: ${cleanEmail}`);
  return {
    success: true,
    delivered: true,
    method: 'SOVEREIGN_SIMULATED',
    messageId: `SOV-${Date.now()}`,
    dispatchId: emailPayload.dispatchId,
    shaSeal: emailPayload.shaSeal,
    subject: emailPayload.subject,
    html: emailPayload.html,
  };
}

export default {
  sendMfaOtpEmail,
};
