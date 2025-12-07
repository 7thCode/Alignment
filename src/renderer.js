/**
 * Main renderer process
 * Initializes and coordinates all UI components
 */

// Global state
let canvas;
let nodeRenderer;
let connectionRenderer;
let toolbar;
let workflowEngine;
let workflowManager;
let apiKeyManager;
let pluginLoader;

let nextNodeId = 1;
let nextConnectionId = 1;
let selectedNodeId = null;
let connectingPort = null;

// Initialize the application
function initApp() {
  console.log('Initializing AI Alignment Workflow Editor...');
  
  // Initialize core systems
  workflowEngine = new WorkflowEngine();
  apiKeyManager = new ApiKeyManager();
  pluginLoader = new PluginLoader(window.nodeRegistry);
  
  // Make globally accessible
  window.apiKeyManager = apiKeyManager;
  window.workflowEngine = workflowEngine;
  window.pluginLoader = pluginLoader;
  
  // Initialize UI components
  const canvasElement = document.getElementById('canvas');
  const nodesLayerElement = document.getElementById('nodes-layer');
  
  canvas = new Canvas(canvasElement, nodesLayerElement);
  
  nodeRenderer = new NodeRenderer(
    nodesLayerElement,
    handleNodeSelect,
    handleNodeMove,
    handlePortClick
  );
  
  connectionRenderer = new ConnectionRenderer(canvas, nodeRenderer, handleConnectionDelete);
  
  toolbar = new Toolbar({
    onAddNode: handleAddNode,
    onExecute: handleExecute,
    onAutoExecuteChange: handleAutoExecuteChange,
    onSave: handleSave,
    onLoad: handleLoad,
    onSettings: handleSettings
  });
  
  workflowManager = new WorkflowManager(workflowEngine, nodeRenderer, connectionRenderer);
  
  console.log('Application initialized successfully');
}

// Event Handlers
function handleAddNode(nodeType) {
  if (nodeType === 'custom') {
    // TODO: Implement custom node addition UI
    alert('カスタムノード機能は近日実装予定です');
    return;
  }
  
  const nodeId = `node-${nextNodeId++}`;
  const position = {
    x: 100 + (nextNodeId * 20),
    y: 100 + (nextNodeId * 20)
  };
  
  const node = window.nodeRegistry.createNode(nodeType, nodeId, position);
  
  if (node) {
    workflowEngine.addNode(node);
    nodeRenderer.renderNode(node);
    console.log(`Added node: ${nodeId} (${nodeType})`);
  } else {
    alert(`ノードタイプが見つかりません: ${nodeType}`);
  }
}

function handleNodeSelect(nodeId) {
  // Deselect previous node
  if (selectedNodeId) {
    const prevNode = workflowEngine.nodes.get(selectedNodeId);
    if (prevNode) {
      prevNode.selected = false;
      nodeRenderer.updateNode(prevNode);
    }
  }
  
  // Select new node
  selectedNodeId = nodeId;
  const node = workflowEngine.nodes.get(nodeId);
  if (node) {
    node.selected = true;
    nodeRenderer.updateNode(node);
  }
  
  // TODO: Update sidebar with node properties
}

function handleNodeMove(nodeId) {
  // Redraw connections when node moves
  connectionRenderer.render();
}

function handlePortClick(nodeId, port, direction, x, y) {
  if (direction === 'output') {
    // Start connection from output port
    canvas.startConnection(nodeId, port, x, y);
    connectingPort = { nodeId, port, direction };
  } else if (direction === 'input') {
    // End connection at input port
    if (canvas.isConnecting && connectingPort && connectingPort.direction === 'output') {
      const connectionData = canvas.endConnection(nodeId, port);
      
      if (connectionData) {
        const connectionId = `conn-${nextConnectionId++}`;
        const connection = new Connection(
          connectionId,
          connectionData.from.nodeId,
          connectionData.to.nodeId,
          connectionData.from.port,
          connectionData.to.port
        );
        
        const fromNode = workflowEngine.nodes.get(connection.from.nodeId);
        const toNode = workflowEngine.nodes.get(connection.to.nodeId);
        
        if (fromNode && toNode) {
          workflowEngine.addConnection(connection);
          connectionRenderer.addConnection(connection, fromNode, toNode);
          connectionRenderer.render();
          
          console.log(`Created connection: ${connectionId}`);
          
          // Auto-execute if enabled
          if (workflowEngine.autoExecute) {
            handleExecute();
          }
        }
      }
      
      connectingPort = null;
    } else {
      canvas.cancelConnection();
    }
  }
}

function handleConnectionDelete(connectionId) {
  // Remove from workflow engine
  workflowEngine.removeConnection(connectionId);
  
  // Remove from renderer
  connectionRenderer.removeConnection(connectionId);
  
  // Re-render
  connectionRenderer.render();
  
  console.log(`Deleted connection: ${connectionId}`);
}

async function handleExecute() {
  console.log('Executing workflow...');
  
  // Show loading indicator
  const loadingIndicator = document.getElementById('loading-indicator');
  loadingIndicator.classList.remove('hidden');
  toolbar.setExecuting(true);
  
  try {
    const success = await workflowEngine.execute(
      (node) => {
        console.log(`Executing node: ${node.id}`);
        nodeRenderer.updateNode(node);
      },
      (node, result) => {
        console.log(`Node completed: ${node.id}`, result);
        nodeRenderer.updateNode(node);
      },
      (node, error) => {
        console.error(`Node error: ${node.id}`, error);
        nodeRenderer.updateNode(node);
        alert(`ノード ${node.id} でエラーが発生しました:\n${error.message}`);
      }
    );
    
    if (success) {
      console.log('Workflow executed successfully');
    } else {
      console.error('Workflow execution failed');
    }
  } catch (error) {
    console.error('Workflow execution error:', error);
    alert(`実行エラー: ${error.message}`);
  } finally {
    loadingIndicator.classList.add('hidden');
    toolbar.setExecuting(false);
  }
}

function handleAutoExecuteChange(enabled) {
  workflowEngine.autoExecute = enabled;
  console.log(`Auto-execute ${enabled ? 'enabled' : 'disabled'}`);
}

async function handleSave() {
  await workflowManager.saveWorkflow();
}

async function handleLoad() {
  await workflowManager.loadWorkflow();
  connectionRenderer.render();
}

function handleSettings() {
  openSettingsModal();
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Delete key disabled - use delete button on node instead
  // if (e.key === 'Delete' || e.key === 'Backspace') {
  //   if (selectedNodeId) {
  //     const node = workflowEngine.nodes.get(selectedNodeId);
  //     if (node) {
  //       workflowEngine.removeNode(selectedNodeId);
  //       nodeRenderer.removeNode(selectedNodeId);
  //       selectedNodeId = null;
  //       connectionRenderer.render();
  //       console.log(`Deleted node: ${selectedNodeId}`);
  //     }
  //   }
  // }
  
  // Escape to cancel connection
  if (e.key === 'Escape') {
    if (canvas.isConnecting) {
      canvas.cancelConnection();
      connectingPort = null;
    }
  }
  
  // Cmd/Ctrl + S to save
  if ((e.metaKey || e.ctrlKey) && e.key === 's') {
    e.preventDefault();
    handleSave();
  }
  
  // Cmd/Ctrl + O to load
  if ((e.metaKey || e.ctrlKey) && e.key === 'o') {
    e.preventDefault();
    handleLoad();
  }
});

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
