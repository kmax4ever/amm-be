import { Injectable, Scope, Logger } from '@nestjs/common';
import * as winston from 'winston';
import * as chalk from 'chalk';

const myFormat = winston.format.printf(function(info) {
  const sym: any = Symbol.for('splat');
  const stack = info[sym] || '';
  if (stack) {
    return `${new Date().toISOString()} ${info.level}: ${
      info.message
    } \n ${stack}`;
  } else {
    return `${new Date().toISOString()} ${info.level}: ${info.message}`;
  }
});

// define the custom settings for each transport (file, console)
const options = {
  file: {
    format: myFormat,
    level: 'debug',
    filename: `combined.log`,
    handleExceptions: true,
    json: true,
    maxsize: 5000000, // 5MB
    maxFiles: 20,
    colorize: true,
  },
  console: {
    format: winston.format.combine(winston.format.colorize(), myFormat),
    level: 'debug',
    handleExceptions: true,
    json: false,
    colorize: true,
  },
};
const levels = {
  levels: {
    fatal: 0,
    error: 1,
    warning: 2,
    notice: 3,
    info: 4,
    debug: 5,
  },
};

@Injectable({ scope: Scope.TRANSIENT })
export class MyLogger extends Logger {
  logger: winston.Logger;
  constructor() {
    super();
    const winstonOptions = {
      format: winston.format.combine(winston.format.metadata()),
      transports: [
        new winston.transports.File({
          ...options.file,
          level: 'fatal',
          filename: `fatal.log`,
        }),
        new winston.transports.File(options.file),
        new winston.transports.Console(options.console),
      ],
      levels: levels.levels,
      exitOnError: false, // do not exit on handled exceptions
    };
    winston.addColors({
      error: 'red',
      warning: 'yellow',
      info: 'cyan',
      debug: 'green',
    });
    this.logger = winston.createLogger(winstonOptions);
  }

  log(message: string) {
    this.logger.info(message);
  }

  error(message: string, trace?: any) {
    if (trace) {
      this.logger.error(message, trace);
    } else {
      this.logger.error(message);
    }
  }

  fatal(err: any) {
    if (typeof err === 'string') {
      const errObj = new Error(err);
      this.logger.error(errObj.message, errObj.stack);
    } else {
      this.logger.error(err.message, err.stack);
    }
  }

  warn(message: string) {
    this.logger.warning(message);
  }

  debug(message: string) {
    this.logger.debug(message);
  }
}
