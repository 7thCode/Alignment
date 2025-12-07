const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // API Key Management
  saveApiKey: (service, apiKey) => ipcRenderer.invoke('save-api-key', service, apiKey),
  getApiKey: (service) => ipcRenderer.invoke('get-api-key', service),
  deleteApiKey: (service) => ipcRenderer.invoke('delete-api-key', service),
  
  // Workflow File Management
  saveWorkflow: (workflowData) => ipcRenderer.invoke('save-workflow-dialog', workflowData),
  loadWorkflow: () => ipcRenderer.invoke('load-workflow-dialog'),

  // Model Management
  modelList: () => ipcRenderer.invoke('model:list'),
  modelPresets: () => ipcRenderer.invoke('model:presets'),
  modelAdd: () => ipcRenderer.invoke('model:add'),
  modelDelete: (modelId) => ipcRenderer.invoke('model:delete', modelId),
  modelDownload: (modelConfig) => ipcRenderer.invoke('model:download', modelConfig),
  modelCancelDownload: (downloadId) => ipcRenderer.invoke('model:cancelDownload', downloadId),
  modelLoad: (modelPath) => ipcRenderer.invoke('model:load', modelPath),
  modelUnload: () => ipcRenderer.invoke('model:unload'),
  modelCurrent: () => ipcRenderer.invoke('model:current'),
  modelPrompt: (prompt, options) => ipcRenderer.invoke('model:prompt', { prompt, options }),
  
  // Model Directory Management
  modelsDirSelect: () => ipcRenderer.invoke('modelsDir:select'),
  modelsDirGet: () => ipcRenderer.invoke('modelsDir:get'),
  modelsDirSet: (dirPath) => ipcRenderer.invoke('modelsDir:set', dirPath),

  // Event listeners for model operations
  onDownloadProgress: (callback) => {
    ipcRenderer.on('download:progress', (event, data) => callback(data));
  },
  onDownloadComplete: (callback) => {
    ipcRenderer.on('download:complete', (event, data) => callback(data));
  },
  onDownloadError: (callback) => {
    ipcRenderer.on('download:error', (event, data) => callback(data));
  },
  onModelLoadStatus: (callback) => {
    ipcRenderer.on('model:loadStatus', (event, data) => callback(data));
  }
});
