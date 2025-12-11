const { app, BrowserWindow, Menu, dialog, shell } = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        icon: path.join(__dirname, 'dist/assets/vite.svg'), // Attempt to load icon if built
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    const indexHtml = path.join(__dirname, 'dist', 'index.html');
    win.loadFile(indexHtml);
}

const template = [
    {
        label: 'File',
        submenu: [
            { role: 'quit' }
        ]
    },
    {
        label: 'View',
        submenu: [
            { role: 'reload' },
            { role: 'forceReload' },
            { role: 'toggleDevTools' },
            { type: 'separator' },
            { role: 'resetZoom' },
            { role: 'zoomIn' },
            { role: 'zoomOut' },
            { type: 'separator' },
            { role: 'togglefullscreen' }
        ]
    },
    {
        label: 'Help',
        submenu: [
            {
                label: 'Learn More',
                click: async () => {
                    await shell.openExternal('https://bpmn.io');
                }
            },
            {
                label: 'About',
                click: () => {
                    dialog.showMessageBox({
                        type: 'info',
                        title: 'About Editor',
                        message: 'BPMN Editor\nEleving Group\nVersion 1.0.0',
                        detail: 'A simple desktop tool for editing BPMN diagrams.\n\nPowered by Electron & bpmn-js.',
                        buttons: ['OK']
                    });
                }
            }
        ]
    }
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
