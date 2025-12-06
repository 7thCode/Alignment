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
  loadWorkflow: () => ipcRenderer.invoke('load-workflow-dialog')
});
