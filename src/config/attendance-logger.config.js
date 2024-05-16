require('dotenv').config();
const pino = require('pino');
const now = new Date();
const log_file = process.env.ATTENDANCE_LOG_FILE || `${now.getFullYear()}${now.getMonth()+1}${now.getDate()}_attendance_log.txt`;
const log_path = process.env.ATTENDANCE_LOG_FILE || 'logs'

let transport = {
    targets: [
        {
            target: 'pino-pretty',
            level: 'info',
            options: {
                destination: `${log_path}/${log_file}`,  // El camino por defecto es relativo a donde se ejecute el código. Debe ejecutarse desde src para que funcione correctamente
                mkdir: true,
                colorize: false
            }
        }   
    ]
};

const logger = pino.pino({
    level: 'info',
    serializers: {
        err: pino.stdSerializers.err,
        req: pino.stdSerializers.req,
        res: pino.stdSerializers.res
    },
    base: undefined, // Ignora pid y hostname al hacer un log
    transport
});

module.exports = logger