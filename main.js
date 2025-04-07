const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');

autoUpdater.autoInstallOnAppQuit = false;

let mainWindow;
let optionsWindow;
let isSlideshowPlaying = false;

const defaultConfig = {
  includeSubfolders: true,
  slideShowTime: 15,
  playVideoTillEndOption: false,
  alwaysOnTop: true,
  showClock: true,
  opacity: 100,
  lastFolderPath: null,
  shuffle: true,
  checkUpdate: true,
  windowX: 100,
  windowY: 100,
  windowWidth: 400,
  windowHeight: 300
};

const menuTemplate = [
  {
    label: 'UniFandora',
    submenu: [
      {
        label: 'About',
        click: () => {
          createAboutWindow();
        }
      },
      { type: 'separator' },
      {
        label: 'Exit',
        role: 'quit'
      }
    ]
  }
];
Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));

/**
 * Creates the About window.
 */
function createAboutWindow() {
  const aboutWindow = new BrowserWindow({
    width: 350,
    height: 350,
    resizable: false,
    autoHideMenuBar: true,
    title: "UniFandora",
    icon: path.join(__dirname, 'assets/icons/app-icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  aboutWindow.loadFile('about.html');
  aboutWindow.once('ready-to-show', () => {
    aboutWindow.show();
  });
  aboutWindow.webContents.on('did-finish-load', () => {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
    const version = app.getVersion();
    const buildNumber = packageJson.buildNumber;
    aboutWindow.webContents.send('set-version', `${version} (Build ${buildNumber})`);
  });
}

/**
 * Returns the full path to the configuration file.
 */
function getConfigPath() {
  // macOS: ~/Library/Application Support/YourAppName
  // Windows: %AppData%/YourAppName
  // Linux: ~/.config/YourAppName
  const userData = app.getPath('userData');
  return path.join(userData, 'config.json');
}

/**
 * Loads configuration from the config file.
 */
function loadConfig() {
  const configFile = getConfigPath();
  let config = {};
  try {
    if (fs.existsSync(configFile)) {
      const data = fs.readFileSync(configFile, 'utf-8');
      config = JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading config file:', err);
  }
  for (const key in defaultConfig) {
    if (!(key in config)) {
      config[key] = defaultConfig[key];
    }
  }
  return config;
}

/**
 * Saves the provided configuration to the config file.
 */
function saveConfig(config) {
  const configFile = getConfigPath();
  try {
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving config file:', err);
  }
}

/**
 * Recursively scans a directory and collects files with allowed extensions.
 */
function walkDir(dir, allowedExts, files) {
  let items;
  try {
    items = fs.readdirSync(dir);
  } catch (err) {
    console.error(`Error reading directory ${dir}: ${err}`);
    return;
  }
  for (const item of items) {
    const fullPath = path.join(dir, item);
    let stats;
    try {
      stats = fs.statSync(fullPath);
    } catch (err) {
      console.error(`Error stating file ${fullPath}: ${err}`);
      continue;
    }
    if (stats.isDirectory()) {
      walkDir(fullPath, allowedExts, files);
    } else if (stats.isFile() && allowedExts.includes(path.extname(item).toLowerCase())) {
      files.push(fullPath);
    }
  }
}

/**
 * Sends a message to the renderer process.
 */
function writeMessageToWindow(text) {
  mainWindow.webContents.send("message", text);
}

/**
 * Creates the main application window.
 */
function createWindow() {
  const config = loadConfig();
  const opacity = config.opacity !== undefined ? config.opacity : 100;

  mainWindow = new BrowserWindow({
    width: config.windowWidth || 400,
    height: config.windowHeight || 300,
    x: config.windowX,
    y: config.windowY,
    frame: false,
    transparent: true,
    autoHideMenuBar: true,
    alwaysOnTop: config.alwaysOnTop || false,
    icon: path.join(__dirname, 'assets/icons/app-icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  mainWindow.loadFile('index.html');
  mainWindow.setOpacity(opacity / 100);
  if (config.checkUpdate) {
    autoUpdater.checkForUpdatesAndNotify();
  }

  // Save current configuration when closing the window.
  mainWindow.on('close', (e) => {
    e.preventDefault();
    mainWindow.webContents.executeJavaScript('window.getCurrentConfig && window.getCurrentConfig()')
      .then((rendererConfig) => {
        const [winX, winY] = mainWindow.getPosition();
        const [winWidth, winHeight] = mainWindow.getSize();
        let config = loadConfig();
        config.windowX = winX;
        config.windowY = winY;
        config.windowWidth = winWidth;
        config.windowHeight = winHeight;
        if (rendererConfig) {
          Object.assign(config, rendererConfig);
        }
        saveConfig(config);
      })
      .catch((err) => {
        console.error('Error saving config on close:', err);
      })
      .finally(() => {
        mainWindow.destroy();
      });
  });

  // Set up context menu for playback and options.
  mainWindow.webContents.on('context-menu', (event, params) => {
    const toggleLabel = isSlideshowPlaying ? 'Pause' : 'Play';
    const menu = Menu.buildFromTemplate([
      { label: toggleLabel, click: () => { mainWindow.webContents.send('context-menu-command', 'toggle-playback'); } },
      { label: 'Open Folder', click: () => { mainWindow.webContents.send('context-menu-command', 'open-folder'); } },
      { label: 'Options', click: () => { mainWindow.webContents.send('context-menu-command', 'options'); } },
      { type: 'separator' },
      { label: 'Exit', click: () => { app.quit(); } }
    ]);
    menu.popup({ window: mainWindow });
  });

  // Auto-start slideshow if a previous folder is set.
  if (config.lastFolderPath && fs.existsSync(config.lastFolderPath)) {
    mainWindow.webContents.on('did-finish-load', () => {
      mainWindow.webContents.send('auto-start-folder', config);
    });
  }
}

app.whenReady().then(createWindow);

// IPC handlers and listeners

ipcMain.handle('get-config', () => loadConfig());

/**
 * IPC handler for selecting a folder.
 * On macOS, forces the main window to gain focus before opening the dialog.
 */
ipcMain.handle('select-folder', async (event, options) => {
  if (process.platform === 'darwin' && mainWindow) {
    mainWindow.focus();
  }
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (result.canceled) {
    return { files: [] };
  }
  const folderPath = result.filePaths[0];
  const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.mp4', '.webm', '.ogg'];
  let files = [];
  if (options && options.includeSubfolders) {
    walkDir(folderPath, allowedExts, files);
  } else {
    try {
      files = fs.readdirSync(folderPath)
        .filter(file => allowedExts.includes(path.extname(file).toLowerCase()))
        .map(file => path.join(folderPath, file));
    } catch (err) {
      console.error('Error reading folder:', err);
    }
  }
  return { files, folderPath };
});

ipcMain.handle('load-folder-from-path', async (event, folderPath, options) => {
  if (!fs.existsSync(folderPath)) return [];
  const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.mp4', '.webm', '.ogg'];
  let files = [];
  if (options && options.includeSubfolders) {
    walkDir(folderPath, allowedExts, files);
  } else {
    try {
      files = fs.readdirSync(folderPath)
        .filter(file => allowedExts.includes(path.extname(file).toLowerCase()))
        .map(file => path.join(folderPath, file));
    } catch (err) {
      console.error('Error reading folder:', err);
    }
  }
  return files;
});

ipcMain.handle('resize-window', async (event, newWidth, newHeight) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  win.setSize(Math.round(newWidth), Math.round(newHeight));
});

ipcMain.handle('get-window-position', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  return win.getPosition();
});

ipcMain.on('move-window', (event, newX, newY) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  win.setPosition(Math.round(newX), Math.round(newY));
});

ipcMain.on('set-slideshow-state', (event, playing) => {
  isSlideshowPlaying = playing;
});

ipcMain.on('save-config', (event, newConfig) => {
  const config = loadConfig();
  const mergedConfig = { ...config, ...newConfig };
  saveConfig(mergedConfig);
});

ipcMain.on('open-options', (event) => {
  if (optionsWindow) {
    optionsWindow.focus();
    return;
  }
  optionsWindow = new BrowserWindow({
    width: 500,
    height: 750,
    title: "Options",
    resizable: false,
    icon: path.join(__dirname, 'assets/icons/app-icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  optionsWindow.loadFile('options.html');
  optionsWindow.on('closed', () => { optionsWindow = null; });
});

ipcMain.on('update-options', (event, newOptions) => {
  let config = loadConfig();
  Object.assign(config, newOptions);
  saveConfig(config);
  if (mainWindow) {
    mainWindow.webContents.send('options-updated', newOptions);
    if (typeof newOptions.alwaysOnTop !== 'undefined') {
      mainWindow.setAlwaysOnTop(newOptions.alwaysOnTop);
    }
    if (typeof newOptions.opacity !== 'undefined') {
      mainWindow.setOpacity(newOptions.opacity / 100);
    }
  }
});

// Auto-updater event listeners

autoUpdater.on("checking-for-update", () => {
  writeMessageToWindow("Checking for updates...");
});
autoUpdater.on("update-available", () => {
  writeMessageToWindow("A new version is available and ready to update.");
});
autoUpdater.on("update-not-available", () => {
  writeMessageToWindow("You are using the latest version.");
});
autoUpdater.on("error", (err) => {
  writeMessageToWindow("Error occurred: " + err);
});
autoUpdater.on("download-progress", (progressObj) => {
  let progressMsg = "Downloaded " + progressObj.percent + "%";
  writeMessageToWindow(progressMsg);
});
autoUpdater.on("update-downloaded", (info) => {
  writeMessageToWindow("Update file downloaded successfully.");
  const option = {
    type: "question",
    buttons: ["Yes", "No"],
    defaultId: 0,
    title: "UPDATER",
    message: "Would you like to install the update now?",
  };
  dialog.showMessageBox(mainWindow, option).then(function(res) {
    writeMessageToWindow(res.response.toString());
    if (res.response == 0) {
      writeMessageToWindow('Closing application and installing update...');
      autoUpdater.quitAndInstall();
    } else {
      writeMessageToWindow('Update postponed by the user.');
    }
  });
});
ipcMain.on('restart_app', () => {
  autoUpdater.quitAndInstall();
});

// Log messages received from renderer
ipcMain.on('renderer-log', (event, message) => {
  console.log('Renderer Log:', message);
});
