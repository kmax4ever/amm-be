const winston = require('winston');
require('winston-daily-rotate-file');

var transportError = new (winston.transports.DailyRotateFile)({
    filename: 'error-%DATE%.log',
    datePattern: 'YYYY-MM-DD-HH',
    dirname: 'logs/',
    level: 'error',
    zippedArchive: true,
    maxSize: '10m',
    maxFiles: '10d'
});

var transportInfo = new (winston.transports.DailyRotateFile)({
    filename: 'info-%DATE%.log',
    datePattern: 'YYYY-MM-DD-HH',
    dirname: 'logs/',
    level: 'info',
    zippedArchive: true,
    maxSize: '10m',
    maxFiles: '10d'
});

export const logger = winston.createLogger({
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    transports: [
        transportError, 
        transportInfo
    ]
});

logger.add(new winston.transports.Console({
    format: winston.format.combine(winston.format.timestamp(), winston.format.json())
}));
