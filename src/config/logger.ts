import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  prettyPrint: process.env.NODE_ENV !== 'production'
    ? { colorize: true, translateTime: 'SYS:standard' }
    : false,
  base: {
    service: 'routing-engine',
    pid: process.pid,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export default logger;
export { logger };
