const { createLogger, format, transports } = require('winston')

const logger = createLogger({
	level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
	format: format.combine(
		format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
		format.errors({ stack: true }),
		format.json()
	),
	transports: [
		// - Write to all logs with level `info` and below to `quick-start-combined.log`.
		// - Write all logs error (and below) to `quick-start-error.log`.
		new transports.File({ filename: './logs/errors.log', level: 'error' }),
		new transports.File({ filename: './logs/logs.log' }),
	],
})


// If we're not in production then *ALSO* log to the `console`
// with the colorized simple format.
if (process.env.NODE_ENV !== 'production') {
	logger.add(new transports.Console({
		format: format.combine(
			format.colorize(),
			format.timestamp({ format: 'HH:mm:ss' }),
			format.errors({ stack: true }),
			format.printf(info => `[${info.timestamp}] ${info.level}: ${info.message}`)
		),
	}))
}

module.exports = logger
