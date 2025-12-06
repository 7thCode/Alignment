/**
 * Connection between two nodes
 */
class Connection {
  constructor(id, fromNode, toNode, fromPort = 'output', toPort = 'input') {
    this.id = id;
    this.from = {
      nodeId: fromNode,
      port: fromPort
    };
    this.to = {
      nodeId: toNode,
      port: toPort
    };
  }

  /**
   * Serialize connection to JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      from: this.from,
      to: this.to
    };
  }

  /**
   * Restore connection from JSON
   * @param {Object} data
   * @returns {Connection}
   */
  static fromJSON(data) {
    return new Connection(
      data.id,
      data.from.nodeId,
      data.to.nodeId,
      data.from.port,
      data.to.port
    );
  }
}

// Make Connection available globally
if (typeof window !== 'undefined') {
  window.Connection = Connection;
}
