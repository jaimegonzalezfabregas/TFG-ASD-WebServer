require('dotenv').config();

const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const now = new Date()
const log_file = process.env.LOG_FILE || `${now.getFullYear()}${now.getMonth()}${now.getDate()}_log.txt`;
const log_path = process.env.LOG_PATH || 'logs'

const log_format = '[:date[iso]] addr :remote-addr user :remote-user | :method at :url | HTTP/:http-version :status :res[content-length] | :response-time ms';

const console_morgan = morgan(log_format);

// create a write stream (in append mode)
var accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' })

const write_stream = fs.createWriteStream(path.join(log_path, log_file), { flags: 'a' });
write_stream.write('Testing');
const file_morgan = morgan(log_format, { stream: accessLogStream });

module.exports = {
    console_morgan, file_morgan
}