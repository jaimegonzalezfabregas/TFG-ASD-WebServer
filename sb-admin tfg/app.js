const express = require('express');
const path = require('path');
const QR = require('qrcode');
const { Sequelize, DataTypes } = require ('sequelize');
const moment = require('moment');
const data = require('./datos');
const app = express();
const port = 5500;

let sesion = { usuario: '' }

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  console.log('Get / detected');
  if (sesion.usuario == '') {
    res.redirect("/login.html");
  }
  else {
    res.redirect("/index.html");
  }
});

// Utiliza __dirname como directorio para los ficheros.
// Importante que esté debajo de get '/', para que este rediriga a login.html (Si no, abre index.html)
app.use(express.static(__dirname));

app.post('/login.html', async (req, res) => {
  console.log(`Got a POST in login with ${JSON.stringify(req.body)}`);

  const sequelize = new Sequelize({ dialect: 'sqlite', storage: './database.db'});

  try {
      await sequelize.authenticate();
      console.log('Connection successful.');
  }
  catch (error) {
      console.error('Unable to connect:', error);
  }

  defineDocente(sequelize);
  const Docente = sequelize.models.Docente;

  await Docente.sync();
  
  const check = await Docente.findAll();

  console.log(check);
  for (i in check) {
    console.log(check[i].dataValues);
  }

  const query = await Docente.findOne({
    attributes: ['email', 'password'],
    where: {
      email: req.body.usuario
    }
  })

  console.log(query);
  if (query != null && query.dataValues.password == req.body.password) {
    sesion.usuario = query.dataValues.email;
    res.redirect("/index.html");
  }
  else {
    res.render('login', {usuario: req.body.usuario});
  }

  await sequelize.close();

});

app.post('/formulario-aulas.html', (req, res) => {
  console.log(`Got a POST in formulario-aulas with ${JSON.stringify(req.body)}`);
  res.redirect(`/formulario-end.html/?espacio=${req.body.espacio}`);
});

app.get('/formulario-end.html', (req, res) => {
  console.log(req.query);
  let esp = '';
  if(Object.keys(req.query).length != 0) {
    esp = req.query.espacio;
  }
  let currentHour = moment().format('HH:MM');

  res.render('formulario-end', {usuario: sesion.usuario, espacio: esp, hora: `${currentHour}`});
});

app.post('/formulario-aulas-qr.html', (req, res) => {
  console.log(`Got a POST in formulario-aulas-qr with ${JSON.stringify(req.body)}`);
  res.redirect(`/formulario-end-qr.html/?espacio=${req.body.espacio}`);
});

app.get('/formulario-end-qr.html', (req, res) => {
  console.log(req.query);
  let qrsrc = path.join(__dirname, '/qr.png');
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

async function defineDocente(sequelize) {

  const Docente = sequelize.define('Docente', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    apellidos: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    freezeTableName: true
  });

  await Docente.sync();
}
