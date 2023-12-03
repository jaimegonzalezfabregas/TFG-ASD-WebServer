const QRCode = require('qrcode');
const path = require('path');

QRCode.toFile(path.join(__dirname, '/qrs/qr_laboratorio11.png'), 'https://localhost:5500/formulario-end-qr.html/?espacio=Laboratorio%2011', {
  errorCorrectionLevel: 'M'
}, function(err) {
  if (err) throw err;
  console.log('QR code saved!');
});