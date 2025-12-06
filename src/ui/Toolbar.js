/**
 * Toolbar - Manages toolbar interactions
 */
class Toolbar {
  constructor(callbacks) {
    this.callbacks = callbacks;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Add Node button
    const addNodeBtn = document.getElementById('add-node-btn');
    const addNodeMenu = document.getElementById('add-node-menu');
    
    addNodeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      addNodeMenu.classList.toggle('hidden');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!addNodeMenu.contains(e.target) && e.target !== addNodeBtn) {
        addNodeMenu.classList.add('hidden');
      }
    });
    
    // Node type selection
    addNodeMenu.querySelectorAll('.menu-item').forEach(item => {
      item.addEventListener('click', () => {
        const nodeType = item.dataset.nodeType;
        if (this.callbacks.onAddNode) {
          this.callbacks.onAddNode(nodeType);
        }
        addNodeMenu.classList.add('hidden');
      });
    });
    
    // Execute button
    const executeBtn = document.getElementById('execute-btn');
    executeBtn.addEventListener('click', () => {
      if (this.callbacks.onExecute) {
        this.callbacks.onExecute();
      }
    });
    
    // Auto-execute toggle
    const autoExecuteToggle = document.getElementById('auto-execute-toggle');
    autoExecuteToggle.addEventListener('change', (e) => {
      if (this.callbacks.onAutoExecuteChange) {
        this.callbacks.onAutoExecuteChange(e.target.checked);
      }
    });
    
    // Save button
    const saveBtn = document.getElementById('save-btn');
    saveBtn.addEventListener('click', () => {
      if (this.callbacks.onSave) {
        this.callbacks.onSave();
      }
    });
    
    // Load button
    const loadBtn = document.getElementById('load-btn');
    loadBtn.addEventListener('click', () => {
      if (this.callbacks.onLoad) {
        this.callbacks.onLoad();
      }
    });
    
    // Settings button
    const settingsBtn = document.getElementById('settings-btn');
    settingsBtn.addEventListener('click', () => {
      if (this.callbacks.onSettings) {
        this.callbacks.onSettings();
      }
    });
  }

  setExecuting(isExecuting) {
    const executeBtn = document.getElementById('execute-btn');
    if (isExecuting) {
      executeBtn.disabled = true;
      executeBtn.style.opacity = '0.5';
    } else {
      executeBtn.disabled = false;
      executeBtn.style.opacity = '1';
    }
  }
}

// Make Toolbar available globally
if (typeof window !== 'undefined') {
  window.Toolbar = Toolbar;
}
