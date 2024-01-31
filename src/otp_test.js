const { authenticator, totp } = require('otplib');


function totp_test() {
    const secret = authenticator.generateSecret();
    const token = totp.generate(secret);
    const isValid = totp.check(token, secret);
    const isValid2 = totp.verify({ token, secret });

    console.log("Secret: %s\nCurrent token: %d\nCheck: %s\nVerify: %s\n", secret, token, isValid, isValid2)
}

totp_test()