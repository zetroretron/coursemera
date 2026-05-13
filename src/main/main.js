const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');
const server = require('./server');
const scanner = require('./scanner');
const updater = require('./updater');

let mainWindow = null;
let coursesFolder = null;
let serverInstance = null;

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
}

app.on('second-instance', () => {
    if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
    }
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error.stack || error.message);
    dialog.showErrorBox('Error', `An unexpected error occurred: ${error.message}`);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

function createMainWindow() {
    logger.info('Creating main window...');
    
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 700,
        backgroundColor: '#0d1117',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        show: false
    });

    mainWindow.loadURL('http://localhost:3000');

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        logger.info('Main window displayed');
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function startServer() {
    return new Promise((resolve) => {
        server.start((port) => {
            logger.info(`Server running on http://localhost:${port}`);
            resolve(port);
        });
    });
}

async function initializeApp() {
    logger.info('CourseMera starting...');
    
    try {
        const configPath = path.join(app.getPath('userData'), 'config.json');
        let config = {};
        
        if (fs.existsSync(configPath)) {
            config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        }
        
        coursesFolder = config.coursesFolder || null;
        
        const port = await startServer();
        
        createMainWindow();
        
        if (!app.isPackaged) {
            logger.info('Skip checkForUpdates because application is not packed and dev update config is not forced');
        }
        
        logger.info('App ready, starting...');
    } catch (error) {
        logger.error('Failed to initialize app:', error);
        dialog.showErrorBox('Initialization Error', error.message);
    }
}

function saveConfig() {
    const configPath = path.join(app.getPath('userData'), 'config.json');
    const config = { coursesFolder };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
        title: 'Select Courses Folder'
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
        coursesFolder = result.filePaths[0];
        saveConfig();
        return coursesFolder;
    }
    return null;
});

ipcMain.handle('get-folder', () => coursesFolder);

ipcMain.handle('set-folder', (event, folder) => {
    coursesFolder = folder;
    saveConfig();
    return true;
});

ipcMain.handle('scan-courses', async () => {
    if (!coursesFolder) {
        return { error: 'No folder selected' };
    }
    
    try {
        const courses = await scanner.scanCourses(coursesFolder);
        return { success: true, courses };
    } catch (error) {
        logger.error('Scan error:', error);
        return { error: error.message };
    }
});

ipcMain.handle('check-updates', async () => {
    try {
        return await updater.checkForUpdates();
    } catch (error) {
        return { error: error.message };
    }
});

ipcMain.handle('get-version', () => app.getVersion());

app.whenReady().then(initializeApp);

app.on('window-all-closed', () => {
    logger.info('All windows closed');
    if (serverInstance) {
        server.stop();
    }
    app.quit();
});

app.on('before-quit', () => {
    logger.info('App quitting...');
    if (serverInstance) {
        server.stop();
        logger.info('Server stopped');
    }
});