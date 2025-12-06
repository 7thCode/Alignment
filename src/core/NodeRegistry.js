/**
 * Registry for managing node types
 */
class NodeRegistry {
  constructor() {
    this.nodeTypes = new Map();
  }

  /**
   * Register a node type
   * @param {string} type - Node type identifier
   * @param {class} nodeClass - Node class constructor
   * @param {Object} metadata - Additional metadata (displayName, description, etc.)
   */
  register(type, nodeClass, metadata = {}) {
    this.nodeTypes.set(type, {
      class: nodeClass,
      metadata: {
        displayName: metadata.displayName || type,
        description: metadata.description || '',
        category: metadata.category || 'default',
        ...metadata
      }
    });
    console.log(`Registered node type: ${type}`);
  }

  /**
   * Get a node class by type
   * @param {string} type
   * @returns {class|null}
   */
  getNodeClass(type) {
    const nodeType = this.nodeTypes.get(type);
    return nodeType ? nodeType.class : null;
  }

  /**
   * Get node metadata
   * @param {string} type
   * @returns {Object|null}
   */
  getMetadata(type) {
    const nodeType = this.nodeTypes.get(type);
    return nodeType ? nodeType.metadata : null;
  }

  /**
   * Create a new node instance
   * @param {string} type
   * @param {string} id
   * @param {Object} position
   * @returns {Node|null}
   */
  createNode(type, id, position) {
    const NodeClass = this.getNodeClass(type);
    if (!NodeClass) {
      console.error(`Node type not found: ${type}`);
      return null;
    }
    return new NodeClass(id, position);
  }

  /**
   * Get all registered node types
   * @returns {Array<{type: string, metadata: Object}>}
   */
  getAllTypes() {
    const types = [];
    this.nodeTypes.forEach((value, key) => {
      types.push({
        type: key,
        metadata: value.metadata
      });
    });
    return types;
  }

  /**
   * Get node types by category
   * @param {string} category
   * @returns {Array<{type: string, metadata: Object}>}
   */
  getTypesByCategory(category) {
    return this.getAllTypes().filter(t => t.metadata.category === category);
  }

  /**
   * Check if a node type exists
   * @param {string} type
   * @returns {boolean}
   */
  hasType(type) {
    return this.nodeTypes.has(type);
  }

  /**
   * Unregister a node type
   * @param {string} type
   */
  unregister(type) {
    this.nodeTypes.delete(type);
    console.log(`Unregistered node type: ${type}`);
  }
}

// Create global registry instance
if (typeof window !== 'undefined') {
  window.nodeRegistry = new NodeRegistry();
}
