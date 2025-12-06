/**
 * Workflow execution engine
 * Manages the execution of nodes in the correct order
 */
class WorkflowEngine {
  constructor() {
    this.nodes = new Map();
    this.connections = new Map();
    this.autoExecute = false;
    this.isExecuting = false;
  }

  /**
   * Add a node to the workflow
   * @param {Node} node
   */
  addNode(node) {
    this.nodes.set(node.id, node);
  }

  /**
   * Remove a node from the workflow
   * @param {string} nodeId
   */
  removeNode(nodeId) {
    this.nodes.delete(nodeId);
    // Remove connections involving this node
    this.connections.forEach((conn, id) => {
      if (conn.from.nodeId === nodeId || conn.to.nodeId === nodeId) {
        this.connections.delete(id);
      }
    });
  }

  /**
   * Add a connection between nodes
   * @param {Connection} connection
   */
  addConnection(connection) {
    this.connections.set(connection.id, connection);
  }

  /**
   * Remove a connection
   * @param {string} connectionId
   */
  removeConnection(connectionId) {
    this.connections.delete(connectionId);
  }

  /**
   * Get all nodes connected to a node's input
   * @param {string} nodeId
   * @returns {Array<{node: Node, port: string}>}
   */
  getInputNodes(nodeId) {
    const inputNodes = [];
    this.connections.forEach(conn => {
      if (conn.to.nodeId === nodeId) {
        const node = this.nodes.get(conn.from.nodeId);
        if (node) {
          inputNodes.push({
            node,
            port: conn.to.port,
            fromPort: conn.from.port
          });
        }
      }
    });
    return inputNodes;
  }

  /**
   * Get all nodes connected to a node's output
   * @param {string} nodeId
   * @returns {Array<Node>}
   */
  getOutputNodes(nodeId) {
    const outputNodes = [];
    this.connections.forEach(conn => {
      if (conn.from.nodeId === nodeId) {
        const node = this.nodes.get(conn.to.nodeId);
        if (node) {
          outputNodes.push(node);
        }
      }
    });
    return outputNodes;
  }

  /**
   * Build execution order using topological sort
   * @returns {Array<Node>} - Ordered array of nodes
   */
  buildExecutionOrder() {
    const order = [];
    const visited = new Set();
    const visiting = new Set();

    const visit = (nodeId) => {
      if (visited.has(nodeId)) return;
      if (visiting.has(nodeId)) {
        throw new Error('Circular dependency detected in workflow');
      }

      visiting.add(nodeId);

      const inputNodes = this.getInputNodes(nodeId);
      for (const { node } of inputNodes) {
        visit(node.id);
      }

      visiting.delete(nodeId);
      visited.add(nodeId);
      
      const node = this.nodes.get(nodeId);
      if (node) {
        order.push(node);
      }
    };

    // Visit all nodes
    this.nodes.forEach((node, id) => {
      if (!visited.has(id)) {
        visit(id);
      }
    });

    return order;
  }

  /**
   * Execute the workflow
   * @param {Function} onNodeStart - Callback when node starts executing
   * @param {Function} onNodeComplete - Callback when node completes
   * @param {Function} onNodeError - Callback when node errors
   * @returns {Promise<boolean>} - Success status
   */
  async execute(onNodeStart, onNodeComplete, onNodeError) {
    if (this.isExecuting) {
      console.warn('Workflow is already executing');
      return false;
    }

    this.isExecuting = true;

    try {
      // Reset all nodes
      this.nodes.forEach(node => node.reset());

      // Build execution order
      const executionOrder = this.buildExecutionOrder();

      // Execute nodes in order
      for (const node of executionOrder) {
        if (onNodeStart) onNodeStart(node);

        node.status = 'executing';

        try {
          // Gather input data from connected nodes
          const inputData = {};
          const inputNodes = this.getInputNodes(node.id);
          
          for (const { node: inputNode, port } of inputNodes) {
            if (!inputData[port]) {
              inputData[port] = [];
            }
            inputData[port].push(inputNode.result);
          }

          // Merge multiple inputs for the same port
          Object.keys(inputData).forEach(port => {
            if (inputData[port].length === 1) {
              inputData[port] = inputData[port][0];
            }
          });

          // Execute the node
          const result = await node.execute(inputData);
          node.result = result;
          node.status = 'completed';

          if (onNodeComplete) onNodeComplete(node, result);

        } catch (error) {
          console.error(`Error executing node ${node.id}:`, error);
          node.status = 'error';
          node.error = error.message;

          if (onNodeError) onNodeError(node, error);

          // Stop execution on error
          this.isExecuting = false;
          return false;
        }
      }

      this.isExecuting = false;
      return true;

    } catch (error) {
      console.error('Workflow execution error:', error);
      this.isExecuting = false;
      return false;
    }
  }

  /**
   * Clear the workflow
   */
  clear() {
    this.nodes.clear();
    this.connections.clear();
  }

  /**
   * Validate the workflow
   * @returns {{valid: boolean, errors: Array<string>}}
   */
  validate() {
    const errors = [];

    // Check for circular dependencies
    try {
      this.buildExecutionOrder();
    } catch (error) {
      errors.push(error.message);
    }

    // Validate each node
    this.nodes.forEach(node => {
      if (!node.validate()) {
        errors.push(`Node ${node.id} (${node.type}) is not properly configured`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Make WorkflowEngine available globally
if (typeof window !== 'undefined') {
  window.WorkflowEngine = WorkflowEngine;
}
