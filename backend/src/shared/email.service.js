"use strict";

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const db = require('../config/database').default || require('../config/database');

const sendMail = async ({ to, subject, html, text, tenantId }) => {
  let transporter;
  let useFallback = true;
  let from = 'no-reply@hoteloraa.com';

  // 1. Try to load tenant settings if tenantId is provided
  if (tenantId) {
    try {
      const settings = await db.tenantSettings.findUnique({ where: { tenantId } });
      if (settings && settings.smtpHost && settings.smtpPort && settings.smtpUser && settings.smtpPass) {
        transporter = nodemailer.createTransport({
          host: settings.smtpHost,
          port: settings.smtpPort,
          secure: settings.smtpPort === 465,
          auth: {
            user: settings.smtpUser,
            pass: settings.smtpPass,
          },
        });
        useFallback = false;
        from = settings.smtpUser;
      }
    } catch (err) {
      console.error(`Failed to load tenant SMTP settings for tenant ${tenantId}:`, err);
    }
  }

  // 2. Try global SMTP settings from environment
  if (useFallback) {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (host && user && pass) {
      transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      from = process.env.SMTP_FROM || 'no-reply@hoteloraa.com';
      useFallback = false;
    }
  }

  // 3. Fallback / Mock: Save the email payload to a file for review
  const logDir = path.join(__dirname, '../../sent_emails');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const safeTo = to.replace(/[^a-zA-Z0-9@.-]/g, '_');
  const logFile = path.join(logDir, `${timestamp}_to_${safeTo}.json`);

  const emailData = {
    timestamp: new Date().toISOString(),
    to,
    from,
    subject,
    text: text || (html ? html.replace(/<[^>]*>/g, '') : ''),
    html,
  };

  console.log(`✉️ [EMAIL SENT] To: ${to} | Subject: "${subject}"`);
  fs.writeFileSync(logFile, JSON.stringify(emailData, null, 2), 'utf8');

  // If a transporter is configured, send the actual email
  if (transporter) {
    try {
      await transporter.sendMail({
        from,
        to,
        subject,
        text: text || (html ? html.replace(/<[^>]*>/g, '') : ''),
        html,
      });
    } catch (err) {
      console.error('Failed to dispatch SMTP email:', err);
    }
  }

  return { success: true, logFile };
};

exports.sendMail = sendMail;
