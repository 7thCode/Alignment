/**
 * Workflow Manager
 * Handles workflow save/load functionality
 */
class WorkflowManager {
  constructor(workflowEngine, nodeRenderer, connectionRenderer) {
    this.workflowEngine = workflowEngine;
    this.nodeRenderer = nodeRenderer;
    this.connectionRenderer = connectionRenderer;
    this.currentFilePath = null;
  }

  /**
   * Save current workflow to file
   */
  async saveWorkflow() {
    const workflowData = this.serializeWorkflow();
    
    try {
      const result = await window.electronAPI.saveWorkflow(workflowData);
      
      if (result.success) {
        this.currentFilePath = result.filePath;
        console.log('Workflow saved to:', result.filePath);
        alert('ワークフローを保存しました');
        return true;
      } else if (!result.canceled) {
        console.error('Failed to save workflow:', result.error);
        alert(`ワークフローの保存に失敗しました: ${result.error}`);
        return false;
      }
    } catch (error) {
      console.error('Error saving workflow:', error);
      alert(`エラーが発生しました: ${error.message}`);
      return false;
    }
    
    return false;
  }

  /**
   * Load workflow from file
   */
  async loadWorkflow() {
    try {
      const result = await window.electronAPI.loadWorkflow();
      
      if (result.success) {
        this.deserializeWorkflow(result.data);
        this.currentFilePath = result.filePath;
        console.log('Workflow loaded from:', result.filePath);
        alert('ワークフローを読み込みました');
        return true;
      } else if (!result.canceled) {
        console.error('Failed to load workflow:', result.error);
        alert(`ワークフローの読み込みに失敗しました: ${result.error}`);
        return false;
      }
    } catch (error) {
      console.error('Error loading workflow:', error);
      alert(`エラーが発生しました: ${error.message}`);
      return false;
    }
    
    return false;
  }

  /**
   * Serialize workflow to JSON
   */
  serializeWorkflow() {
    const nodes = [];
    const connections = [];
    
    // Serialize nodes
    this.workflowEngine.nodes.forEach(node => {
      nodes.push(node.toJSON());
    });
    
    // Serialize connections
    this.workflowEngine.connections.forEach(connection => {
      connections.push(connection.toJSON());
    });
    
    return {
      version: '1.0',
      nodes,
      connections,
      metadata: {
        created: new Date().toISOString(),
        nodeCount: nodes.length,
        connectionCount: connections.length
      }
    };
  }

  /**
   * Deserialize workflow from JSON
   */
  deserializeWorkflow(workflowData) {
    // Clear existing workflow
    this.clearWorkflow();
    
    // Restore nodes
    workflowData.nodes.forEach(nodeData => {
      const node = window.nodeRegistry.createNode(
        nodeData.type,
        nodeData.id,
        nodeData.position
      );
      
      if (node) {
        node.fromJSON(nodeData);
        this.workflowEngine.addNode(node);
        this.nodeRenderer.renderNode(node);
      } else {
        console.warn(`Failed to create node of type: ${nodeData.type}`);
      }
    });
    
    // Restore connections
    workflowData.connections.forEach(connData => {
      const connection = Connection.fromJSON(connData);
      const fromNode = this.workflowEngine.nodes.get(connection.from.nodeId);
      const toNode = this.workflowEngine.nodes.get(connection.to.nodeId);
      
      if (fromNode && toNode) {
        this.workflowEngine.addConnection(connection);
        this.connectionRenderer.addConnection(connection, fromNode, toNode);
      } else {
        console.warn('Failed to restore connection: node not found');
      }
    });
    
    // Render connections
    this.connectionRenderer.render();
  }

  /**
   * Clear the current workflow
   */
  clearWorkflow() {
    // Remove all node elements
    this.workflowEngine.nodes.forEach(node => {
      this.nodeRenderer.removeNode(node.id);
    });
    
    // Clear engine
    this.workflowEngine.clear();
    
    // Clear connection renderer
    this.connectionRenderer.clear();
    
    this.currentFilePath = null;
  }
}

// Make WorkflowManager available globally
if (typeof window !== 'undefined') {
  window.WorkflowManager = WorkflowManager;
}
