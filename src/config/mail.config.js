require('dotenv').config();
const nodemailer = require('nodemailer')
const trust_smtp = (process.env.TRUST_SMTP && process.env.TRUST_SMTP === "true")

const mailer = nodemailer.createTransport({
    // host: process.env.MAIL_HOST || "smtp.gmail.com",
    // port: process.env.MAIL_PORT || (trust_smtp) ? 465 : 587,
    // secure: trust_smtp, 
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD,
    },
});

module.exports = mailer;