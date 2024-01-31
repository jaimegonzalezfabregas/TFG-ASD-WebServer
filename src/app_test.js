const express = require('express');
const path = require('path');
const QR = require('qrcode');
const moment = require('moment');
const app = express();
const port = 6600;


app.use(express.static(__dirname));
app.set('view engine', 'ejs');

const sesion = { usuario: 'Luis Estévez Malasada'}

app.get('/formulario-end.html', (req, res) => {
    console.log("formulario-end: ", req.query);
    let esp = '';
    if(Object.keys(req.query).length != 0) {
      esp = req.query.espacio;
    }
    let currentHour = moment().format('HH:MM');
  
    res.render('formulario-end', {usuario: sesion.usuario, espacio: esp, hora: currentHour});
});

app.get('/formulario-end-qr.html', (req, res) => {
    console.log("formulario-end-qr: ", req.query);  
    let filename = '/qr.png';
    let qrsrc = path.join(__dirname, filename);
    QR.toFile(qrsrc, `http://localhost:5500/formulario-end-qr.html/?espacio=${req.query.espacio}`, {
      errorCorrectionLevel: 'M'
    }, function(err) {
      if (err) throw err;
      console.log('QR code saved!');
    });

    res.render('formulario-end-qr', { qr: filename });
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
});
