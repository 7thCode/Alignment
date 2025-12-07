const { app, BrowserWindow, ipcMain, safeStorage, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;

// Model management imports
const ModelManager = require('./src/backend/model-manager');
const LlamaManager = require('./src/backend/llama-manager');
const ModelDownloader = require('./src/backend/model-downloader');
const IPCHandlersModels = require('./src/backend/ipc-handlers-models');
const { MODELS_DIR, SETTINGS_PATH, DEFAULT_SETTINGS } = require('./src/shared/constants');

let mainWindow;
let API_KEYS_FILE = null;

// Model management instances
let modelManager;
let llamaManager;
let modelDownloader;
let ipcHandlersModels;

function getApiKeysFile() {
  if (!API_KEYS_FILE) {
    API_KEYS_FILE = path.join(app.getPath('userData'), 'api-keys.json');
  }
  return API_KEYS_FILE;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, 'build/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#1a1a1a',
    titleBarStyle: 'hiddenInset'
  });

  mainWindow.loadFile('index.html');

  // Open DevTools in development
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}

async function initializeModelManagement() {
  try {
    // Load settings to get custom models directory if set
    let settings = { ...DEFAULT_SETTINGS };
    try {
      const data = await fs.readFile(SETTINGS_PATH, 'utf-8');
      settings = { ...settings, ...JSON.parse(data) };
    } catch {
      // Settings file doesn't exist yet, use defaults
    }

    const modelsDir = settings.modelsDirectory || MODELS_DIR;

    // Initialize managers
    modelManager = new ModelManager(modelsDir);
    llamaManager = new LlamaManager();
    modelDownloader = new ModelDownloader(mainWindow, modelsDir);

    // Initialize models directory
    await modelManager.initialize();

    // Register IPC handlers
    ipcHandlersModels = new IPCHandlersModels(
      mainWindow,
      modelManager,
      modelDownloader,
      llamaManager
    );
    ipcHandlersModels.registerAll();

    console.log('Model management initialized');
  } catch (error) {
    console.error('Failed to initialize model management:', error);
  }
}

app.whenReady().then(async () => {
  createWindow();
  await initializeModelManagement();

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

// API Key Management
ipcMain.handle('save-api-key', async (event, service, apiKey) => {
  try {
    // Load existing keys
    let keys = {};
    try {
      const data = await fs.readFile(getApiKeysFile(), 'utf-8');
      keys = JSON.parse(data);
    } catch (err) {
      // File doesn't exist yet, that's ok
    }

    // Encrypt the API key
    if (safeStorage.isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(apiKey);
      keys[service] = encrypted.toString('base64');
    } else {
      throw new Error('Encryption not available on this system');
    }

    // Save to file
    await fs.writeFile(getApiKeysFile(), JSON.stringify(keys, null, 2));
    return { success: true };
  } catch (error) {
    console.error('Error saving API key:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-api-key', async (event, service) => {
  try {
    const data = await fs.readFile(getApiKeysFile(), 'utf-8');
    const keys = JSON.parse(data);
    
    if (keys[service] && safeStorage.isEncryptionAvailable()) {
      const encrypted = Buffer.from(keys[service], 'base64');
      const decrypted = safeStorage.decryptString(encrypted);
      return { success: true, apiKey: decrypted };
    }
    
    return { success: false, error: 'API key not found' };
  } catch (error) {
    console.error('Error getting API key:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-api-key', async (event, service) => {
  try {
    const data = await fs.readFile(getApiKeysFile(), 'utf-8');
    const keys = JSON.parse(data);
    
    delete keys[service];
    
    await fs.writeFile(getApiKeysFile(), JSON.stringify(keys, null, 2));
    return { success: true };
  } catch (error) {
    console.error('Error deleting API key:', error);
    return { success: false, error: error.message };
  }
});

// Workflow File Management
ipcMain.handle('save-workflow-dialog', async (event, workflowData) => {
  try {
    const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Workflow',
      defaultPath: path.join(app.getPath('documents'), 'workflow.json'),
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (canceled || !filePath) {
      return { success: false, canceled: true };
    }

    await fs.writeFile(filePath, JSON.stringify(workflowData, null, 2));
    return { success: true, filePath };
  } catch (error) {
    console.error('Error saving workflow:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('load-workflow-dialog', async () => {
  try {
    const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, {
      title: 'Load Workflow',
      defaultPath: app.getPath('documents'),
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (canceled || filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    const data = await fs.readFile(filePaths[0], 'utf-8');
    const workflowData = JSON.parse(data);
    return { success: true, data: workflowData, filePath: filePaths[0] };
  } catch (error) {
    console.error('Error loading workflow:', error);
    return { success: false, error: error.message };
  }
});
