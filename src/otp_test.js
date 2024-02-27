const { authenticator, totp } = require('otplib');
const db = require('./models')

function func(secret) {
    console.log(`Totp: ${totp.generate(secret)}`)
}

async function totp_test() {
    // const secret = authenticator.generateSecret();
    // const token = totp.generate(secret);
    // const isValid = totp.check(token, secret);
    // const isValid2 = totp.verify({ token, secret });

    // console.log("Secret: %s\nCurrent token: %d\nCheck: %s\nVerify: %s\n", secret, token, isValid, isValid2);

    let query_disp = await db.sequelize.models.Dispositivo.findAll({
        attributes: ['id', 'secret']
    });

    totp.options = { epoch: new Date().getTime() / 1000, algorithm: 'sha1', digits: 6, step: 60 };

    query_disp.forEach((item) => {
        console.log(item.dataValues.secret);
        setInterval(() => func(item.dataValues.secret), 5000);
    });
}

totp_test()