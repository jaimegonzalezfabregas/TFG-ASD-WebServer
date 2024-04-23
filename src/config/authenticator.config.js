require('dotenv').config()
const { authenticator } = require('otplib');

authenticator.options = { 
    digits: (process.env.TOTP_DIGITS) ? Number(process.env.TOTP_DIGITS) : 6, 
    step: (process.env.TOTP_STEP) ? Number(process.env.TOTP_STEP) : 60, 
    window: (process.env.TOTP_WINDOW) ? JSON.parse(process.env.TOTP_WINDOW) : [10, 0],
    algorithm: process.env.TOTP_ALGORITHM || 'sha1',
    encoding: process.env.TOTP_ENCODING || 'ascii'
};

module.exports = authenticator
