/**
 * Base Node class - all node types inherit from this
 */
class Node {
  constructor(id, type, position = { x: 0, y: 0 }) {
    this.id = id;
    this.type = type;
    this.position = position;
    this.inputs = [];
    this.outputs = ['output'];
    this.parameters = {};
    this.status = 'idle'; // idle, ready, executing, completed, error
    this.result = null;
    this.error = null;
  }

  /**
   * Execute the node with given input data
   * @param {Object} inputData - Data from connected input nodes
   * @returns {Promise<any>} - Result of the node execution
   */
  async execute(inputData) {
    throw new Error('execute() must be implemented by subclass');
  }

  /**
   * Validate the node configuration
   * @returns {boolean} - Whether the node is properly configured
   */
  validate() {
    return true;
  }

  /**
   * Get the display name for this node type
   * @returns {string}
   */
  getDisplayName() {
    return this.type;
  }

  /**
   * Get parameter definitions for UI rendering
   * @returns {Array<{name: string, type: string, label: string, default: any}>}
   */
  getParameterDefinitions() {
    return [];
  }

  /**
   * Serialize node to JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      position: this.position,
      parameters: this.parameters
    };
  }

  /**
   * Restore node from JSON
   * @param {Object} data
   */
  fromJSON(data) {
    this.id = data.id;
    this.type = data.type;
    this.position = data.position;
    this.parameters = data.parameters || {};
  }

  /**
   * Reset node state
   */
  reset() {
    this.status = 'idle';
    this.result = null;
    this.error = null;
  }
}

// Make Node available globally
if (typeof window !== 'undefined') {
  window.Node = Node;
}
