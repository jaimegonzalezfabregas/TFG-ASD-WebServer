const { authenticator, totp } = require('otplib');
const crypto_ = require('crypto');
const db = require('./models')
const moment = require('moment');

function func(secret) {
    totp.options = { algorithm: 'sha1', digits: 6, step: 60, window: 1 };
    console.log(`Secret: ${secret} Totp: ${authenticator.generate(secret)}`);
}

async function totp_test() {
    // authenticator.options = { crypto: crypto_ };

    // const secret = authenticator.generateSecret(); //base32
    // const token = authenticator.generate(secret);
    // const isValid = authenticator.check(token, secret);
    // const isValid2 = authenticator.verify({ token, secret });

    // console.log("Secret: %s\nCurrent token: %s\nCheck: %s\nVerify: %s\n", secret, token, isValid, isValid2);

    // setInterval(() => func(secret), 3000);

    let query_disp = await db.sequelize.models.Dispositivo.findAll({
        attributes: ['id', 'secret']
    });

    authenticator.options = { algorithm: 'sha1', digits: 6, step: 60, window: 1 };

    query_disp.forEach((item) => {
        console.log(item.dataValues.secret, authenticator.generate(item.dataValues.secret));
        setInterval(() => func(item.dataValues.secret), 5000);
    });
}

totp_test()