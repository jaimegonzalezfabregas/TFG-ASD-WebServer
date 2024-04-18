const { toCanvas } = require('qrcode');
  
let espacio = document.URL.split("/formulario-end-qr/?espacio=");
  
if (espacio.length > 1) {
  console.log('Generating QR...');
  toCanvas(document.getElementById('qrcode'),`${espacio[0]}/formulario-end/?espacio=${espacio[1]}`, {
    errorCorrectionLevel: 'M',  // M sirve para una pantalla de ordenador, para pantallas más pequeñas usar H
    width: 280,
    height: 280
  }, function(err) {
    if (err) throw err;
    console.log('QR code generated!');
  });
}
else {
  console.log('Insufficient data to generate QR');
}