const server_config = require('../../config/server.config');
const authenticator = require('../../config/authenticator.config');
const qr_config = require('../../config/qr.config');
const logger = require('../../config/logger.config').child({"process": "api"});

const qrcode = require('qrcode');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const qrwidth = qr_config.qrwidth;
const qrheight = qr_config.qrheight;

async function generateQR(req, res, next, db) {
  try {
    let idEspacio = Number(req.params.idEspacio);
    if (!Number.isInteger(idEspacio)) {
        let err = {};
        err.status = 400;
        err.message = 'Id suministrado no válido';
        return next(err);
    }
    
    const canvas = createCanvas(qr_config.cvwidth, qr_config.cvheight);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  
    let esp_info = await db.sequelize.models.Espacio.findOne({
      attributes: ['tipo', 'numero', 'edificio'],
      where: {
        id: idEspacio
      }
    });

    let disp_secret = await db.sequelize.models.Dispositivo.findOne({ 
      attributes: ['secret'],                             
      where: {
        espacioId: idEspacio
      }
    });

    let nombre = esp_info.tipo + " " + esp_info.numero;
    ctx.font = "bold 48px Sans";
    ctx.textAlign = 'center';
    ctx.fillStyle = "black";

    ctx.fillText(nombre, canvas.width/2, canvas.height/2 - qrheight/2 - 10);
    ctx.fillText(esp_info.edificio, canvas.width/2, canvas.height/2 + qrheight/2 + 10 + 48);

    let totp = authenticator.generate(disp_secret.secret);
    let filename = qr_config.path + `/qr${idEspacio}.png`;
        
    logger.info(`Generating QR for ${esp_info.nombre}...`);
    const port_spec = (server_config.port_spec) ? ':' + server_config.port : ''
    qrcode.toFile(filename,
      `${server_config.protocol}://${server_config.host}${port_spec}/formulario-end/?espacio=${idEspacio}&totp=${totp}`, {
        errorCorrectionLevel: qr_config.errorCorrectionLevel,  // M sirve para una pantalla de ordenador, para pantallas más pequeñas usar H
        width: qrwidth,
        height: qrheight
      }, function(error) {
        if (error) {
          logger.error(`Error generating QR code:${error}`);
          let err = {};
          err.status = 400;
          err.message = error;
          return next(err);
        }
        logger.info('QR code generated!');
          
        // Load the image after it has been generated
        if (fs.existsSync(filename)) { 
          loadImage(filename).then((image) => {
            ctx.drawImage(image, canvas.width/2 - qrwidth/2, canvas.height/2 - qrheight/2);
  
            let out = fs.createWriteStream(filename);
            let stream = canvas.createPNGStream();
          stream.pipe(out);
            out.on('finish', () => {
              logger.info('QR image created');
              res.setHeader('Content-Type', 'image/png');
              res.status(200).sendFile(filename);
            });
          }).catch((error) => {
            logger.error('Error cargando la imagen:', error);
            let err = {};
            err.status = 400;
            err.message = `Error cargando la imagen: ${error}`;
            return next(err);
          });
        } else {
          logger.error('El archivo no existe:', filename);
          let err = {};
          err.status = 400;
          err.message = `El archivo no existe: ${error}`;
          return next(err);
        }
      }
    );
  }
  catch (error) {
    logger.error(`Error generating QR code: ${error}`);
    let err = {};
    err.status = 400;
    err.message = error;
    return next(err);
  }
}

module.exports = {
  generateQR
}