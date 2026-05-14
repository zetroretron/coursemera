const express = require('express');
const path = require('path');
const fs = require('fs');

let server = null;
let currentPort = null;
let coursesFolder = null;
const BASE_DIR = path.join(__dirname, '..', 'renderer');

function start(callback) {
    const app = express();
    
    app.use(express.static(BASE_DIR));
    
    app.get('/data/courses.json', (req, res) => {
        const appDataPath = path.join(require('electron').app.getPath('userData'), 'courses.json');
        if (fs.existsSync(appDataPath)) {
            res.json(JSON.parse(fs.readFileSync(appDataPath, 'utf-8')));
        } else {
            const packagedPath = path.join(BASE_DIR, 'data', 'courses.json');
            if (fs.existsSync(packagedPath)) {
                res.json(JSON.parse(fs.readFileSync(packagedPath, 'utf-8')));
            } else {
                res.json({ courses: [] });
            }
        }
    });
    
    app.get('*', (req, res) => {
        let filePath = req.url.split('?')[0];
        filePath = decodeURIComponent(filePath);
        
        if (filePath === '/' || filePath === '') {
            return res.sendFile(path.join(BASE_DIR, 'index.html'));
        }
        
        const ext = path.extname(filePath).toLowerCase();
        let fullPath = path.join(BASE_DIR, filePath);
        
        if (!fs.existsSync(fullPath) && ext === '.mp4') {
            if (coursesFolder) {
                fullPath = path.join(coursesFolder, decodeURIComponent(filePath.replace(/^\/+/, '')));
            } else {
                const parentDir = path.join(__dirname, '..', '..', '..');
                fullPath = path.join(parentDir, decodeURIComponent(filePath.replace(/^\/+/, '')));
            }
        }
        
        if (fs.existsSync(fullPath)) {
            if (fs.statSync(fullPath).isDirectory()) {
                return res.status(400).send('Path is a directory');
            }
            res.sendFile(fullPath);
        } else {
            res.status(404).send(`File not found: ${filePath}`);
        }
    });
    
    const tryPort = (port) => {
        return new Promise((resolve, reject) => {
            const testServer = app.listen(port, '127.0.0.1')
                .once('error', (err) => {
                    if (err.code === 'EADDRINUSE') {
                        if (port < 3010) {
                            resolve(tryPort(port + 1));
                        } else {
                            reject(new Error('No available port found'));
                        }
                    } else {
                        reject(err);
                    }
                })
                .once('listening', () => {
                    server = testServer;
                    currentPort = port;
                    resolve(port);
                });
        });
    };
    
    tryPort(3000).then((port) => {
        console.log(`Server running on http://localhost:${port}`);
        if (callback) callback(port);
    }).catch((err) => {
        console.error('Failed to start server:', err);
    });
}

function stop() {
    if (server) {
        server.close();
        server = null;
        currentPort = null;
    }
}

function getPort() {
    return currentPort;
}

function setCoursesFolder(folder) {
    coursesFolder = folder;
}

module.exports = { start, stop, getPort, setCoursesFolder };