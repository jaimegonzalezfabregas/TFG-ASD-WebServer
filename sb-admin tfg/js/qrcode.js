const QRCode = require('qrcode');
const path = require('path');

QRCode.toFile(path.join(__dirname, '/qr.png'), 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&ab_channel=RickAstley', {
  errorCorrectionLevel: 'M'
}, function(err) {
  if (err) throw err;
  console.log('QR code saved!');
});