const express = require('express');
const path = require('path');
const ejs = require('ejs');
const moment = require('moment');
const data = require('./datos');
const app = express();
const port = 5500;

let sesion = { usuario: '' }

app.set('view engine', 'ejs');
app.use(express.static(__dirname));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(path.join( __dirname, "/login.html"));
});

app.get('/formulario-end.html/', (req, res) => {
  console.log(req.query);
  let esp = '';
  if(Object.keys(req.query).length != 0) {
    esp = req.query.espacio;
  }
  let currentHour = moment().format('HH:MM');

  res.render('formulario-end', {usuario: sesion.usuario, espacio: esp, hora: `${currentHour}`});
});

app.post('/login.html', (req, res) => {
  console.log(`Got a POST in login with ${JSON.stringify(req.body)}`);
  for (index in data.usuarios) {
    if (data.usuarios[index].email == req.body.usuario) {
      sesion.usuario = data.usuarios[index].nombre;
      res.redirect("/index.html");
    }
  }
  if (sesion.usuario == '') {
    res.redirect("/login.html");
  }
});

app.post('/formulario-aulas-qr.html', (req, res) => {
  console.log(`Got a POST in formulario-aulas-qr with ${JSON.stringify(req.body)}`);
  res.redirect(`/formulario-end-qr.html`);
});

app.post('/formulario-aulas.html', (req, res) => {
  console.log(`Got a POST in formulario-aulas with ${JSON.stringify(req.body)}`);
  res.redirect(`/formulario-end.html/?espacio=${req.body.espacio}`);
});

app.post('/formulario-end.html', (req, res) => {
  console.log(`Got a POST in formulario-end with ${JSON.stringify(req.body)}`);
  res.redirect(`/index.html`);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});
