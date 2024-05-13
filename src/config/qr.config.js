require('dotenv').config()
const path = require('path');
const fs = require('fs');
const qrpath = (process.env.QR_FOLDER_PATH) ? path.resolve(path.resolve(__dirname, '../../'), process.env.QR_FOLDER_PATH) : path.resolve(__dirname, '../../qrs/');

//Si no existe la carpeta, la creamos
if (!fs.existsSync(qrpath)) {
    fs.mkdirSync(qrpath);
}

module.exports = { 
    qrwidth: (process.env.QR_WIDTH) ? Number(process.env.QR_WIDTH) : 300, 
    qrheight: (process.env.QR_HEIGHT) ? Number(process.env.QR_HEIGHT) : 300, 
    cvwidth: (process.env.CANVAS_WIDTH) ? Number(process.env.CANVAS_WIDTH) : 500,
    cvheight: (process.env.CANVAS_HEIGHT) ? Number(process.env.CANVAS_HEIGHT) : 500,
    path: (process.env.QR_FOLDER_PATH) ? path.resolve(path.resolve(__dirname, '../../'), process.env.QR_FOLDER_PATH) : path.resolve(__dirname, '../../qrs/'),
    errorCorrectionLevel: process.env.QR_CORRECTION_LEVEL || 'M'
};
