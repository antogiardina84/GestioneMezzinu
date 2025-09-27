const winston = require('winston');

const manutenzioniLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'manutenzioni' },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/manutenzioni-error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/manutenzioni.log' 
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  manutenzioniLogger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = manutenzioniLogger;