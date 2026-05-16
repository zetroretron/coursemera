const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');
const server = require('./services/server');
const scanner = require('./services/scanner');
const updater = require('./updater');

const ICON_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets', 'icon.ico')
    : path.join(__dirname, '..', '..', 'assets', 'icon.ico');

let mainWindow = null;
let coursesFolder = null;

// Ensure only one instance of the app runs
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

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error.stack || error.message);
    dialog.showErrorBox('Error', `An unexpected error occurred: ${error.message}`);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

function createMainWindow(port) {
    logger.info('Creating main window...');
    
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 700,
        backgroundColor: '#0d1117',
        icon: ICON_PATH,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            // Additional security: sandbox the renderer process
            sandbox: true
        },
        show: false
    });

    mainWindow.loadURL(`http://localhost:${port}`);

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
        
        if (coursesFolder) {
            server.setCoursesFolder(coursesFolder);
        }
        
        const port = await startServer();
        
        createMainWindow(port);
        
        updater.init();
        // Check for updates after app is ready (but not too soon to annoy user)
        setTimeout(() => {
            updater.checkForUpdates();
        }, 15000);
        
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
        server.setCoursesFolder(coursesFolder);
        saveConfig();
        return coursesFolder;
    }
    return null;
});

ipcMain.handle('get-folder', () => coursesFolder);

ipcMain.handle('set-folder', (event, folder) => {
    coursesFolder = folder;
    server.setCoursesFolder(folder);
    saveConfig();
    return true;
});

ipcMain.handle('scan-courses', async () => {
    if (!coursesFolder) {
        return { error: 'No folder selected' };
    }
    
    try {
        const courses = await scanner.scanCourses(coursesFolder);
        const dataPath = path.join(app.getPath('userData'), 'courses.json');
        const data = { courses, lastScanned: new Date().toISOString() };
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
        logger.info(`Saved ${courses.length} courses to ${dataPath}`);
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

ipcMain.handle('install-update', () => {
    updater.quitAndInstall();
});

app.whenReady().then(initializeApp);

app.on('window-all-closed', () => {
    logger.info('All windows closed');
    server.stop();
    app.quit();
});

app.on('before-quit', () => {
    logger.info('App quitting...');
    server.stop();
    logger.info('Server stopped');
});