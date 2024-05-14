require('dotenv').config();
const pino = require('pino');
const now = new Date();
const log_file = process.env.LOG_FILE || `${now.getFullYear()}${now.getMonth()+1}${now.getDate()}_log.txt`;
const log_path = process.env.LOG_PATH || 'logs'

let transport = {
    targets: [
        {
            target: 'pino/file',
            level: (process.env.LOG_LEVEL || 'info'),
            options: {
                destination: `${log_path}/${log_file}`,  // El camino por defecto es relativo a donde se ejecute el código. Debe ejecutarse desde src para que funcione correctamente
                mkdir: true
            }
        }   
    ]
};

if (process.env.LOG_TO_STDOUT === "true") { 
    transport.targets.push({
        target: 'pino-pretty',
        level: (process.env.LOG_LEVEL || 'info'),
        options: {
            destination: 1, // 1 = stdout
        }
    });
}

const logger = pino.pino({
    level: (process.env.LOG_LEVEL || 'info'),
    serializers: {
        err: pino.stdSerializers.err,
        req: pino.stdSerializers.req,
        res: pino.stdSerializers.res
    },
    base: undefined, // Ignora pid y hostname al hacer un log
    transport
});

module.exports = logger