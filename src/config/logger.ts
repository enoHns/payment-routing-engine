import pino from 'pino';

function maskPhone(phone: string): string {
  if (!phone || phone.length < 4) return '****';
  // Show only last 4 digits for privacy
  const last4 = phone.slice(-4);
  return `+***${last4}`;
}

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  prettyPrint: process.env.NODE_ENV !== 'production'
    ? { colorize: true, translateTime: 'SYS:standard' }
    : false,
  base: {
    service: 'routing-engine',
    pid: process.pid,
  },
  serializers: {
    phone: maskPhone,
    err: pino.stdSerializers.err,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export default logger;
export { logger };
