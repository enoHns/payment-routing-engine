import pino from 'pino';

function maskPhone(phone: string): string {
  if (!phone || phone.length < 4) return '****';
  // Show only last 4 digits for privacy
  const last4 = phone.slice(-4);
  return `+***${last4}`;
}

// pino 8 removed the prettyPrint option — use transport instead for dev formatting
// TODO: consider switching staging to JSON too for easier log aggregation
const pinoOptions: pino.LoggerOptions = {
  level: process.env.LOG_LEVEL || 'info',
  base: {
    service: 'routing-engine',
    pid: process.pid,
  },
  serializers: {
    phone: maskPhone,
    err: pino.stdSerializers.err,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
};

if (process.env.NODE_ENV !== 'production') {
  pinoOptions.transport = {
    target: 'pino-pretty',
    options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' },
  };
}

const logger = pino(pinoOptions);

export default logger;
export { logger };
