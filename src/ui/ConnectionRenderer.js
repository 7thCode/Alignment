/**
 * ConnectionRenderer - Manages rendering of connections between nodes
 */
class ConnectionRenderer {
  constructor(canvas, nodeRenderer) {
    this.canvas = canvas;
    this.nodeRenderer = nodeRenderer;
    this.connections = new Map();
  }

  addConnection(connection, fromNode, toNode) {
    this.connections.set(connection.id, {
      connection,
      fromNode,
      toNode
    });
    
    // Update port visual state
    this.nodeRenderer.updatePortConnection(
      connection.from.nodeId,
      connection.from.port,
      'output',
      true
    );
    this.nodeRenderer.updatePortConnection(
      connection.to.nodeId,
      connection.to.port,
      'input',
      true
    );
  }

  removeConnection(connectionId) {
    const conn = this.connections.get(connectionId);
    if (conn) {
      // Update port visual state
      this.nodeRenderer.updatePortConnection(
        conn.connection.from.nodeId,
        conn.connection.from.port,
        'output',
        false
      );
      this.nodeRenderer.updatePortConnection(
        conn.connection.to.nodeId,
        conn.connection.to.port,
        'input',
        false
      );
      
      this.connections.delete(connectionId);
    }
  }

  render() {
    // Clear previous connections
    this.canvas.render(); // This clears the canvas
    
    // Draw all connections
    this.connections.forEach(({ connection, fromNode, toNode }) => {
      const fromEl = document.getElementById(`node-${fromNode.id}`);
      const toEl = document.getElementById(`node-${toNode.id}`);
      
      if (!fromEl || !toEl) return;
      
      // Get output port position
      const fromPort = fromEl.querySelector(`.port.output[data-port="${connection.from.port}"]`);
      const toPort = toEl.querySelector(`.port.input[data-port="${connection.to.port}"]`);
      
      if (!fromPort || !toPort) return;
      
      const fromRect = fromPort.getBoundingClientRect();
      const toRect = toPort.getBoundingClientRect();
      const canvasRect = this.canvas.canvas.getBoundingClientRect();
      
      const fromX = fromRect.right - canvasRect.left;
      const fromY = fromRect.top + fromRect.height / 2 - canvasRect.top;
      const toX = toRect.left - canvasRect.left;
      const toY = toRect.top + toRect.height / 2 - canvasRect.top;
      
      this.canvas.drawConnection(fromX, fromY, toX, toY, '#60a5fa', 2);
    });
  }

  clear() {
    this.connections.clear();
  }
}

// Make ConnectionRenderer available globally
if (typeof window !== 'undefined') {
  window.ConnectionRenderer = ConnectionRenderer;
}
