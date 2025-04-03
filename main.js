const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');

/**
 * By default,
 * electron-updater automatically downloads the update installer
 * and applies the update upon application exit.
 * Setting autoInstallOnAppQuit = false
 * prevents the update from being automatically installed
 * when the application is closed.
 */
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
          // Open custom about window (or use app.setAboutPanelOptions)
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
              preload: path.join(__dirname, 'preload.js') // preload 스크립트 지정
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

// Return full path to config.json in the user data folder
function getConfigPath() {
  // macOS: ~/Library/Application Support/YourAppName
  // Windows: %AppData%/YourAppName
  // Linux: ~/.config/YourAppName
  const userData = app.getPath('userData');
  return path.join(userData, 'config.json');
}

// Load configuration from config.json (from userData folder)
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

// Save configuration to config.json in the userData folder
function saveConfig(config) {
  const configFile = getConfigPath();
  try {
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving config file:', err);
  }
}

// Recursive directory walk with error handling (skip errors like EPERM)
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

function writeMessageToWindow(text) {
  mainWindow.webContents.send("message", text);
}

function createWindow() {
  const config = loadConfig();
  const opacity = config.opacity !== undefined ? config.opacity : 100;

  // Create the main window with restored size, position, alwaysOnTop, opacity, and transparent background.
  mainWindow = new BrowserWindow({
    width: config.windowWidth || 400,
    height: config.windowHeight || 300,
    x: config.windowX,
    y: config.windowY,
    frame: false,
    transparent: true, // Enable transparent background
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

  // (config.checkUpdate && process.platform !== 'darwin')
  if (config.checkUpdate) {
    autoUpdater.checkForUpdatesAndNotify();
  }

  // Save window bounds and final options on close (including last folder & options)
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

  // Add a context menu with toggle, "Open Folder", "Options", and "Quit"
  mainWindow.webContents.on('context-menu', (event, params) => {
    const toggleLabel = isSlideshowPlaying ? 'Pause' : 'Play';
    const menu = Menu.buildFromTemplate([
      { 
        label: toggleLabel, 
        click: () => { mainWindow.webContents.send('context-menu-command', 'toggle-playback'); } 
      },
      { 
        label: 'Open Folder', 
        click: () => { mainWindow.webContents.send('context-menu-command', 'open-folder'); } 
      },
      { 
        label: 'Options', 
        click: () => { mainWindow.webContents.send('context-menu-command', 'options'); } 
      },
      { type: 'separator' },
      { 
        label: 'Exit', 
        click: () => { app.quit(); } 
      }
    ]);
    menu.popup({ window: mainWindow });
  });
  
  // If lastFolderPath exists in config and the folder exists, auto-start slideshow.
  if (config.lastFolderPath && fs.existsSync(config.lastFolderPath)) {
    mainWindow.webContents.on('did-finish-load', () => {
      mainWindow.webContents.send('auto-start-folder', config);
    });
  }
}

app.whenReady().then(createWindow);

// IPC handler: Returns saved configuration to renderer
ipcMain.handle('get-config', () => {
  return loadConfig();
});

// IPC handler: Open folder and return file list
ipcMain.handle('select-folder', async (event, options) => {
  const result = await dialog.showOpenDialog({
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

// IPC handler: Load folder from given path
ipcMain.handle('load-folder-from-path', async (event, folderPath, options) => {
  if (!fs.existsSync(folderPath)) {
    return [];
  }
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

// IPC handler: Resize window
ipcMain.handle('resize-window', async (event, newWidth, newHeight) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  win.setSize(Math.round(newWidth), Math.round(newHeight));
});

// IPC handler: Get window position
ipcMain.handle('get-window-position', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  return win.getPosition();
});

// IPC handler: Move window
ipcMain.on('move-window', (event, newX, newY) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  win.setPosition(Math.round(newX), Math.round(newY));
});

// IPC handler: Update slideshow playing state
ipcMain.on('set-slideshow-state', (event, playing) => {
  isSlideshowPlaying = playing;
});

// IPC handler: Save configuration from renderer
ipcMain.on('save-config', (event, newConfig) => {
  const config = loadConfig();
  const mergedConfig = { ...config, ...newConfig };
  saveConfig(mergedConfig);
});

// IPC handler: Open options window (separate from main window)
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
  optionsWindow.on('closed', () => {
    optionsWindow = null;
  });
});

// IPC handler: Update options from options window
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

// Called when checking for a new update version
autoUpdater.on("checking-for-update", () => {
  writeMessageToWindow("Checking for updates...");
});

// Called when a new update version is available
autoUpdater.on("update-available", () => {
  writeMessageToWindow("A new version is available and ready to update.");
});

// Called when there are no new update versions available
autoUpdater.on("update-not-available", () => {
  writeMessageToWindow("You are using the latest version.");
});

// Called when an error occurs during update checking
autoUpdater.on("error", (err) => {
  writeMessageToWindow("Error occurred: " + err);
});

// Receives download progress of the update file
autoUpdater.on("download-progress", (progressObj) => {
  let progressMsg = "Downloaded " + progressObj.percent + "%";
  writeMessageToWindow(progressMsg);
});

// Called when the update file download completes; prompts user to install
autoUpdater.on("update-downloaded", (info) => {
  writeMessageToWindow("Update file downloaded successfully.");

  const option = {
    type: "question",
    buttons: ["Yes", "No"],
    defaultId: 0,
    title: "UPDATER",
    message: "Would you like to install the update now?",
  };

  dialog.showMessageBox(mainWindow, option).then(function(res){
    writeMessageToWindow(res.response.toString());

    // res.response corresponds to the index of option.buttons above
    if(res.response == 0){
      writeMessageToWindow('Closing application and installing update...');
      autoUpdater.quitAndInstall();
    }
    else{
      writeMessageToWindow('Update postponed by the user.');
    }
  });
});

ipcMain.on('restart_app', () => {
  autoUpdater.quitAndInstall();
});