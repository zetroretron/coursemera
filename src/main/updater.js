const { autoUpdater } = require('electron-updater');
const logger = require('./logger');

let updateAvailable = false;
let updateDownloaded = false;

function init() {
    autoUpdater.logger = logger;
    autoUpdater.autoDownload = false;
    
    autoUpdater.on('checking-for-update', () => {
        logger.info('Checking for update...');
    });
    
    autoUpdater.on('update-available', (info) => {
        logger.info('Update available:', info.version);
        updateAvailable = true;
    });
    
    autoUpdater.on('update-not-available', (info) => {
        logger.info('Update not available');
    });
    
    autoUpdater.on('error', (err) => {
        logger.error('Update error:', err);
    });
    
    autoUpdater.on('download-progress', (progressObj) => {
        let log = 'Download speed: ' + progressObj.bytesPerSecond;
        log = log + ' - Downloaded ' + progressObj.percent + '%';
        log = log + ' (' + progressObj.transferred + '/' + progressObj.total + ')';
        logger.info(log);
    });
    
    autoUpdater.on('update-downloaded', (info) => {
        logger.info('Update downloaded:', info.version);
        updateDownloaded = true;
    });
}

async function checkForUpdates() {
    try {
        if (!updateAvailable) {
            await autoUpdater.checkForUpdates();
        }
        return { available: updateAvailable, downloaded: updateDownloaded };
    } catch (error) {
        logger.error('Check for updates failed:', error);
        return { error: error.message };
    }
}

function quitAndInstall() {
    autoUpdater.quitAndInstall();
}

module.exports = { init, checkForUpdates, quitAndInstall };