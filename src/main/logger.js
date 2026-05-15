const log = require('electron-log');

log.transports.file.level = 'info';
log.transports.console.level = 'info';
log.transports.file.maxSize = 5 * 1024 * 1024;
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}] [{level}] {text}';
log.transports.console.format = '[{h}:{i}:{s}] [{level}] {text}';

module.exports = log;