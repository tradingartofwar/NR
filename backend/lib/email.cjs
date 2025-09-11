const nodemailer = require("nodemailer");
const { v4: uuid } = require("uuid");
const { files, read, write } = require("./store.cjs");

const smtpReady = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
const mailer = smtpReady
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: true,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

async function sendReviewEmail({ to, appOrigin, nodeId, cohortId, suggestionId }) {
  const tokens = read(files.tokens);
  const token = uuid();
  const exp = Date.now() + 30 * 60 * 1000;
  tokens.push({ token, nodeId, cohortId, suggestionId, used: false, exp });
  write(files.tokens, tokens);

  const url = `${appOrigin}/frontend/index.html#/review?token=${encodeURIComponent(token)}`;
  const html = `
    <p>There’s a new approved overlap waiting in your cockpit.</p>
    <p><a href="${url}">View in Cockpit</a></p>
    <p style="font-size:12px;color:#777">Manage notifications in the cockpit.</p>
  `;

  if (!mailer) {
    console.log("[DEV EMAIL] To:", to || "(dev)", "URL:", url);
    return;
  }
  await mailer.sendMail({
    from: process.env.EMAIL_FROM || "no-reply@localhost",
    to,
    subject: "You have a new approved overlap",
    html,
  });
}

module.exports = { sendReviewEmail };
