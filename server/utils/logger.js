const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const CURRENT_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL] ?? LOG_LEVELS.info;

function formatMessage(level, message, meta = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };
  return JSON.stringify(entry);
}

const log = {
  error(message, meta) {
    if (CURRENT_LEVEL >= LOG_LEVELS.error) console.error(formatMessage('error', message, meta));
  },
  warn(message, meta) {
    if (CURRENT_LEVEL >= LOG_LEVELS.warn) console.warn(formatMessage('warn', message, meta));
  },
  info(message, meta) {
    if (CURRENT_LEVEL >= LOG_LEVELS.info) console.log(formatMessage('info', message, meta));
  },
  debug(message, meta) {
    if (CURRENT_LEVEL >= LOG_LEVELS.debug) console.log(formatMessage('debug', message, meta));
  },
};

module.exports = { log };
