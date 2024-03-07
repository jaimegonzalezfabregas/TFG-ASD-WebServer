const { toCanvas } = require('qrcode');

espacio = document.URL.split("espacio=");

if (espacio.length > 1) {
  console.log('Generating QR...');
  toCanvas(document.getElementById('qrcode'),`https://localhost:5500/formulario-end-qr/?espacio=${espacio[1]}`, {
    errorCorrectionLevel: 'M'  // M sirve para una pantalla de ordenador, para pantallas más pequeñas usar H
  }, function(err) {
    if (err) throw err;
    console.log('QR code generated!');
  });
}
else {
  console.log('Insufficient data to generate QR');
}