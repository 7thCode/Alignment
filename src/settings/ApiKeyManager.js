/**
 * API Key Manager
 * Handles API key storage and retrieval
 */
class ApiKeyManager {
  constructor() {
    this.loadApiKeys();
  }

  async saveApiKey(service, apiKey) {
    const result = await window.electronAPI.saveApiKey(service, apiKey);
    if (result.success) {
      console.log(`API key for ${service} saved successfully`);
      return true;
    } else {
      console.error(`Failed to save API key for ${service}:`, result.error);
      alert(`APIキーの保存に失敗しました: ${result.error}`);
      return false;
    }
  }

  async getApiKey(service) {
    const result = await window.electronAPI.getApiKey(service);
    if (result.success) {
      return result.apiKey;
    } else {
      return null;
    }
  }

  async deleteApiKey(service) {
    const result = await window.electronAPI.deleteApiKey(service);
    if (result.success) {
      console.log(`API key for ${service} deleted successfully`);
      return true;
    } else {
      console.error(`Failed to delete API key for ${service}:`, result.error);
      return false;
    }
  }

  async loadApiKeys() {
    // Load existing API keys into the settings UI
    const services = ['brave-search', 'openai', 'grok'];
    
    for (const service of services) {
      const apiKey = await this.getApiKey(service);
      if (apiKey) {
        const inputId = this.getInputIdForService(service);
        const input = document.getElementById(inputId);
        if (input) {
          input.value = '••••••••'; // Show masked value
          input.dataset.hasSaved = 'true';
        }
      }
    }
  }

  getInputIdForService(service) {
    const mapping = {
      'brave-search': 'brave-api-key',
      'openai': 'openai-api-key',
      'grok': 'grok-api-key'
    };
    return mapping[service];
  }

  getServiceForInputId(inputId) {
    const mapping = {
      'brave-api-key': 'brave-search',
      'openai-api-key': 'openai',
      'grok-api-key': 'grok'
    };
    return mapping[inputId];
  }
}

// Global functions for settings modal
function openSettingsModal() {
  const modal = document.getElementById('settings-modal');
  modal.classList.remove('hidden');
}

function closeSettingsModal() {
  const modal = document.getElementById('settings-modal');
  modal.classList.add('hidden');
}

async function saveApiKey(service) {
  const apiKeyManager = window.apiKeyManager;
  if (!apiKeyManager) return;
  
  const inputId = apiKeyManager.getInputIdForService(service);
  const input = document.getElementById(inputId);
  
  if (!input) return;
  
  const apiKey = input.value;
  
  // Don't save if it's the masked value
  if (apiKey === '••••••••') {
    alert('APIキーが変更されていません');
    return;
  }
  
  if (!apiKey || apiKey.trim() === '') {
    alert('APIキーを入力してください');
    return;
  }
  
  const success = await apiKeyManager.saveApiKey(service, apiKey);
  if (success) {
    alert('APIキーを保存しました');
    input.value = '••••••••';
    input.dataset.hasSaved = 'true';
  }
}

// Make functions available globally
if (typeof window !== 'undefined') {
  window.ApiKeyManager = ApiKeyManager;
  window.openSettingsModal = openSettingsModal;
  window.closeSettingsModal = closeSettingsModal;
  window.saveApiKey = saveApiKey;
}
